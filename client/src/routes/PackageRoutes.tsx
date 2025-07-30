import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { PackageForm } from "../pages/PackageForm";
import { trpc } from "../utils/trpc";
import type { Package, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const packageColumns: TableColumn<Package>[] = [
  {
    key: "id",
    header: "ID",
    render: (item: Package) => item.id,
  },
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
  const [viewState, setViewState] = useState<'active' | 'completed' | 'archived'>('active');

  const queryClient = useQueryClient();

  const packagesQuery = useQuery(
    viewState === 'active' 
      ? trpc.packages.getAllNotEndedYet.queryOptions()
      : viewState === 'completed'
      ? trpc.packages.getAllNotArchived.queryOptions()
      : trpc.packages.getAll.queryOptions()
  );

  const packagesQueryKey = 
    viewState === 'active' 
      ? trpc.packages.getAllNotEndedYet.queryKey()
      : viewState === 'completed'
      ? trpc.packages.getAllNotArchived.queryKey()
      : trpc.packages.getAll.queryKey();

  const packages = packagesQuery.data || [];

  const deletePackageMutation = useMutation(
    trpc.packages.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: packagesQueryKey });
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

  const handleDelete = (id: string) => {
    deletePackageMutation.mutate({ id });
  };

  const handleViewToggle = () => {
    if (viewState === 'active') {
      setViewState('completed');
    } else if (viewState === 'completed') {
      setViewState('archived');
    } else {
      setViewState('active');
    }
  };

  const getButtonText = () => {
    if (viewState === 'active') return 'Show Completed';
    if (viewState === 'completed') return 'Show Archived';
    return 'Hide Archived';
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
            onAddNew={handleAddNew}
            resource="packages"
            customActions={
              <Button
                variant={viewState !== 'active' ? "default" : "outline"}
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
    </Routes>
  );
}
