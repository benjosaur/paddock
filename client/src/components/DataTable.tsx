import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Search, MoreHorizontal, Edit, Trash2, Eye, Plus } from "lucide-react";
import { PermissionGate } from "./PermissionGate";
import type { TableColumn } from "../types";
import { AppRouterKeys } from "shared";

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (id: string) => void;
  title: string;
  searchPlaceholder: string;
  onViewItem?: (item: T) => void;
  onAddNew?: () => void;
  resource: AppRouterKeys;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onArchive,
  onDelete,
  onAdd,
  title,
  searchPlaceholder,
  onViewItem,
  onAddNew,
  resource,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  const matchValue = (value: any, searchTerm: string): boolean => {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === "object") {
      return Object.values(value).some((nestedValue) =>
        matchValue(nestedValue, searchTerm)
      );
    }
    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
  };

  const filteredData = data.filter((row) => {
    // Check if row matches search term
    const matchesSearch =
      searchTerm === "" ||
      columns.some((col) => {
        const cellValue = col.render
          ? col.render(row)
          : row[col.key as keyof T];
        return matchValue(cellValue, searchTerm);
      });

    // Check if row matches all column filters
    const matchesColumnFilters = Object.entries(columnFilters).every(
      ([columnKey, filterValue]) => {
        if (filterValue === "") return true;

        const column = columns.find((col) => String(col.key) === columnKey);
        if (!column) return true;

        const cellValue = column.render
          ? column.render(row)
          : row[column.key as keyof T];
        return matchValue(cellValue, filterValue);
      }
    );

    return matchesSearch && matchesColumnFilters;
  });

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <span className="text-sm select-none text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full border border-gray-200/50">
            Total: {filteredData.length}
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
          <PermissionGate resource={resource} action="create">
            {onAddNew && (
              <Button className="shadow-sm" onClick={onAddNew}>
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
            <tr>
              {columns.map((col, index) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 ${
                    index === 0 ? "rounded-tl-xl" : ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800 rounded-tr-xl"></th>
              )}
            </tr>
            <tr className="bg-white/70">
              {columns.map((col, index) => (
                <th
                  key={`filter-${String(col.key)}`}
                  className={`px-6 py-2 ${index === 0 ? "" : ""}`}
                >
                  <Input
                    placeholder={`Filter...`}
                    value={columnFilters[String(col.key)] || ""}
                    onChange={(e) =>
                      handleColumnFilterChange(String(col.key), e.target.value)
                    }
                    className="h-8 text-xs !font-normal placeholder:font-normal"
                  />
                </th>
              ))}
              {(onEdit || onDelete) && <th className="px-6 py-2"></th>}
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50 rounded-b-xl">
            {filteredData.map((item, index) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-100/80 transition-colors duration-150 ease-in-out ${
                  index === filteredData.length - 1 ? "rounded-b-xl" : ""
                }`}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={String(col.key)}
                    className={`px-6 py-4 text-sm text-gray-700 ${
                      index === filteredData.length - 1 && colIndex === 0
                        ? "rounded-bl-xl"
                        : ""
                    }`}
                  >
                    {col.render
                      ? col.render(item)
                      : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td
                    className={`px-6 py-4 text-right ${
                      index === filteredData.length - 1 ? "rounded-br-xl" : ""
                    }`}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {onViewItem && (
                          <DropdownMenuItem onClick={() => onViewItem(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        <PermissionGate resource={resource} action="create">
                          {onAdd && (
                            <DropdownMenuItem onClick={() => onAdd(item.id)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Package
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="update">
                          {onArchive && (
                            <DropdownMenuItem
                              onClick={() => onArchive(item.id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Toggle Archive
                            </DropdownMenuItem>
                          )}
                        </PermissionGate>
                        <PermissionGate resource={resource} action="delete">
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(item.id)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
