import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { PackageForm } from "../pages/PackageForm";
import { RenewPackageForm } from "../pages/RenewPackageForm";
import { RequestDetailModal } from "../components/RequestDetailModal";
import { PackageDetailModal } from "../components/PackageDetailModal";
import { trpc } from "../utils/trpc";
import type { Package, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoverPackageForm } from "@/pages/CoverPackageForm";

export const packageColumns: TableColumn<Package>[] = [
  {
    key: "name",
    header: "Carer Name",
    render: (item: Package) => item.details.name,
  },
  {
    key: "startDate",
    header: "Start Date",
    render: (item: Package) => item.startDate,
  },
  {
    key: "endDate",
    header: "End Date",
    render: (item: Package) =>
      item.endDate === "open" ? "Ongoing" : item.endDate,
  },
  {
    key: "oneOff",
    header: "One-Off Hours",
    render: (item: Package) => item.details.oneOffStartDateHours || 0,
  },
  {
    key: "weeklyHours",
    header: "Weekly Hours",
    render: (item: Package) => item.details.weeklyHours,
  },
  {
    key: "locality",
    header: "Location",
    render: (item: Package) => item.details.address.locality,
  },
  {
    key: "services",
    header: "Services",
    render: (item: Package) => item.details.services.join(", "),
  },
];

export default function PackageRoutes() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<
    "active" | "completed" | "archived"
  >("active");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const packagesQuery = useQuery(
    viewState === "active"
      ? trpc.packages.getAllNotEndedYet.queryOptions()
      : viewState === "completed"
      ? trpc.packages.getAllNotArchived.queryOptions()
      : trpc.packages.getAll.queryOptions()
  );

  const packages = packagesQuery.data || [];

  const deletePackageMutation = useMutation(
    trpc.packages.delete.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/packages/create");
  };

  const handleCover = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/packages/cover/${encodedId}`);
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/packages/edit/${encodedId}`);
  };

  const handleRenew = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/packages/renew/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deletePackageMutation.mutate({ id });
  };

  const handleViewRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsModalOpen(true);
  };

  const handleViewPackage = (packageId: string) => {
    setSelectedPackageId(packageId);
    setIsPackageModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleEditRequest = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/requests/edit?id=${encodedId}`);
  };

  const handleDeleteRequest = (_id: string) => {
    // This would need a request delete mutation
    // For now, just close the modal
    handleCloseModal();
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

  if (packagesQuery.isLoading) return <div>Loading...</div>;
  if (packagesQuery.error) return <div>Error loading packages</div>;

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <DataTable
              key={`packages-${viewState}`}
              title="Packages"
              searchPlaceholder="Search packages..."
              data={packages}
              columns={packageColumns}
              onEdit={handleEdit}
              onCover={handleCover}
              onDelete={handleDelete}
              onRenew={handleRenew}
              onCreate={handleAddNew}
              onViewItem={handleViewPackage}
              onViewRequest={handleViewRequest}
              resource="packages"
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
        <Route path="create" element={<PackageForm />} />
        <Route path="cover/:id" element={<CoverPackageForm />} />
        <Route path="edit/:id" element={<PackageForm />} />
        <Route path="renew/:id" element={<RenewPackageForm />} />
      </Routes>
      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onEdit={handleEditRequest}
          onDelete={handleDeleteRequest}
        />
      )}
      {selectedPackageId && (
        <PackageDetailModal
          pkgId={selectedPackageId}
          isOpen={isPackageModalOpen}
          onClose={() => {
            setIsPackageModalOpen(false);
            setSelectedPackageId(null);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

export const associatedPackageRoutes: any[] = [
  // Analytics
  trpc.analytics.getActivePackagesCrossSection,
  trpc.analytics.getActiveRequestsCrossSection,
  trpc.analytics.getRequestsReport,
  trpc.analytics.getPackagesReport,

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
