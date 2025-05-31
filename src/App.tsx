import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { DataTable } from "./components/DataTable";
import { mockMpLogs, mockVolunteerLogs, mockMagLogs } from "./data/mockData";
import type {
  UserRole,
  MpLog,
  VolunteerLog,
  MagLog,
  TableColumn,
} from "./types";

const mpLogColumns: TableColumn<MpLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "client", header: "Client" },
  { key: "mp", header: "MP" },
  {
    key: "services",
    header: "Service(s)",
    render: (item) => item.services.join(", "),
  },
  { key: "notes", header: "Notes" },
];

const volunteerLogColumns: TableColumn<VolunteerLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "volunteer", header: "Volunteer" },
  { key: "activity", header: "Activity" },
  { key: "hoursLogged", header: "Hours Logged" },
  { key: "notes", header: "Notes" },
];

const magLogColumns: TableColumn<MagLog>[] = [
  { key: "id", header: "ID" },
  { key: "date", header: "Date" },
  { key: "attendee", header: "Attendee" },
  { key: "total", header: "Total" },
  {
    key: "attendees",
    header: "Attendees",
    render: (item) => item.attendees.join(", "),
  },
  { key: "notes", header: "Notes" },
];

function App() {
  const [userRole] = useState<UserRole>("Admin");

  const handleEdit = (id: string) => {
    console.log("Edit item:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete item:", id);
  };

  return (
    <Router>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100/30">
        <Sidebar userRole={userRole} />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/mp-logs" />} />
            <Route
              path="/mp-logs"
              element={
                <DataTable
                  key="mp-logs"
                  title="MP Logs"
                  searchPlaceholder="Search MP logs..."
                  data={mockMpLogs}
                  columns={mpLogColumns}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              }
            />
            <Route
              path="/volunteer-logs"
              element={
                <DataTable
                  key="volunteer-logs"
                  title="Volunteer Logs"
                  searchPlaceholder="Search volunteer logs..."
                  data={mockVolunteerLogs}
                  columns={volunteerLogColumns}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              }
            />
            <Route
              path="/mag-logs"
              element={
                <DataTable
                  key="mag-logs"
                  title="MAG Logs"
                  searchPlaceholder="Search MAG logs..."
                  data={mockMagLogs}
                  columns={magLogColumns}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              }
            />
            {/* Add routes for other views (Volunteers, Expiries) here if needed */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Page not found</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
