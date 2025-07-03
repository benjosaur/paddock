import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { ClientRequestForm } from "../pages/ClientRequestForm";
import { trpc } from "../utils/trpc";
import type { ClientRequest, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const clientRequestColumns: TableColumn<ClientRequest>[] = [
  { key: "id", header: "Request ID" },
  {
    key: "clientId",
    header: "Client Name",
    render: (item: ClientRequest) => item.details.name,
  },
  { key: "requestType", header: "Type" },
  { key: "startDate", header: "Start Date" },
  { key: "schedule", header: "Schedule" },
  { key: "status", header: "Status" },
];

export default function ClientRequestRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const clientRequestsQuery = useQuery(
    trpc.clientRequests.getAll.queryOptions()
  );

  const clientRequestsQueryKey = trpc.clientRequests.getAll.queryKey();

  const clientRequests = clientRequestsQuery.data || [];

  const deleteClientRequestMutation = useMutation(
    trpc.clientRequests.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientRequestsQueryKey });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/new-requests/create");
  };

  const handleEditNavigation = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/new-requests/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    const selectedRequest = clientRequests.find((req) => (req.id = id));
    if (!selectedRequest) {
      throw new Error(`Request not found with id: ${id}`);
    }
    const clientId = selectedRequest.clientId;
    deleteClientRequestMutation.mutate({ id, clientId });
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
            data={clientRequests}
            columns={clientRequestColumns}
            onEdit={handleEditNavigation}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            resource="clientRequests"
          />
        }
      />
      <Route path="create" element={<ClientRequestForm />} />
      <Route path="edit/:id" element={<ClientRequestForm />} />
    </Routes>
  );
}
