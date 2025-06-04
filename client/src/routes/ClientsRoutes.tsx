import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { ClientForm } from "../pages/ClientForm";
import { ClientDetailModal } from "../components/ClientDetailModal";
import { trpc } from "../utils/trpc";
import type { Client, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculateAgeBracket } from "@/utils/helpers";

const clientColumns: TableColumn<Client>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  {
    key: "dob",
    header: "Age",
    render: (item: Client) =>
      item.dob ? calculateAgeBracket(item.dob) + " years" : "Unknown",
  },

  { key: "postCode", header: "Post Code" },
  {
    key: "servicesProvided",
    header: "Services",
    render: (item: Client) => item.servicesProvided.join(", "),
  },
  {
    key: "needs",
    header: "Need Types",
    render: (item: Client) => item.needs.join(", "),
  },
  {
    key: "hasMp",
    header: "Has MP?",
    render: (item: Client) => (item.hasMp ? "Yes" : "No"),
  },
  {
    key: "hasAttendanceAllowance",
    header: "Has AA?",
    render: (item: Client) => (item.hasAttendanceAllowance ? "Yes" : "No"),
  },
];

export default function ClientsRoutes() {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
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

  const handleEdit = (id: number) => {
    navigate(`/clients/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    deleteClientMutation.mutate({ id });
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setSelectedClient(null);
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
            />
            {selectedClient && (
              <ClientDetailModal
                client={selectedClient}
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
