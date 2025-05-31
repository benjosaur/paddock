import { useState } from "react";
import type { MpLog } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface DataTableProps {
  data: MpLog[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DataTable({ data, onEdit, onDelete }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            MP Logs
          </h1>
          <span className="text-sm text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full border border-gray-200/50">
            Total: {filteredData.length}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72 shadow-sm"
            />
          </div>
          <Button className="shadow-sm">Add New</Button>
        </div>
      </div>

      <div className="border border-gray-200/60 rounded-xl overflow-hidden shadow-sm bg-white/80 backdrop-blur-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/60 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Client
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                MP
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Service(s)
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Notes
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50/80 transition-colors duration-150 ease-in-out"
              >
                <td className="px-6 py-4 text-sm text-gray-700">{item.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.date}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.client}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.mp}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.services.join(", ")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.notes}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEdit(item.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
