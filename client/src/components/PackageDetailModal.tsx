import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { trpc } from "../utils/trpc";
import { PermissionGate } from "./PermissionGate";
import { DeleteAlert } from "./DeleteAlert";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "./DataTable";
import { packageColumns } from "@/routes/PackageRoutes";

interface PackageDetailModalProps {
  pkgId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PackageDetailModal({
  pkgId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: PackageDetailModalProps) {
  const pkgQuery = useQuery(trpc.packages.getById.queryOptions({ id: pkgId }));
  const pkg = pkgQuery.data;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && pkg) {
      onDelete(pkg.id);
    }
    setDeleteDialogOpen(false);
    onClose(); // Close the main modal after deletion
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const renderDetailItem = (
    label: string,
    value?: string | string[] | number
  ) => {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    )
      return null;

    const displayValue = Array.isArray(value)
      ? value.join(", ")
      : value.toString();

    return (
      <div className="mb-2">
        <span className="font-medium text-gray-700">{label}:</span>{" "}
        <span className="text-gray-600">{displayValue}</span>
      </div>
    );
  };

  if (!pkg) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Package Details: {pkg.details.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="details" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-1 mb-4">
              <TabsTrigger value="details">Package Details</TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Package Information
              </h3>
              {renderDetailItem("Package ID", pkg.id)}
              {renderDetailItem("Carer Name", pkg.details.name)}
              {renderDetailItem("Start Date", pkg.startDate)}
              {renderDetailItem(
                "End Date",
                pkg.endDate === "open" ? "Ongoing" : pkg.endDate
              )}
              {renderDetailItem("Weekly Hours", pkg.details.weeklyHours)}

              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2 text-gray-700">
                  Service Address
                </h4>
                {renderDetailItem(
                  "Street Address",
                  pkg.details.address.streetAddress
                )}
                {renderDetailItem("Locality", pkg.details.address.locality)}
                {renderDetailItem("County", pkg.details.address.county)}
                {renderDetailItem("Post Code", pkg.details.address.postCode)}
              </div>

              {renderDetailItem("Services", pkg.details.services)}
              {renderDetailItem("Notes", pkg.details.notes)}
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <div className="flex gap-2">
            <PermissionGate resource="packages" action="update">
              {onEdit && (
                <Button onClick={() => onEdit(pkg.id)} variant="outline">
                  Edit
                </Button>
              )}
            </PermissionGate>
            <PermissionGate resource="packages" action="delete">
              {onDelete && (
                <Button onClick={handleDeleteClick} variant="destructive">
                  Delete
                </Button>
              )}
            </PermissionGate>
          </div>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      <DeleteAlert
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        itemName={pkg?.details.name}
        itemType="package"
      />
    </Dialog>
  );
}
