import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/button";
import { RequestForm } from "../pages/RequestForm";
import { RequestDetailModal } from "../components/RequestDetailModal";
import { trpc } from "../utils/trpc";
import type { RequestFull, RequestMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const requestColumns: TableColumn<RequestFull>[] = [
  {
    key: "id",
    header: "Request ID",
    render: (item) => item.id,
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
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const requestsQuery = useQuery(
    showArchived 
      ? trpc.requests.getAll.queryOptions()
      : trpc.requests.getAllNotArchived.queryOptions()
  );

  const requestsQueryKey = showArchived 
    ? trpc.requests.getAll.queryKey()
    : trpc.requests.getAllNotArchived.queryKey();

  const requests = requestsQuery.data || [];

  const deleteRequestMutation = useMutation(
    trpc.requests.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: requestsQueryKey });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/requests/create");
  };

  const handleAdd = (requestId: string) => {
    navigate("/packages/create", { state: { requestId } });
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/requests/edit?id=${encodedId}`);
  };

  const handleView = (request: RequestMetadata) => {
    setSelectedRequestId(request.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleDelete = (id: string) => {
    deleteRequestMutation.mutate({ id });
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
              key={`requests-${showArchived}`}
              title="Requests"
              searchPlaceholder="Search requests..."
              data={requests}
              columns={requestColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onAddNew={handleAddNew}
              onViewItem={handleView}
              resource="requests"
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
          }
        />
        <Route path="create" element={<RequestForm />} />
        <Route path="edit" element={<RequestForm />} />
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
