import { DEPRIVATION_THRESHOLD_DECILE } from "../../shared/const";

interface DeprivationData {
  matched: boolean;
  income: boolean;
  health: boolean;
}

interface IMDResponseData {
  matched: boolean;
  incomeDecile: number | null;
  healthDecile: number | null;
}

interface PollResponse {
  state: {
    [key: string]: number;
    Live: number;
    Terminated: number;
  };
  status: string;
  files?: {
    csv: string;
    xlsx: string;
  };
}

export class DeprivationService {
  private async fetchIMDData(postcode: string): Promise<any> {
    const formData = new FormData();
    formData.append("postcodes", postcode);

    const response = await fetch(
      "https://imd-by-postcode.opendatacommunities.org/imd/2019/ajax/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch IMD data: ${response.status} ${response.statusText}`
      );
    }

    const responseJson = await response.json();
    return responseJson;
  }

  private async pollForCompletion(pollPath: string): Promise<PollResponse> {
    const baseUrl = "https://imd-by-postcode.opendatacommunities.org";
    const maxAttempts = 30; // Maximum number of polling attempts
    const pollInterval = 1000; // 1 second between polls

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(baseUrl + pollPath);

      if (!response.ok) {
        throw new Error(
          `Failed to poll status: ${response.status} ${response.statusText}`
        );
      }

      const pollData = (await response.json()) as PollResponse;

      // Check if processing is complete
      if (pollData.status === "ok" && pollData.files) {
        return pollData;
      }

      // Check if there's an error state
      if (pollData.status !== "ok") {
        throw new Error(`Processing failed with status: ${pollData.status}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Timeout waiting for IMD data processing to complete");
  }

  private extractDownloadUrls(pollResponse: PollResponse): {
    csv: string;
    xlsx: string;
  } {
    // Extract CSV and XLSX download URLs from the poll response
    if (
      !pollResponse.files ||
      !pollResponse.files.csv ||
      !pollResponse.files.xlsx
    ) {
      throw new Error("Could not extract download URLs from IMD response");
    }

    const baseUrl = "https://imd-by-postcode.opendatacommunities.org";

    return {
      csv: baseUrl + pollResponse.files.csv,
      xlsx: baseUrl + pollResponse.files.xlsx,
    };
  }

  private async downloadCSV(csvUrl: string): Promise<string> {
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download CSV: ${response.status} ${response.statusText}`
      );
    }

    return await response.text();
  }

  private parseCSVForDeprivation(
    csvContent: string,
    postcode: string
  ): IMDResponseData {
    const lines = csvContent.split("\n");

    if (lines.length < 2) {
      throw new Error("Invalid CSV format: insufficient data");
    }

    // Find header indices
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/['"]/g, ""));
    const postcodeStatusIndex = headers.findIndex(
      (h) => h === "Postcode Status"
    );
    const healthDecileIndex = headers.findIndex(
      (h) => h === "Health and Disability Decile"
    );
    const incomeDecileIndex = headers.findIndex((h) => h === "Income Decile");
    const postcodeIndex = headers.findIndex((h) =>
      h.toLowerCase().includes("postcode")
    );

    if (
      healthDecileIndex === -1 ||
      incomeDecileIndex === -1 ||
      postcodeIndex === -1
    ) {
      throw new Error("Required columns not found in CSV");
    }

    // Find the row for our postcode
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/['"]/g, ""));

      if (values[postcodeStatusIndex] !== "Live") {
        console.log(values[postcodeStatusIndex]);
        return {
          matched: false,
          healthDecile: null,
          incomeDecile: null,
        };
      }

      if (
        values[postcodeIndex] &&
        values[postcodeIndex].replace(/\s/g, "").toLowerCase() ===
          postcode.replace(/\s/g, "").toLowerCase()
      ) {
        const healthDecile = parseInt(values[healthDecileIndex]);
        const incomeDecile = parseInt(values[incomeDecileIndex]);

        if (isNaN(healthDecile) || isNaN(incomeDecile)) {
          throw new Error("Invalid decile values in CSV data");
        }

        return {
          matched: true,
          healthDecile,
          incomeDecile,
        };
      }
    }

    throw new Error(`Postcode ${postcode} not found in deprivation data`);
  }

  async getDeprivationData(postcode: string): Promise<DeprivationData> {
    try {
      // Fetch the initial response with poll path
      const initialResponse = await this.fetchIMDData(postcode);

      if (!initialResponse["poll-path"]) {
        throw new Error("No poll path received from IMD API");
      }

      // Poll until processing is complete
      const pollResponse = await this.pollForCompletion(
        initialResponse["poll-path"]
      );

      // Extract download URLs
      const { csv: csvUrl } = this.extractDownloadUrls(pollResponse);

      // Download and parse CSV
      const csvContent = await this.downloadCSV(csvUrl);
      const { matched, healthDecile, incomeDecile } =
        this.parseCSVForDeprivation(csvContent, postcode);

      if (!matched) {
        return {
          matched: false,
          income: false,
          health: false,
        };
      }

      // Apply threshold logic
      return {
        matched: true,
        income: incomeDecile! <= DEPRIVATION_THRESHOLD_DECILE,
        health: healthDecile! <= DEPRIVATION_THRESHOLD_DECILE,
      };
    } catch (error) {
      console.error("Error fetching deprivation data:", error);
      // Return default values if API fails
      return {
        matched: false,
        income: false,
        health: false,
      };
    }
  }
}
