import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/tables/DataTable";
import { HubGrubLogForm } from "../pages/HubGrubLogForm";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { HubGrubLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const hubGrubLogColumns: TableColumn<HubGrubLog>[] = [
  {
    key: "date",
    header: "Date",
    render: (item) => formatYmdToDmy(item.date),
    sortValue: (item) => item.date || null,
  },
  {
    key: "total",
    header: "Total Attendees",
    render: (item: HubGrubLog) =>
      item.details.totalVolunteers +
      item.details.totalClients +
      item.details.otherAttendees,
    sortValue: (item) =>
      item.details.totalVolunteers +
      item.details.totalClients +
      item.details.otherAttendees,
  },
  {
    key: "volunteerHours",
    header: "Volunteer Hours",
    render: (item: HubGrubLog) => {
      const duration = item.totalHours ?? 0;
      const count = item.details.totalVolunteers ?? 0;
      return Math.round(duration * count * 100) / 100;
    },
    sortValue: (item) => {
      const duration = item.totalHours ?? 0;
      const count = item.details.totalVolunteers ?? 0;
      return Math.round(duration * count * 100) / 100;
    },
  },
  {
    key: "notes",
    header: "Notes",
    render: (item) => item.details.notes,
    sortValue: (item) => item.details.notes || null,
  },
];

export default function HubGrubLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const hubGrubQuery = useQuery(trpc.hubGrub.getAll.queryOptions());

  const hubGrub = hubGrubQuery.data || [];

  const deleteHubGrubLogMutation = useMutation(
    trpc.hubGrub.delete.mutationOptions({
      onSuccess: () => {
        associatedHubGrubLogRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/hub-grub/new");
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/hub-grub/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteHubGrubLogMutation.mutate({ id });
  };

  if (hubGrubQuery.isLoading) return <div>Loading...</div>;
  if (hubGrubQuery.error) return <div>Error loading Hub & Grub</div>;

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="hub-grub-logs"
            title="Hub & Grub"
            searchPlaceholder="Search Hub & Grub logs..."
            data={hubGrub}
            columns={hubGrubLogColumns}
            defaultSortKey="date"
            defaultSortDirection="desc"
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleAddNew}
            resource="hubGrub"
          />
        }
      />
      <Route path="new" element={<HubGrubLogForm />} />
      <Route path="edit/:id" element={<HubGrubLogForm />} />
    </Routes>
  );
}

export const associatedHubGrubLogRoutes: any[] = [
  trpc.hubGrub.getAll,
  trpc.hubGrub.getById,
];
