import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { ClientForm } from "../pages/ClientForm";
import { ClientDetailModal } from "../components/ClientDetailModal";
import { trpc } from "../utils/trpc";
import type { ClientMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket, capitalise } from "@/utils/helpers";

const clientColumns: TableColumn<ClientMetadata>[] = [
  {
    key: "id",
    header: "ID",
    render: (item: ClientMetadata) => item.id,
  },
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

  {
    key: "postCode",
    header: "Post Code",
    render: (item: ClientMetadata) => item.details.address.postCode,
  },
  {
    key: "services",
    header: "Services",
    render: (item: ClientMetadata) => item.details.services.join(", "),
  },
  {
    key: "attendanceAllowance",
    header: "Has AA?",
    render: (item: ClientMetadata) =>
      capitalise(item.details.attendanceAllowance),
  },
];

export default function ClientsRoutes() {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(
    showArchived 
      ? trpc.clients.getAll.queryOptions()
      : trpc.clients.getAllNotArchived.queryOptions()
  );
  const clientsQueryKey = showArchived 
    ? trpc.clients.getAll.queryKey()
    : trpc.clients.getAllNotArchived.queryKey();

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
    const encodedId = encodeURIComponent(id);
    navigate(`/clients/edit/${encodedId}`);
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
              key={`clients-${showArchived}`}
              title="Clients"
              searchPlaceholder="Search clients..."
              data={clientsQuery.data || []}
              columns={clientColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewItem={handleViewClient as (item: unknown) => void}
              onAddNew={handleAddNew}
              resource="clients"
              customActions={
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="shadow-sm"
                >
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </Button>
              }
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
