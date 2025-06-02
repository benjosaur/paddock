import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { ClientRequestForm } from "../pages/ClientRequestForm";
import { mockClientRequests, mockClients } from "../data/mockData";
import type { ClientRequest, TableColumn, Client } from "../types";

const clientRequestColumns: TableColumn<ClientRequest>[] = [
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

export default function ClientRequestRoutes({
  onDelete,
}: {
  onDelete: (id: number) => void;
}) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/new-requests/create");
  };

  const handleEditNavigation = (id: number) => {
    navigate(`/new-requests/edit/${id}`);
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="new-requests"
            title="New Client Requests"
            searchPlaceholder="Search requests..."
            data={mockClientRequests}
            columns={clientRequestColumns}
            onEdit={handleEditNavigation}
            onDelete={onDelete}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<ClientRequestForm />} />
      <Route path="edit/:id" element={<ClientRequestForm />} />
    </Routes>
  );
}
