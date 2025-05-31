import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { DataTable } from "./components/DataTable";
import { ClientDetailModal } from "./components/ClientDetailModal";
import {
  mockMpLogs,
  mockVolunteerLogs,
  mockMagLogs,
  mockClients,
  mockClientRequests,
} from "./data/mockData";
import type {
  UserRole,
  MpLog,
  VolunteerLog,
  MagLog,
  Client,
  ClientRequest,
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

// Define columns for Clients table
const clientColumns: TableColumn<Client>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "postCode", header: "Post Code" },
  {
    key: "servicesProvided",
    header: "Services",
    render: (item: Client) => item.servicesProvided.join(", "), // Added type for item
  },
  {
    key: "needs",
    header: "Need Types",
    render: (item: Client) => item.needs.join(", "),
  }, // Added type for item
  {
    key: "hasMp",
    header: "Has MP?",
    render: (item: Client) => (item.hasMp ? "Yes" : "No"),
  }, // Added type for item
  {
    key: "hasAttendanceAllowance",
    header: "Has AA?",
    render: (item: Client) => (item.hasAttendanceAllowance ? "Yes" : "No"), // Added type for item
  },
];

// Define columns for New Requests table
const newRequestColumns: TableColumn<ClientRequest>[] = [
  { key: "id", header: "Request ID" },
  {
    key: "clientId",
    header: "Client Name",
    render: (item: ClientRequest) =>
      mockClients.find((c: Client) => c.id === item.clientId)?.name ||
      item.clientId, // Added types for item and c
  },
  { key: "requestType", header: "Type" },
  { key: "startDate", header: "Start Date" },
  { key: "schedule", header: "Schedule" },
  { key: "status", header: "Status" },
];

function App() {
  const [userRole] = useState<UserRole>("Admin");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (id: string) => {
    console.log("Edit item:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete item:", id);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
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
            <Route // Added route for Clients page
              path="/clients"
              element={
                <DataTable
                  key="clients"
                  title="Clients"
                  searchPlaceholder="Search clients..."
                  data={mockClients}
                  columns={clientColumns}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewItem={handleViewClient as (item: unknown) => void}
                />
              }
            />
            <Route // Added route for New Requests page
              path="/new-requests"
              element={
                <DataTable
                  key="new-requests"
                  title="New Client Requests"
                  searchPlaceholder="Search requests..."
                  data={mockClientRequests}
                  columns={newRequestColumns}
                  onEdit={handleEdit} // Assuming edit/delete might apply here too
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
      <ClientDetailModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Router>
  );
}

export default App;
