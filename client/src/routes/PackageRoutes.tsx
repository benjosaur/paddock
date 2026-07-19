import { useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/tables/DataTable";
import { Button } from "../components/ui/button";
import { PackageForm } from "../pages/PackageForm";
import { RenewPackageForm } from "../pages/RenewPackageForm";
import { RequestDetailModal } from "../components/modals/RequestDetailModal";
import { PackageDetailModal } from "../components/modals/PackageDetailModal";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { Package, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoverPackageForm } from "@/pages/CoverPackageForm";
import { SolePackageForm } from "@/pages/SolePackageForm";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export const packageColumns: TableColumn<Package>[] = [
  {
    key: "name",
    header: "Carer Name",
    render: (item: Package) => item.details.name,
    sortValue: (item) => item.details.name,
  },
  {
    key: "startDate",
    header: "Start Date",
    render: (item: Package) => formatYmdToDmy(item.startDate),
    sortValue: (item) => item.startDate || null,
  },
  {
    key: "endDate",
    header: "End Date",
    render: (item: Package) =>
      item.endDate === "open"
        ? "Ongoing"
        : formatYmdToDmy(item.endDate as string),
    sortValue: (item) => (item.endDate === "open" ? null : item.endDate || null),
  },
  {
    key: "oneOff",
    header: "One-Off Hours",
    render: (item: Package) => item.details.oneOffStartDateHours || 0,
    sortValue: (item) => item.details.oneOffStartDateHours || 0,
  },
  {
    key: "weeklyHours",
    header: "Weekly Hours",
    render: (item: Package) => item.details.weeklyHours,
    sortValue: (item) => item.details.weeklyHours,
  },
  {
    key: "locality",
    header: "Location",
    render: (item: Package) => {
      if ("requestId" in item) {
        return item.details.address.locality;
      }
    },
    sortValue: (item) =>
      "requestId" in item ? item.details.address.locality : null,
  },
  {
    key: "postCode",
    header: "Post Code",
    render: (item: Package) => {
      if ("requestId" in item) {
        return item.details.address.postCode;
      }
    },
    sortValue: (item) =>
      "requestId" in item ? item.details.address.postCode : null,
    defaultHidden: true,
  },
  {
    key: "services",
    header: "Services",
    render: (item: Package) => item.details.services.join(", "),
    sortValue: (item) => item.details.services.join(", "),
  },
];

export default function PackageRoutes() {
  const navigate = useNavigate();
  const [showEnded, setShowEnded] = useState(false);
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
    showEnded
      ? trpc.packages.getAllWithoutInfo.queryOptions()
      : trpc.packages.getAllWithoutInfoNotEndedYet.queryOptions()
  );

  const packages = packagesQuery.data || [];

  // Split packages by whether they are linked to a request
  const requestPackages = packages.filter(
    (p: any) => "requestId" in p && Boolean(p.requestId)
  );
  const independentPackages = packages.filter(
    (p: any) => !("requestId" in p) || !p.requestId
  );

  const deletePackageMutation = useMutation(
    trpc.packages.delete.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleCover = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/packages/cover/${encodedId}`);
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/packages/edit/${encodedId}`);
  };

  const handleEditSolePackage = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/packages/sole/edit?id=${encodedId}`);
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
    setShowEnded((prev) => !prev);
  };

  const getButtonText = () => {
    return showEnded ? "Hide Ended" : "Show Ended";
  };

  if (packagesQuery.isLoading) return <div>Loading...</div>;
  if (packagesQuery.error) return <div>Error loading care confirmations</div>;

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="requests">For Care Requests</TabsTrigger>
                <TabsTrigger value="independent">Independent</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="mt-6">
                <DataTable
                  key={`packages-requests-${showEnded ? "ended" : "active"}`}
                  tableId="packages"
                  title="Care Confirmed"
                  searchPlaceholder="Search care confirmations..."
                  data={requestPackages}
                  columns={packageColumns}
                  defaultSortKey="name"
                  onEdit={handleEdit}
                  onCover={handleCover}
                  onDelete={handleDelete}
                  onRenew={handleRenew}
                  onViewItem={handleViewPackage}
                  onViewRequest={handleViewRequest}
                  resource="packages"
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
              </TabsContent>

              <TabsContent value="independent" className="mt-6">
                <DataTable
                  key={`packages-independent-${showEnded ? "ended" : "active"}`}
                  tableId="packages"
                  title="Care Confirmed"
                  searchPlaceholder="Search care confirmations..."
                  data={independentPackages}
                  columns={packageColumns}
                  defaultSortKey="name"
                  onEdit={handleEditSolePackage}
                  onCover={handleCover}
                  onDelete={handleDelete}
                  onRenew={handleRenew}
                  // onCreate={handleAddNew}
                  onViewItem={handleViewPackage}
                  resource="packages"
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
              </TabsContent>
            </Tabs>
          }
        />
        <Route path="create" element={<PackageForm />} />
        <Route path="cover/:id" element={<CoverPackageForm />} />
        <Route path="edit/:id" element={<PackageForm />} />
        <Route path="renew/:id" element={<RenewPackageForm />} />
        <Route path="sole/create" element={<SolePackageForm />} />
        <Route path="sole/edit" element={<SolePackageForm />} />
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

  // Requests
  trpc.requests.getAllWithoutInfoWithPackages,
  trpc.requests.getAllInfoMetadata,
  trpc.requests.getAllMetadataWithoutInfo,
  trpc.requests.getAllWithoutInfoNotEndedYetWithPackages,
  trpc.requests.getById,

  // Packages
  trpc.packages.getAllWithoutInfo,
  trpc.packages.getAllWithoutInfoNotEndedYet,
  trpc.packages.getById,

  // Clients
  trpc.clients.getAll,
  trpc.clients.getAllNotEndedYet,
  trpc.clients.getById,

  // MPs
  trpc.mps.getAll,
  trpc.mps.getAllNotEndedYet,
  trpc.mps.getById,

  // Volunteers
  trpc.volunteers.getAll,
  trpc.volunteers.getAllNotEndedYet,
  trpc.volunteers.getById,

  // MAG
  trpc.mag.getAll,
  trpc.mag.getById,

  // Training records
  trpc.trainingRecords.getAll,
  trpc.trainingRecords.getAllNotEndedYet,
  trpc.trainingRecords.getById,
  trpc.trainingRecords.getByExpiringBefore,
];
