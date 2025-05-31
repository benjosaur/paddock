import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DataTable } from "./components/DataTable";
import { mockMpLogs } from "./data/mockData";
import type { UserRole } from "./types";

function App() {
  const [userRole] = useState<UserRole>("Admin");

  const handleEdit = (id: string) => {
    console.log("Edit item:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete item:", id);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Sidebar userRole={userRole} />
      <main className="flex-1 p-8 overflow-auto">
        <DataTable
          data={mockMpLogs}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
