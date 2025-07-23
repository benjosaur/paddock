import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { RequestForm } from "../pages/RequestForm";
import { trpc } from "../utils/trpc";
import type { RequestMetadata, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const requestColumns: TableColumn<RequestMetadata>[] = [
  {
    key: "id",
    header: "Request ID",
    render: (item: RequestMetadata) => item.id,
  },
  {
    key: "clientName",
    header: "Client Name",
    render: (item: RequestMetadata) => item.details.name,
  },
  {
    key: "requestType",
    header: "Type",
    render: (item: RequestMetadata) => item.requestType,
  },
  {
    key: "startDate",
    header: "Start Date",
    render: (item: RequestMetadata) => item.startDate,
  },
  {
    key: "endDate",
    header: "End Date",
    render: (item: RequestMetadata) =>
      item.endDate === "open" ? "Ongoing" : item.endDate,
  },
  {
    key: "weeklyHours",
    header: "Weekly Hours",
    render: (item: RequestMetadata) => item.details.weeklyHours,
  },
  {
    key: "status",
    header: "Status",
    render: (item: RequestMetadata) => item.details.status,
  },
];

export default function RequestRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const requestsQuery = useQuery(trpc.requests.getAllMetadata.queryOptions());

  const requestsQueryKey = trpc.requests.getAllMetadata.queryKey();

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

  const handleDelete = (id: string) => {
    deleteRequestMutation.mutate({ id });
  };

  if (requestsQuery.isLoading) return <div>Loading...</div>;
  if (requestsQuery.error) return <div>Error loading requests</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="requests"
            title="Requests"
            searchPlaceholder="Search requests..."
            data={requests}
            columns={requestColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onAddNew={handleAddNew}
            resource="requests"
          />
        }
      />
      <Route path="create" element={<RequestForm />} />
      <Route path="edit" element={<RequestForm />} />
    </Routes>
  );
}
