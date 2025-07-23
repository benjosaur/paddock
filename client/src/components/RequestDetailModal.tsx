import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { trpc } from "../utils/trpc";
import type { RequestFull, TableColumn } from "../types";
import { DataTable } from "./DataTable";
import { useQuery } from "@tanstack/react-query";

interface RequestDetailModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function RequestDetailModal({
  requestId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: RequestDetailModalProps) {
  const requestQuery = useQuery(
    trpc.requests.getById.queryOptions({ id: requestId })
  );
  const request = requestQuery.data;

  const packageModalColumns: TableColumn<RequestFull["packages"][number]>[] = [
    {
      key: "id",
      header: "Package ID",
      render: (item: RequestFull["packages"][number]) => item.id,
    },
    {
      key: "name",
      header: "Package Name",
      render: (item: RequestFull["packages"][number]) => item.details.name,
    },
    {
      key: "carerId",
      header: "Carer ID",
      render: (item: RequestFull["packages"][number]) => item.carerId,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: RequestFull["packages"][number]) => item.startDate,
    },
    {
      key: "endDate",
      header: "End Date",
      render: (item: RequestFull["packages"][number]) =>
        item.endDate === "open" ? "Ongoing" : item.endDate,
    },
    {
      key: "weeklyHours",
      header: "Weekly Hours",
      render: (item: RequestFull["packages"][number]) =>
        item.details.weeklyHours.toString(),
    },
    {
      key: "services",
      header: "Services",
      render: (item: RequestFull["packages"][number]) =>
        item.details.services.join(", "),
    },
  ];

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

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Request Details: {request.details.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information for this request including request details
            and associated packages.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="details" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details">Request Details</TabsTrigger>
              <TabsTrigger value="packages">Associated Packages</TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Request Information
              </h3>
              {renderDetailItem("Request ID", request.id)}
              {renderDetailItem("Request Type", request.requestType)}
              {renderDetailItem("Client Name", request.details.name)}
              {renderDetailItem("Start Date", request.startDate)}
              {renderDetailItem(
                "End Date",
                request.endDate === "open" ? "Ongoing" : request.endDate
              )}
              {renderDetailItem("Status", request.details.status)}
              {renderDetailItem("Weekly Hours", request.details.weeklyHours)}

              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2 text-gray-700">
                  Service Address
                </h4>
                {renderDetailItem(
                  "Street Address",
                  request.details.address.streetAddress
                )}
                {renderDetailItem("Locality", request.details.address.locality)}
                {renderDetailItem("County", request.details.address.county)}
                {renderDetailItem(
                  "Post Code",
                  request.details.address.postCode
                )}
              </div>

              {renderDetailItem("Services", request.details.services)}
              {renderDetailItem("Notes", request.details.notes)}
            </TabsContent>

            <TabsContent
              value="packages"
              className="p-4 border rounded-lg bg-white/80"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Associated Packages ({request.packages?.length || 0})
              </h3>
              {request.packages && request.packages.length > 0 ? (
                <DataTable
                  data={request.packages}
                  columns={packageModalColumns}
                  title=""
                  searchPlaceholder="Search packages..."
                  resource="packages"
                />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No packages associated with this request yet.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          {onEdit && (
            <Button onClick={() => onEdit(request.id)} variant="outline">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button onClick={() => onDelete(request.id)} variant="destructive">
              Delete
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
