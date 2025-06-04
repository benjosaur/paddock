import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { ClientRequestForm } from "../pages/ClientRequestForm";
import { trpc } from "../utils/trpc";
import type { ClientRequest, TableColumn, Client } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function ClientRequestRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const clientRequestsQuery = useQuery(
    trpc.clientRequests.getAll.queryOptions()
  );
  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const clientRequestsQueryKey = trpc.clientRequests.getAll.queryKey();

  const clientRequests = clientRequestsQuery.data || [];
  const clients = clientsQuery.data || [];

  const deleteClientRequestMutation = useMutation(
    trpc.clientRequests.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientRequestsQueryKey });
      },
    })
  );

  // Update columns to use tRPC data
  const clientRequestColumns: TableColumn<ClientRequest>[] = [
    { key: "id", header: "Request ID" },
    {
      key: "clientId",
      header: "Client Name",
      render: (item: ClientRequest) =>
        clients.find((c: Client) => c.id === item.clientId)?.name ||
        item.clientId,
    },
    { key: "requestType", header: "Type" },
    { key: "startDate", header: "Start Date" },
    { key: "schedule", header: "Schedule" },
    { key: "status", header: "Status" },
  ];

  const handleAddNew = () => {
    navigate("/new-requests/create");
  };

  const handleEditNavigation = (id: number) => {
    navigate(`/new-requests/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    deleteClientRequestMutation.mutate({ id });
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
          />
        }
      />
      <Route path="create" element={<ClientRequestForm />} />
      <Route path="edit/:id" element={<ClientRequestForm />} />
    </Routes>
  );
}
