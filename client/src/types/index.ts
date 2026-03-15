export * from "shared/index.ts";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render: (item: T) => React.ReactNode;
  /** Controls the filter input rendered for this column. Defaults to "string". */
  filterType?: "string" | "number" | "date" | "enum";
  /** Options shown in the dropdown when filterType is "enum". */
  filterOptions?: string[];
  /**
   * Raw value used for sorting and numeric/date filtering.
   * Falls back to the rendered value when omitted.
   */
  sortValue?: (item: T) => string | number;
  /**
   * When true, empty sort values (e.g. "ongoing" for end dates) sort first,
   * so ended items appear at the bottom when sorting ascending.
   */
  endDateColumn?: boolean;
}
