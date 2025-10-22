import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { ClientForm } from "../pages/ClientForm";
import { InfoForm } from "../pages/InfoForm";
import { ClientDetailModal } from "../components/ClientDetailModal";
import { trpc } from "../utils/trpc";
import type { ClientMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalise } from "@/utils/helpers";
import { formatYmdToDmy } from "@/utils/date";
import EndDialog from "../components/EndDialog";
import type { EndPersonDetails } from "shared";

const clientColumns: TableColumn<ClientMetadata>[] = [
  {
    key: "customId",
    header: "Custom ID",
    render: (item: ClientMetadata) => item.details.customId || "",
  },
  {
    key: "name",
    header: "Name",
    render: (item: ClientMetadata) => item.details.name,
  },
  {
    key: "dob",
    header: "Date of Birth",
    render: (item: ClientMetadata) => formatYmdToDmy(item.dateOfBirth || ""),
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
  const [showEnded, setShowEnded] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endDetails, setEndDetails] = useState<EndPersonDetails | null>(null);

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(
    showEnded
      ? trpc.clients.getAll.queryOptions()
      : trpc.clients.getAllNotEnded.queryOptions()
  );

  const updateClientMutation = useMutation(
    trpc.clients.update.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/clients");
      },
    })
  );

  const endClientMutation = useMutation(
    trpc.clients.end.mutationOptions({
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

  const handleAddInfo = (clientId: string) => {
    const encodedId = encodeURIComponent(clientId);
    navigate(`/clients/info?clientId=${encodedId}`);
  };

  const handleEnd = (client: ClientMetadata) => {
    if (client.endDate === "open") {
      // if now open then need to prepare for ending
      setEndDetails({ personId: client.id, endDate: "" });
      setIsEndDialogOpen(true);
    } else {
      // if now not open then endDetails set BACK TO "open" TO prepare for end UNDO
      setEndDetails({ personId: client.id, endDate: "open" });
      setIsEndDialogOpen(true);
    }
  };

  const handleConfirmEnd = () => {
    if (!endDetails?.personId || !endDetails.endDate) return;
    if (endDetails.endDate === "open") {
      const selectedClient = clientsQuery.data?.find(
        (c) => c.id === endDetails.personId
      );
      if (!selectedClient) return;
      const client = { ...selectedClient, endDate: null };
      updateClientMutation.mutate({
        ...client,
        endDate: "open",
      });
    } else {
      endClientMutation.mutate(endDetails);
    }
    setIsEndDialogOpen(false);
    setEndDetails(null);
  };

  if (clientsQuery.isLoading) return <div>Loading...</div>;
  if (clientsQuery.error) return <div>Error loading clients</div>;

  // Ensure rows are shown in alphabetical order by client name
  const sortedClients = (clientsQuery.data || []).slice().sort((a, b) =>
    a.details.name.localeCompare(b.details.name, undefined, {
      sensitivity: "base",
    })
  );

  return (
    <Routes>
      <Route
        index
        element={
          <>
            <DataTable
              key={`clients-${showEnded}`}
              title="Clients"
              searchPlaceholder="Search clients..."
              data={sortedClients}
              columns={clientColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddRequest={handleAddRequest}
              onAddInfo={handleAddInfo}
              onEnd={handleEnd}
              onViewItem={handleViewClient}
              onCreate={handleAddNew}
              resource="clients"
              customActions={
                <Button
                  variant={showEnded ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowEnded(!showEnded)}
                  className="shadow-sm"
                >
                  {showEnded ? "Hide Ended" : "Show Ended"}
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
            <EndDialog
              isOpen={isEndDialogOpen}
              onOpenChange={(open) => {
                setIsEndDialogOpen(open);
                if (!open) setEndDetails(null);
              }}
              entityLabel="Client"
              endDate={endDetails?.endDate}
              onEndDateChange={(date) =>
                setEndDetails((prev) =>
                  prev ? { ...prev, endDate: date } : prev
                )
              }
              onConfirm={handleConfirmEnd}
              confirmDisabled={
                (endDetails?.endDate !== "open" && !endDetails?.endDate) ||
                !endDetails?.personId ||
                endClientMutation.isPending
              }
              endDescription="Select an end date. This will also archive the client."
              undoDescription="This will undo ending the client. Associated requests will not be affected."
            />
          </>
        }
      />
      <Route path="create" element={<ClientForm />} />
      <Route path="edit/:id" element={<ClientForm />} />
      <Route path="info" element={<InfoForm />} />
    </Routes>
  );
}

export const associatedClientRoutes: any[] = [
  // Dashboard Analytics

  // Clients
  trpc.clients.getAll,
  trpc.clients.getAllNotEnded,
  trpc.clients.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllInfo,
  trpc.packages.getAllWithoutInfo,
  trpc.packages.getAllWithoutInfoNotEndedYet,
  trpc.packages.getById,

  // Requests
  trpc.requests.getAllWithoutInfoWithPackages,
  trpc.requests.getAllInfoMetadata,
  trpc.requests.getAllMetadataWithoutInfo,
  trpc.requests.getAllWithoutInfoNotEndedYetWithPackages,
  trpc.requests.getById,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotEnded,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
