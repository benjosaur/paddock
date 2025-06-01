import { useState } from "react";
import Select from "react-select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DataTable } from "./DataTable";
import {
  mockMpLogs,
  mockVolunteerLogs,
  mockMagLogs,
  mockClients,
  mockMps,
  mockVolunteers,
  mockClientRequests,
  mockExpiries,
} from "../data/mockData";
import type { TableColumn } from "../types";

interface TableOption {
  value: string;
  label: string;
  schema: string[];
}

interface SearchCriteria {
  [key: string]: string;
}

export function TableSearchForm() {
  const [selectedTable, setSelectedTable] = useState<TableOption | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const tableOptions: TableOption[] = [
    {
      value: "mpLogs",
      label: "MP Logs",
      schema: [
        "id",
        "date",
        "clientId",
        "mpId",
        "services",
        "hoursLogged",
        "notes",
      ],
    },
    {
      value: "volunteerLogs",
      label: "Volunteer Logs",
      schema: [
        "id",
        "date",
        "clientId",
        "volunteerId",
        "activity",
        "hoursLogged",
        "notes",
      ],
    },
    {
      value: "magLogs",
      label: "MAG Logs",
      schema: ["id", "date", "total", "attendees", "notes"],
    },
    {
      value: "clients",
      label: "Clients",
      schema: [
        "id",
        "name",
        "dob",
        "address",
        "postCode",
        "phone",
        "email",
        "nextOfKin",
        "referredBy",
        "needs",
        "servicesProvided",
        "age",
        "hasMp",
        "hasAttendanceAllowance",
      ],
    },
    {
      value: "mps",
      label: "MPs",
      schema: [
        "id",
        "name",
        "address",
        "postCode",
        "phone",
        "email",
        "nextOfKin",
        "dbsNumber",
        "dbsExpiry",
        "age",
        "servicesOffered",
        "specialisms",
        "transport",
        "capacity",
      ],
    },
    {
      value: "volunteers",
      label: "Volunteers",
      schema: [
        "id",
        "name",
        "age",
        "address",
        "postCode",
        "phone",
        "email",
        "nextOfKin",
        "dbsNumber",
        "dbsExpiry",
        "servicesOffered",
        "needTypes",
        "transport",
        "capacity",
        "specialisms",
      ],
    },
    {
      value: "clientRequests",
      label: "Client Requests",
      schema: [
        "id",
        "clientId",
        "requestType",
        "startDate",
        "schedule",
        "status",
      ],
    },
    {
      value: "expiries",
      label: "Expiries",
      schema: ["id", "date", "type", "mpVolunteer", "name", "personType"],
    },
  ];

  const getTableData = (tableName: string) => {
    switch (tableName) {
      case "mpLogs":
        return mockMpLogs;
      case "volunteerLogs":
        return mockVolunteerLogs;
      case "magLogs":
        return mockMagLogs;
      case "clients":
        return mockClients;
      case "mps":
        return mockMps;
      case "volunteers":
        return mockVolunteers;
      case "clientRequests":
        return mockClientRequests;
      case "expiries":
        return mockExpiries;
      default:
        return [];
    }
  };

  const getTableColumns = (tableName: string): TableColumn<any>[] => {
    const commonColumns = (fields: string[]): TableColumn<any>[] =>
      fields.map((field) => ({
        key: field,
        header:
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1"),
        render: (item: any) => {
          const value = item[field];
          if (Array.isArray(value)) {
            return value.join(", ");
          }
          if (typeof value === "boolean") {
            return value ? "Yes" : "No";
          }
          return value?.toString() || "";
        },
      }));

    switch (tableName) {
      case "mpLogs":
        return commonColumns([
          "id",
          "date",
          "clientId",
          "mpId",
          "services",
          "hoursLogged",
          "notes",
        ]);
      case "volunteerLogs":
        return commonColumns([
          "id",
          "date",
          "clientId",
          "volunteerId",
          "activity",
          "hoursLogged",
          "notes",
        ]);
      case "magLogs":
        return commonColumns(["id", "date", "total", "attendees", "notes"]);
      case "clients":
        return commonColumns([
          "id",
          "name",
          "dob",
          "address",
          "phone",
          "email",
          "needs",
          "servicesProvided",
        ]);
      case "mps":
        return commonColumns([
          "id",
          "name",
          "address",
          "phone",
          "email",
          "servicesOffered",
          "transport",
          "capacity",
        ]);
      case "volunteers":
        return commonColumns([
          "id",
          "name",
          "age",
          "address",
          "phone",
          "email",
          "servicesOffered",
          "transport",
          "capacity",
        ]);
      case "clientRequests":
        return commonColumns([
          "id",
          "clientId",
          "requestType",
          "startDate",
          "schedule",
          "status",
        ]);
      case "expiries":
        return commonColumns([
          "id",
          "date",
          "type",
          "mpVolunteer",
          "name",
          "personType",
        ]);
      default:
        return [];
    }
  };

  const handleTableChange = (option: TableOption | null) => {
    setSelectedTable(option);
    setSearchCriteria({});
    setShowResults(false);
    setSearchResults([]);
  };

  const handleCriteriaChange = (field: string, value: string) => {
    setSearchCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    if (!selectedTable) return;

    const tableData = getTableData(selectedTable.value);

    const filtered = tableData.filter((item) => {
      return Object.entries(searchCriteria).every(([field, searchValue]) => {
        if (!searchValue.trim()) return true;

        const itemValue = (item as any)[field];
        if (itemValue === null || itemValue === undefined) return false;

        if (Array.isArray(itemValue)) {
          return itemValue.some((val) =>
            val.toString().toLowerCase().includes(searchValue.toLowerCase())
          );
        }

        return itemValue
          .toString()
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      });
    });

    setSearchResults(filtered);
    setShowResults(true);
  };

  const handleClearSearch = () => {
    setSearchCriteria({});
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Search Tables
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Table *
            </label>
            <Select
              options={tableOptions}
              value={selectedTable}
              onChange={handleTableChange}
              placeholder="Choose a table to search..."
              className="react-select-container"
              classNamePrefix="react-select"
              isSearchable
            />
          </div>

          {selectedTable && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Search Criteria for {selectedTable.label}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedTable.schema.map((field) => (
                  <div key={field}>
                    <label
                      htmlFor={field}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {field.charAt(0).toUpperCase() +
                        field.slice(1).replace(/([A-Z])/g, " $1")}
                    </label>
                    <Input
                      id={field}
                      value={searchCriteria[field] || ""}
                      onChange={(e) =>
                        handleCriteriaChange(field, e.target.value)
                      }
                      placeholder={`Search by ${field}...`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleSearch}>Search</Button>
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showResults && selectedTable && (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
          <DataTable
            data={searchResults}
            columns={getTableColumns(selectedTable.value)}
            title={`${selectedTable.label} Search Results`}
            searchPlaceholder="Search results..."
          />

          <div className="mt-4 text-sm text-gray-600">
            Found {searchResults.length} result
            {searchResults.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
