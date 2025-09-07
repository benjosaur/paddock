import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { ClientForm } from "../pages/ClientForm";
import { ClientDetailModal } from "../components/ClientDetailModal";
import { trpc } from "../utils/trpc";
import type { ClientMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalise } from "@/utils/helpers";

const clientColumns: TableColumn<ClientMetadata>[] = [
  {
    key: "customId",
    header: "Custom ID",
    render: (item: ClientMetadata) => item.details.customId || "—",
  },
  {
    key: "name",
    header: "Name",
    render: (item: ClientMetadata) => item.details.name,
  },
  {
    key: "dob",
    header: "Date of Birth",
    render: (item: ClientMetadata) => item.dateOfBirth || "Unknown",
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
    header: "AA Status",
    render: (item: ClientMetadata) =>
      capitalise(item.details.attendanceAllowance.status),
  },
  {
    key: "deprivationFlags",
    header: "Deprivation Flags",
    render: (item: ClientMetadata) => {
      if (
        item.details.address.deprivation.income &&
        item.details.address.deprivation.health
      ) {
        return "Both";
      } else if (item.details.address.deprivation.income) {
        return "Income";
      } else if (item.details.address.deprivation.health) {
        return "Health";
      }
      return "None";
    },
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

  const archiveClientMutation = useMutation(
    trpc.clients.toggleArchive.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const deleteClientMutation = useMutation(
    trpc.clients.delete.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/clients/create");
  };

  const handleArchiveToggle = (id: string) => {
    archiveClientMutation.mutate({ id });
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/clients/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteClientMutation.mutate({ id });
  };

  const handleViewClient = (id: string) => {
    setSelectedClientId(id);
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
    setSelectedClientId(null);
  };

  const handleAddRequest = (clientId: string) => {
    const encodedId = encodeURIComponent(clientId);
    navigate(`/requests/create?clientId=${encodedId}`);
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
              onArchive={handleArchiveToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddRequest={handleAddRequest}
              onViewItem={handleViewClient}
              onCreate={handleAddNew}
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

export const associatedClientRoutes: any[] = [
  // Dashboard Analytics

  // Clients
  trpc.clients.getAll,
  trpc.clients.getAllNotArchived,
  trpc.clients.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllNotArchived,
  trpc.packages.getAllNotEndedYet,
  trpc.packages.getById,

  // Requests
  trpc.requests.getAll,
  trpc.requests.getAllNotArchived,
  trpc.requests.getAllNotEndedYet,
  trpc.requests.getById,
  trpc.requests.getAllMetadata,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotArchived,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
