import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { RequestForm } from "../pages/RequestForm";
import { RenewRequestForm } from "../pages/RenewRequestForm";
import { RequestDetailModal } from "../components/RequestDetailModal";
import { trpc } from "../utils/trpc";
import type { RequestFull, TableColumn } from "../types";
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
  const [viewState, setViewState] = useState<
    "active" | "completed" | "archived"
  >("active");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const requestsQuery = useQuery(
    viewState === "active"
      ? trpc.requests.getAllNotEndedYet.queryOptions()
      : viewState === "completed"
      ? trpc.requests.getAllNotArchived.queryOptions()
      : trpc.requests.getAll.queryOptions()
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleDelete = (id: string) => {
    deleteRequestMutation.mutate({ id });
  };

  const handleViewToggle = () => {
    if (viewState === "active") {
      setViewState("completed");
    } else if (viewState === "completed") {
      setViewState("archived");
    } else {
      setViewState("active");
    }
  };

  const getButtonText = () => {
    if (viewState === "active") return "Show Completed";
    if (viewState === "completed") return "Show Archived";
    return "Hide Archived";
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
              key={`requests-${viewState}`}
              title="Requests"
              searchPlaceholder="Search requests..."
              data={requests}
              columns={requestColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddPackage={handleAddPackage}
              onRenew={handleRenew}
              onCreate={handleAddNew}
              onViewItem={handleView}
              resource="requests"
              customActions={
                <Button
                  variant={viewState !== "active" ? "default" : "outline"}
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
    </>
  );
}

export const associatedRequestRoutes: any[] = [
  // Analytics
  trpc.analytics.getActivePackagesCrossSection,
  trpc.analytics.getActiveRequestsCrossSection,
  trpc.analytics.getRequestsReport,
  trpc.analytics.getPackagesReport,

  // Requests
  trpc.requests.getAll,
  trpc.requests.getAllNotArchived,
  trpc.requests.getAllNotEndedYet,
  trpc.requests.getById,
  trpc.requests.getAllMetadata,

  // Packages
  trpc.packages.getAll,
  trpc.packages.getAllNotArchived,
  trpc.packages.getAllNotEndedYet,
  trpc.packages.getById,

  // Clients
  trpc.clients.getAll,
  trpc.clients.getAllNotArchived,
  trpc.clients.getById,

  // MPs
  trpc.mps.getAll,
  trpc.mps.getAllNotArchived,
  trpc.mps.getById,

  // Volunteers
  trpc.volunteers.getAll,
  trpc.volunteers.getAllNotArchived,
  trpc.volunteers.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotArchived,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
