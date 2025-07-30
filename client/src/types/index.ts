export * from "shared/index.ts";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render: (item: T) => React.ReactNode;
}
