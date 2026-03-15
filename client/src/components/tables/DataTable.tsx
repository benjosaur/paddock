import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  FolderOpen,
  RefreshCw,
  Target,
  TreePalm,
  CalendarCheck,
  Undo2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { PermissionGate } from "../PermissionGate";
import { DeleteAlert } from "../DeleteAlert";
import type { TableColumn, TrainingRecord } from "../../types";
import { AppRouterKeys } from "shared";

// ── Filter types ─────────────────────────────────────────────────────────────

type NumberFilter = {
  comparator: "=" | ">" | "<" | ">=" | "<=";
  value: string;
};
type DateFilter = { from: string; to: string };
type AnyColumnFilter = string | NumberFilter | DateFilter;

function isNumberFilter(f: AnyColumnFilter): f is NumberFilter {
  return typeof f === "object" && "comparator" in f;
}

function isDateFilter(f: AnyColumnFilter): f is DateFilter {
  return typeof f === "object" && "from" in f;
}

function hasActiveFilter(f: AnyColumnFilter | undefined): boolean {
  if (!f) return false;
  if (typeof f === "string") return f !== "";
  if (isNumberFilter(f)) return f.value !== "";
  if (isDateFilter(f)) return f.from !== "" || f.to !== "";
  return false;
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

function getSortValue<T>(col: TableColumn<T>, item: T): string | number {
  if (col.sortValue) return col.sortValue(item);
  const rendered = col.render
    ? col.render(item)
    : (item[col.key as keyof T] as unknown);
  if (typeof rendered === "number") return rendered;
  return String(rendered ?? "");
}

function compareSortValues(
  a: string | number,
  b: string | number,
  dir: "asc" | "desc"
): number {
  const factor = dir === "asc" ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * factor;
  const aStr = String(a);
  const bStr = String(b);
  // Empty strings sort last regardless of direction
  if (aStr === "" && bStr !== "") return 1;
  if (aStr !== "" && bStr === "") return -1;
  if (aStr === "" && bStr === "") return 0;
  return aStr.localeCompare(bStr) * factor;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddPackage?: (id: string) => void;
  onAddRequest?: (id: string) => void;
  onAddInfo?: (id: string) => void;
  onAddRecord?: (id: string) => void;
  onEditRecord?: (item: TrainingRecord) => void;
  onDeleteRecord?: (item: TrainingRecord) => void;
  onRenew?: (id: string) => void;
  onCover?: (id: string) => void;
  onEnd?: (item: T) => void;
  title: string;
  searchPlaceholder: string;
  onViewItem?: (id: string) => void;
  onViewRequest?: (requestId: string) => void;
  onCreate?: () => void;
  resource: AppRouterKeys;
  customActions?: React.ReactNode;
}

// ── Column filter input ───────────────────────────────────────────────────────

function ColumnFilterInput<T>({
  col,
  value,
  onChange,
}: {
  col: TableColumn<T>;
  value: AnyColumnFilter | undefined;
  onChange: (v: AnyColumnFilter) => void;
}) {
  const filterType = col.filterType ?? "string";

  if (filterType === "number") {
    const nf = isNumberFilter(value as AnyColumnFilter)
      ? (value as NumberFilter)
      : { comparator: "=" as const, value: "" };
    return (
      <div className="flex gap-1 items-center">
        <select
          className="h-8 text-xs border border-gray-200/60 rounded-md px-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          value={nf.comparator}
          onChange={(e) =>
            onChange({ ...nf, comparator: e.target.value as NumberFilter["comparator"] })
          }
        >
          <option value="=">=</option>
          <option value=">">{">"}</option>
          <option value="<">{"<"}</option>
          <option value=">=">{">="}</option>
          <option value="<=">{"<="}</option>
        </select>
        <Input
          type="number"
          placeholder="Value"
          value={nf.value}
          onChange={(e) => onChange({ comparator: nf.comparator, value: e.target.value })}
          className="h-8 text-xs !font-normal placeholder:font-normal flex-1 min-w-0"
        />
      </div>
    );
  }

  if (filterType === "date") {
    const df = isDateFilter(value as AnyColumnFilter)
      ? (value as DateFilter)
      : { from: "", to: "" };
    return (
      <div className="flex flex-col gap-0.5">
        <input
          type="date"
          title="From date"
          value={df.from}
          onChange={(e) => onChange({ from: e.target.value, to: df.to })}
          className="h-[26px] text-[11px] border border-gray-200/60 rounded-md px-1.5 bg-white w-full focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <input
          type="date"
          title="To date"
          value={df.to}
          onChange={(e) => onChange({ from: df.from, to: e.target.value })}
          className="h-[26px] text-[11px] border border-gray-200/60 rounded-md px-1.5 bg-white w-full focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>
    );
  }

  if (filterType === "enum") {
    return (
      <select
        className="h-8 text-xs border border-gray-200/60 rounded-md px-1.5 bg-white w-full focus:outline-none focus:ring-1 focus:ring-gray-300"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {col.filterOptions?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // Default: string
  return (
    <Input
      placeholder="Filter..."
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-xs !font-normal placeholder:font-normal"
    />
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export function DataTable<
  T extends { id: string; requestId?: string; endDate?: string }
>({
  data,
  columns,
  onEdit,
  onArchive,
  onDelete,
  onAddPackage,
  onAddRequest,
  onAddInfo,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onRenew,
  onCover,
  onEnd,
  onViewItem,
  onViewRequest,
  onCreate,
  title,
  searchPlaceholder,
  resource,
  customActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [columnFilters, setColumnFilters] = useState<
    Record<string, AnyColumnFilter>
  >({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Matching helpers ──────────────────────────────────────────────────────

  const matchValue = (value: unknown, term: string): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some((v) =>
        matchValue(v, term)
      );
    }
    return String(value).toLowerCase().includes(term.toLowerCase());
  };

  const matchesColumnFilter = (
    row: T,
    columnKey: string,
    filter: AnyColumnFilter
  ): boolean => {
    const col = columns.find((c) => String(c.key) === columnKey);
    if (!col) return true;
    const filterType = col.filterType ?? "string";

    if (filterType === "number" && isNumberFilter(filter)) {
      if (filter.value === "") return true;
      const raw = col.sortValue
        ? col.sortValue(row)
        : col.render
          ? col.render(row)
          : (row[col.key as keyof T] as unknown);
      const num =
        typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
      const target = parseFloat(filter.value);
      if (isNaN(num) || isNaN(target)) return true;
      switch (filter.comparator) {
        case "=":  return num === target;
        case ">":  return num > target;
        case "<":  return num < target;
        case ">=": return num >= target;
        case "<=": return num <= target;
      }
    }

    if (filterType === "date" && isDateFilter(filter)) {
      if (filter.from === "" && filter.to === "") return true;
      // Use sortValue (should return YYYY-MM-DD) for reliable comparison
      const raw = col.sortValue ? String(col.sortValue(row)) : "";
      if (raw === "") return filter.from === "" && filter.to === "";
      const fromOk = filter.from === "" || raw >= filter.from;
      const toOk = filter.to === "" || raw <= filter.to;
      return fromOk && toOk;
    }

    if (filterType === "enum" && typeof filter === "string") {
      if (filter === "") return true;
      const cellValue = col.render ? col.render(row) : (row[col.key as keyof T] as unknown);
      return String(cellValue ?? "") === filter;
    }

    // Default: string partial match
    if (typeof filter === "string") {
      if (filter === "") return true;
      const cellValue = col.render ? col.render(row) : (row[col.key as keyof T] as unknown);
      return matchValue(cellValue, filter);
    }

    return true;
  };

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredData = data.filter((row) => {
    const matchesSearch =
      searchTerm === "" ||
      columns.some((col) => {
        const cellValue = col.render
          ? col.render(row)
          : (row[col.key as keyof T] as unknown);
        return matchValue(cellValue, searchTerm);
      });

    const matchesColumnFilters = Object.entries(columnFilters).every(
      ([key, filter]) => {
        if (!hasActiveFilter(filter)) return true;
        return matchesColumnFilter(row, key, filter);
      }
    );

    return matchesSearch && matchesColumnFilters;
  });

  // ── Sort ──────────────────────────────────────────────────────────────────

  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const col = columns.find((c) => String(c.key) === sortKey);
        if (!col) return 0;
        return compareSortValues(
          getSortValue(col, a),
          getSortValue(col, b),
          sortDir
        );
      })
    : filteredData;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSortClick = (col: TableColumn<T>) => {
    const key = String(col.key);
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleColumnFilterChange = (
    columnKey: string,
    value: AnyColumnFilter
  ) => {
    setColumnFilters((prev) => ({ ...prev, [columnKey]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setColumnFilters({});
    setSortKey(null);
    setSortDir("asc");
  };

  const handleDeleteClick = (item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete.id);
    } else if (itemToDelete && onDeleteRecord) {
      onDeleteRecord(itemToDelete as unknown as TrainingRecord);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const anyFilterActive =
    searchTerm !== "" ||
    Object.values(columnFilters).some(hasActiveFilter) ||
    sortKey !== null;

  const functionProvided =
    onEdit ||
    onArchive ||
    onDelete ||
    onAddPackage ||
    onAddRequest ||
    onAddInfo ||
    onAddRecord ||
    onEditRecord ||
    onDeleteRecord ||
    onRenew ||
    onCover ||
    onEnd ||
    onViewItem ||
    onViewRequest ||
    onCreate;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <span className="text-sm select-none text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full border border-gray-200/50">
            Total: {sortedData.length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative select-none group">
            <Search className="absolute z-1 left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-500 transition-colors duration-200" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72 shadow-sm"
            />
          </div>
          {anyFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-500 border-gray-200 hover:text-gray-700 shadow-sm"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          )}
          {customActions}
          <PermissionGate resource={resource} action="create">
            {onCreate && (
              <Button className="shadow-sm" onClick={onCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className="border select-none border-gray-200/60 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm">
        <table className="w-full select-text rounded-xl">
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/60 backdrop-blur-sm rounded-t-xl">
            {/* Header row with sort controls */}
            <tr>
              {columns.map((col, index) => {
                const key = String(col.key);
                const isActive = sortKey === key;
                return (
                  <th
                    key={key}
                    className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 ${
                      index === 0 ? "rounded-tl-xl" : ""
                    }`}
                  >
                    <button
                      className="flex items-center gap-1.5 hover:text-gray-600 transition-colors group"
                      onClick={() => handleSortClick(col)}
                      title={`Sort by ${col.header}`}
                    >
                      {col.header}
                      {isActive ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                    </button>
                  </th>
                );
              })}
              {functionProvided && (
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800 rounded-tr-xl" />
              )}
            </tr>

            {/* Filter row */}
            <tr className="bg-white/70">
              {columns.map((col) => {
                const key = String(col.key);
                const active = hasActiveFilter(columnFilters[key]);
                return (
                  <th
                    key={`filter-${key}`}
                    className={`px-6 py-2 ${active ? "bg-blue-50/40" : ""}`}
                  >
                    <ColumnFilterInput
                      col={col}
                      value={columnFilters[key]}
                      onChange={(v) => handleColumnFilterChange(key, v)}
                    />
                  </th>
                );
              })}
              {functionProvided && <th className="px-6 py-2" />}
            </tr>
          </thead>

          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50 rounded-b-xl">
            {sortedData.map((item, index) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-100/80 transition-colors duration-150 ease-in-out ${
                  index === sortedData.length - 1 ? "rounded-b-xl" : ""
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={String(col.key)}
                    className={`px-6 py-4 text-sm text-gray-700 ${
                      index === sortedData.length - 1 && colIndex === 0
                        ? "rounded-bl-xl"
                        : ""
                    }`}
                  >
                    {col.render
                      ? col.render(item)
                      : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
                {functionProvided && (
                  <td
                    className={`px-6 py-4 text-right ${
                      index === sortedData.length - 1 ? "rounded-br-xl" : ""
                    }`}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {onViewItem && (
                          <DropdownMenuItem onClick={() => onViewItem(item.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        {onViewRequest && (
                          <DropdownMenuItem
                            onClick={() => onViewRequest(item.requestId ?? "")}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Request
                          </DropdownMenuItem>
                        )}
                        <PermissionGate resource={resource} action="update">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="create">
                          {onAddPackage && (
                            <DropdownMenuItem
                              onClick={() => onAddPackage(item.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Package
                            </DropdownMenuItem>
                          )}
                          {onAddRequest && (
                            <DropdownMenuItem
                              onClick={() => onAddRequest(item.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Request
                            </DropdownMenuItem>
                          )}
                          {onAddInfo && (
                            <DropdownMenuItem
                              onClick={() => onAddInfo(item.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Info
                            </DropdownMenuItem>
                          )}
                          {onAddRecord && (
                            <DropdownMenuItem
                              onClick={() => onAddRecord(item.id)}
                            >
                              <Target className="mr-2 h-4 w-4" />
                              Training
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onRenew && (
                            <DropdownMenuItem onClick={() => onRenew(item.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renew
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onEnd && (
                            <DropdownMenuItem onClick={() => onEnd(item)}>
                              {item.endDate === "open" ? (
                                <CalendarCheck className="mr-2 h-4 w-4" />
                              ) : (
                                <Undo2 className="mr-2 h-4 w-4" />
                              )}
                              {item.endDate === "open" ? "End" : "Un-End"}
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onCover && (
                            <DropdownMenuItem onClick={() => onCover(item.id)}>
                              <TreePalm className="mr-2 h-4 w-4" />
                              Cover
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onArchive && (
                            <DropdownMenuItem
                              onClick={() => onArchive(item.id)}
                            >
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="delete">
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onEditRecord && (
                            <DropdownMenuItem
                              onClick={() =>
                                onEditRecord(item as unknown as TrainingRecord)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="delete">
                          {onDeleteRecord && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteAlert
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
