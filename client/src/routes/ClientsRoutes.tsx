import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { ClientForm } from "../pages/ClientForm";
import { ClientDetailModal } from "../components/ClientDetailModal";
import { trpc } from "../utils/trpc";
import type { ClientMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket } from "@/utils/helpers";

const clientColumns: TableColumn<ClientMetadata>[] = [
  { key: "id", header: "ID" },
  {
    key: "name",
    header: "Name",
    render: (item: ClientMetadata) => item.details.name,
  },
  {
    key: "dob",
    header: "Age",
    render: (item: ClientMetadata) =>
      item.dateOfBirth
        ? calculateAgeBracket(item.dateOfBirth) + " years"
        : "Unknown",
  },

  { key: "postCode", header: "Post Code" },
  {
    key: "services",
    header: "Services",
    render: (item: ClientMetadata) => item.details.services.join(", "),
  },
  {
    key: "needs",
    header: "Need Types",
    render: (item: ClientMetadata) => item.details.needs.join(", "),
  },
  {
    key: "requests",
    header: "Outstanding Requests?",
    render: (item: ClientMetadata) =>
      item.mpRequests.length + item.volunteerRequests.length,
  },
  {
    key: "attendanceAllowance",
    header: "Has AA?",
    render: (item: ClientMetadata) =>
      item.details.attendanceAllowance ? "Yes" : "No",
  },
];

export default function ClientsRoutes() {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const clientsQueryKey = trpc.clients.getAll.queryKey();

  const deleteClientMutation = useMutation(
    trpc.clients.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientsQueryKey });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/clients/create");
  };

  const handleEdit = (id: string) => {
    navigate(`/clients/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteClientMutation.mutate({ id });
  };

  const handleViewClient = (client: ClientMetadata) => {
    setSelectedClientId(client.id);
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setSelectedClientId(null);
  };

  if (clientsQuery.isLoading) return <div>Loading...</div>;
  if (clientsQuery.error) return <div>Error loading clients</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <DataTable
              key="clients"
              title="Clients"
              searchPlaceholder="Search clients..."
              data={clientsQuery.data || []}
              columns={clientColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewItem={handleViewClient as (item: unknown) => void}
              onAddNew={handleAddNew}
              resource="clients"
            />
            {selectedClientId && (
              <ClientDetailModal
                clientId={selectedClientId}
                isOpen={isClientModalOpen}
                onClose={handleCloseClientModal}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        }
      />
      <Route path="create" element={<ClientForm />} />
      <Route path="edit/:id" element={<ClientForm />} />
    </Routes>
  );
}
