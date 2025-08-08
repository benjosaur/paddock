import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { PackageForm } from "../pages/PackageForm";
import { RenewPackageForm } from "../pages/RenewPackageForm";
import { trpc } from "../utils/trpc";
import type { Package, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const packageColumns: TableColumn<Package>[] = [
  {
    key: "name",
    header: "Package Name",
    render: (item: Package) => item.details.name,
  },
  {
    key: "carerId",
    header: "Carer ID",
    render: (item: Package) => item.carerId,
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
            onDelete={handleDelete}
            onRenew={handleRenew}
            onCreate={handleAddNew}
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
      <Route path="edit/:id" element={<PackageForm />} />
      <Route path="renew/:id" element={<RenewPackageForm />} />
    </Routes>
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
