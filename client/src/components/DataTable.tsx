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
import { Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import type { TableColumn } from "../types";

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  title: string;
  searchPlaceholder: string;
  onViewItem?: (item: T) => void;
  onAddNew?: () => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  title,
  searchPlaceholder,
  onViewItem,
  onAddNew,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <span className="text-sm text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full border border-gray-200/50">
            Total: {filteredData.length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute z-1 left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-500 transition-colors duration-200" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72 shadow-sm"
            />
          </div>
          {onAddNew && (
            <Button className="shadow-sm" onClick={onAddNew}>
              Add New
            </Button>
          )}
        </div>
      </div>

      <div className="border border-gray-200/60 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm">
        <table className="w-full rounded-xl">
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
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
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
