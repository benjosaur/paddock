import { useQuery } from "@tanstack/react-query";
import { AppConfig, OptionList, defaultAppConfig } from "shared";
import { trpc } from "../utils/trpc";

// Org-wide app config (dropdown option lists, table column visibility).
// Resolves to the compiled-in defaults until the server responds, so
// consumers never need a loading state.
export function useConfig(): AppConfig {
  const { data } = useQuery({
    ...trpc.config.get.queryOptions(),
    placeholderData: defaultAppConfig,
  });
  return data ?? defaultAppConfig;
}

export function activeValues(list: OptionList): string[] {
  return list.options
    .filter((option) => option.active)
    .map((option) => option.value);
}
