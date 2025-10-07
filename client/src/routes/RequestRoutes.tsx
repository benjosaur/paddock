import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import EndDialog from "../components/EndDialog";
import { RequestForm } from "../pages/RequestForm";
import { RenewRequestForm } from "../pages/RenewRequestForm";
import { RequestDetailModal } from "../components/RequestDetailModal";
import { trpc } from "../utils/trpc";
import type { RequestFull, TableColumn } from "../types";
import type { EndRequestDetails } from "shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const requestColumns: TableColumn<RequestFull>[] = [
  {
    key: "clientCustomId",
    header: "Client Custom Id",
    render: (item) => item.details.customId,
  },
  {
    key: "clientName",
    header: "Client Name",
    render: (item) => item.details.name,
  },
  {
    key: "requestType",
    header: "Type",
    render: (item) => item.requestType,
  },
  {
    key: "startDate",
    header: "Start Date",
    render: (item) => item.startDate,
  },
  {
    key: "endDate",
    header: "End Date",
    render: (item) => (item.endDate === "open" ? "Ongoing" : item.endDate),
  },
  {
    key: "oneOffStartDateHours",
    header: "One Off Hours",
    render: (item) => item.details.oneOffStartDateHours,
  },
  {
    key: "oneOffServicedHours",
    header: "One Off Serviced",
    render: (item) =>
      item.packages
        .map((pkg) => pkg.details.oneOffStartDateHours)
        .reduce((a, b) => a + b, 0),
  },
  {
    key: "weeklyHours",
    header: "Weekly Hours",
    render: (item) => item.details.weeklyHours,
  },
  {
    key: "weeklyServicedHours",
    header: "Hours in Service",
    render: (item) =>
      item.packages
        .map((pkg) => {
          if (pkg.endDate == "open" || new Date(pkg.endDate) > new Date()) {
            return pkg.details.weeklyHours;
          }
          return 0;
        })
        .reduce((a, b) => a + b, 0),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => item.details.status,
  },
];

export default function RequestRoutes() {
  const navigate = useNavigate();
  const [showEnded, setShowEnded] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endRequestDetails, setEndRequestDetails] =
    useState<EndRequestDetails | null>(null);

  const queryClient = useQueryClient();

  const requestsQuery = useQuery(
    showEnded
      ? trpc.requests.getAllWithoutInfoWithPackages.queryOptions()
      : trpc.requests.getAllWithoutInfoNotEndedYetWithPackages.queryOptions()
  );

  const requests = requestsQuery.data || [];

  const deleteRequestMutation = useMutation(
    trpc.requests.delete.mutationOptions({
      onSuccess: () => {
        associatedRequestRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const endRequestMutation = useMutation(
    trpc.requests.endRequestAndPackages.mutationOptions({
      onSuccess: () => {
        associatedRequestRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/requests/create");
  };

  const handleAddPackage = (requestId: string) => {
    navigate("/packages/create", { state: { requestId } });
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/requests/edit?id=${encodedId}`);
  };

  const handleRenew = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/requests/renew?id=${encodedId}`);
  };

  const handleView = (id: string) => {
    setSelectedRequestId(id);
    setIsModalOpen(true);
  };

  const handleEnd = (item: RequestFull) => {
    const id = item.id;
    setEndRequestDetails({ requestId: id, endDate: "" });
    setIsEndDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleDelete = (id: string) => {
    deleteRequestMutation.mutate({ id });
  };

  const handleViewToggle = () => {
    setShowEnded((prev) => !prev);
  };

  const getButtonText = () => {
    return showEnded ? "Hide Ended" : "Show Ended";
  };

  if (requestsQuery.isLoading) return <div>Loading...</div>;
  if (requestsQuery.error) return <div>Error loading requests</div>;

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <DataTable
              key={`requests-${showEnded ? "ended" : "active"}`}
              title="Requests"
              searchPlaceholder="Search requests..."
              data={requests}
              columns={requestColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddPackage={handleAddPackage}
              onRenew={handleRenew}
              onEnd={handleEnd}
              onCreate={handleAddNew}
              onViewItem={handleView}
              resource="requests"
              customActions={
                <Button
                  variant={showEnded ? "default" : "outline"}
                  size="sm"
                  onClick={handleViewToggle}
                  className="shadow-sm"
                >
                  {getButtonText()}
                </Button>
              }
            />
          }
        />
        <Route path="create" element={<RequestForm />} />
        <Route path="edit" element={<RequestForm />} />
        <Route path="renew" element={<RenewRequestForm />} />
      </Routes>
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      <EndDialog
        isOpen={isEndDialogOpen}
        onOpenChange={(open) => {
          setIsEndDialogOpen(open);
          if (!open) setEndRequestDetails(null);
        }}
        entityLabel="Request"
        endDate={endRequestDetails?.endDate}
        onEndDateChange={(date) =>
          setEndRequestDetails((prev) =>
            prev ? { ...prev, endDate: date } : prev
          )
        }
        onConfirm={() => {
          if (!endRequestDetails?.requestId || !endRequestDetails.endDate)
            return;
          endRequestMutation.mutate(endRequestDetails);
          setIsEndDialogOpen(false);
          setEndRequestDetails(null);
        }}
        confirmDisabled={
          !endRequestDetails?.endDate ||
          !endRequestDetails?.requestId ||
          endRequestMutation.isPending
        }
        endDescription="Select an end date. This will also end all associated ongoing packages."
        undoDescription=""
      />
    </>
  );
}

export const associatedRequestRoutes: any[] = [
  // Analytics
  trpc.analytics.getActivePackagesCrossSection,
  trpc.analytics.getActiveRequestsCrossSection,
  trpc.analytics.getRequestsReport,
  trpc.analytics.getPackagesReport,

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

  // Clients
  trpc.clients.getAll,
  trpc.clients.getAllNotEnded,
  trpc.clients.getById,

  // MPs
  trpc.mps.getAll,
  trpc.mps.getAllNotEnded,
  trpc.mps.getById,

  // Volunteers
  trpc.volunteers.getAll,
  trpc.volunteers.getAllNotEnded,
  trpc.volunteers.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotEnded,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
