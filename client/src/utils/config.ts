// from s3deploy
type Config = { apiUrl: string };
let apiUrl: string | null = null;

export const getApiUrl = async () => {
  if (!apiUrl) {
    const response = await fetch("/config.json");
    const config: Config = await response.json();
    apiUrl = config.apiUrl;
  }
  return apiUrl;
};
