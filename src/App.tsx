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
import ClientsRoutes from "./components/ClientsRoutes";
import MpsRoutes from "./components/MpsRoutes";
import MpLogRoutes from "./components/MpLogRoutes";
import VolunteerLogRoutes from "./components/VolunteerLogRoutes";
import VolunteersRoutes from "./components/VolunteersRoutes";
import { MpDetailModal } from "./components/MpDetailModal";
import { VolunteerDetailModal } from "./components/VolunteerDetailModal";
import {
  mockMagLogs,
  mockClients,
  mockClientRequests,
  mockExpiries,
} from "./data/mockData";
import type {
  UserRole,
  MagLog,
  Client,
  ClientRequest,
  TableColumn,
  Mp,
  Volunteer,
  ExpiryItem,
} from "./types";

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

// Define columns for New Requests table
const newRequestColumns: TableColumn<ClientRequest>[] = [
  { key: "id", header: "Request ID" },
  {
    key: "clientId",
    header: "Client Name",
    render: (item: ClientRequest) =>
      mockClients.find((c: Client) => c.id === item.clientId)?.name ||
      item.clientId,
  },
  { key: "requestType", header: "Type" },
  { key: "startDate", header: "Start Date" },
  { key: "schedule", header: "Schedule" },
  { key: "status", header: "Status" },
];

const expiryColumns: TableColumn<ExpiryItem>[] = [
  { key: "date", header: "Date" },
  {
    key: "type",
    header: "Type",
    render: (item: ExpiryItem) => (item.type === "dbs" ? "DBS" : "Training"),
  },
  { key: "mpVolunteer", header: "MP/Volunteer" },
  { key: "name", header: "Training" },
  { key: "personType", header: "Type" },
];

function App() {
  const [userRole] = useState<UserRole>("Admin");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedMp, setSelectedMp] = useState<Mp | null>(null);
  const [isMpModalOpen, setIsMpModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null
  );
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  const handleEdit = (id: string) => {
    console.log("Edit item:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete item:", id);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setSelectedClient(null);
  };

  const handleViewMp = (mp: Mp) => {
    setSelectedMp(mp);
    setIsMpModalOpen(true);
  };

  const handleCloseMpModal = () => {
    setIsMpModalOpen(false);
    setSelectedMp(null);
  };

  const handleViewVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsVolunteerModalOpen(true);
  };

  const handleCloseVolunteerModal = () => {
    setIsVolunteerModalOpen(false);
    setSelectedVolunteer(null);
  };

  return (
    <Router>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100/30">
        <Sidebar userRole={userRole} />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/mp-logs" />} />
            <Route
              path="/mp-logs/*"
              element={
                <MpLogRoutes onEdit={handleEdit} onDelete={handleDelete} />
              }
            />
            <Route
              path="/volunteer-logs/*"
              element={
                <VolunteerLogRoutes
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
            <Route
              path="/clients/*"
              element={
                <ClientsRoutes
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewClient={handleViewClient}
                />
              }
            />
            <Route
              path="/mps/*"
              element={
                <MpsRoutes
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleViewMp={handleViewMp}
                />
              }
            />
            <Route
              path="/volunteers/*"
              element={
                <VolunteersRoutes
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleViewVolunteer={handleViewVolunteer}
                />
              }
            />
            <Route
              path="/new-requests"
              element={
                <DataTable
                  key="new-requests"
                  title="New Client Requests"
                  searchPlaceholder="Search requests..."
                  data={mockClientRequests}
                  columns={newRequestColumns}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              }
            />
            <Route
              path="/expiries"
              element={
                <DataTable
                  key="expiries"
                  title="Expiries"
                  searchPlaceholder="Search expiries..."
                  data={mockExpiries}
                  columns={expiryColumns}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              }
            />
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
        isOpen={isClientModalOpen}
        onClose={handleCloseClientModal}
      />
      <MpDetailModal
        mp={selectedMp}
        isOpen={isMpModalOpen}
        onClose={handleCloseMpModal}
      />
      <VolunteerDetailModal
        volunteer={selectedVolunteer}
        isOpen={isVolunteerModalOpen}
        onClose={handleCloseVolunteerModal}
      />
    </Router>
  );
}

export default App;
