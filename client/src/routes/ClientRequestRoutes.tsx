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
    render: (item) => item.details.name,
  },
  { key: "requestType", header: "Type" },
  {
    key: "startDate",
    header: "Start Date",
  },
  {
    key: "schedule",
    header: "Schedule",
    render: (item) => item.details.schedule,
  },
  { key: "status", header: "Status", render: (item) => item.details.status },
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

  const getClientId = (trainingRecordId: string): string => {
    const selectedRequest = clientRequests.find(
      (req) => (req.id = trainingRecordId)
    );
    if (!selectedRequest) {
      throw new Error(`Request not found with id: ${trainingRecordId}`);
    }
    return selectedRequest.clientId;
  };

  const handleAddNew = () => {
    navigate("/new-requests/create");
  };

  const handleEditNavigation = (id: string) => {
    const clientId = getClientId(id);
    const params = new URLSearchParams();
    params.set("id", id);
    params.set("clientId", clientId);
    navigate(`/new-requests/edit?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    const clientId = getClientId(id);
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
      <Route path="edit" element={<ClientRequestForm />} />
    </Routes>
  );
}
