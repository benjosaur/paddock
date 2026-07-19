import {
  AppConfig,
  OptionList,
  TableColumnConfig,
  defaultAppConfig,
  optionListSchema,
  tableColumnConfigSchema,
} from "shared";
import {
  configurableTableIds,
  protectedLocalityValues,
  protectedServiceValues,
} from "shared/const";
import { addDbMiddleware } from "../service";
import { ConfigRepository } from "./repository";
import { DbConfigItem } from "./schema";

export class ConfigService {
  configRepository = new ConfigRepository();

  async get(user: User): Promise<AppConfig> {
    try {
      const items = await this.configRepository.getAll(user);
      const config = { ...defaultAppConfig };
      for (const item of items) {
        if (item.sK === "services") config.services = item.data;
        else if (item.sK === "localities") config.localities = item.data;
        else if (item.sK === "tableColumns") config.tableColumns = item.data;
      }
      return config;
    } catch (error) {
      console.error("Service Layer Error getting config:", error);
      throw error;
    }
  }

  async updateServices(user: User, input: OptionList): Promise<AppConfig> {
    return await this.updateOptionList(
      user,
      "services",
      input,
      protectedServiceValues
    );
  }

  async updateLocalities(user: User, input: OptionList): Promise<AppConfig> {
    return await this.updateOptionList(
      user,
      "localities",
      input,
      protectedLocalityValues
    );
  }

  async updateTableColumns(
    user: User,
    input: TableColumnConfig
  ): Promise<AppConfig> {
    try {
      const validated = tableColumnConfigSchema.parse(input);
      for (const [tableId, columns] of Object.entries(
        validated.visibleColumns
      )) {
        if (!(configurableTableIds as readonly string[]).includes(tableId)) {
          throw new Error(`Unknown table "${tableId}"`);
        }
        if (columns.length === 0) {
          throw new Error(
            `Table "${tableId}" must have at least one visible column`
          );
        }
      }
      const item: DbConfigItem = addDbMiddleware(
        {
          pK: "config",
          sK: "tableColumns",
          entityType: "config",
          data: validated,
        },
        user
      );
      await this.configRepository.put(user, item);
      return await this.get(user);
    } catch (error) {
      console.error("Service Layer Error updating table columns:", error);
      throw error;
    }
  }

  private async updateOptionList(
    user: User,
    sK: "services" | "localities",
    input: OptionList,
    protectedValues: readonly string[]
  ): Promise<AppConfig> {
    try {
      const validated = optionListSchema.parse(input);
      const current = (await this.get(user))[sK];
      this.validateOptionList(validated, current, protectedValues);
      const item: DbConfigItem = addDbMiddleware(
        { pK: "config", sK, entityType: "config", data: validated },
        user
      );
      await this.configRepository.put(user, item);
      return await this.get(user);
    } catch (error) {
      console.error(`Service Layer Error updating config ${sK}:`, error);
      throw error;
    }
  }

  private validateOptionList(
    input: OptionList,
    current: OptionList,
    protectedValues: readonly string[]
  ) {
    const values = input.options.map((option) => option.value);
    const lowered = values.map((value) => value.toLowerCase());
    if (new Set(lowered).size !== lowered.length) {
      throw new Error("Option values must be unique");
    }
    // Archive-only: stored records may reference any previously saved value.
    for (const option of current.options) {
      if (!values.includes(option.value)) {
        throw new Error(
          `Option "${option.value}" cannot be removed, only archived`
        );
      }
    }
    for (const protectedValue of protectedValues) {
      const option = input.options.find((o) => o.value === protectedValue);
      if (!option?.active) {
        throw new Error(
          `Option "${protectedValue}" is required by the app and cannot be archived`
        );
      }
    }
  }
}
