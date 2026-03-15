import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/tables/DataTable";
import { MagLogForm } from "../pages/MagLogForm";
import { trpc } from "../utils/trpc";
import { formatYmdToDmy } from "@/utils/date";
import type { ClientFull, MagLog, TableColumn } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const magLogColumns: TableColumn<MagLog>[] = [
  {
    key: "date",
    header: "Date",
    render: (item) => formatYmdToDmy(item.date),
    sortValue: (item) => item.date || null,
  },
  {
    key: "total",
    header: "Total Attendees",
    render: (item: ClientFull["magLogs"][number]) =>
      item.details.totalVolunteers +
      item.details.totalClients +
      item.details.totalFamily +
      item.details.totalMps +
      item.details.otherAttendees,
    sortValue: (item) =>
      item.details.totalVolunteers +
      item.details.totalClients +
      item.details.totalFamily +
      item.details.totalMps +
      item.details.otherAttendees,
  },
  {
    key: "volunteerHours",
    header: "Volunteer Hours",
    render: (item: MagLog) => {
      const duration = item.totalHours ?? 0;
      const count = item.volunteers?.length ?? 0;
      return Math.round(duration * count * 100) / 100;
    },
    sortValue: (item) => {
      const duration = item.totalHours ?? 0;
      const count = item.volunteers?.length ?? 0;
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

export default function MagLogRoutes() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const magQuery = useQuery(trpc.mag.getAll.queryOptions());

  const mag = magQuery.data || [];

  const deleteMagLogMutation = useMutation(
    trpc.mag.delete.mutationOptions({
      onSuccess: () => {
        associatedMagLogRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const handleAddNew = () => {
    navigate("/mag/new");
  };

  const handleEdit = (id: string) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/mag/edit/${encodedId}`);
  };

  const handleDelete = (id: string) => {
    deleteMagLogMutation.mutate({ id });
  };

  if (magQuery.isLoading) return <div>Loading...</div>;
  if (magQuery.error) return <div>Error loading MP </div>;

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="mag-logs"
            title="MAG "
            searchPlaceholder="Search MAG logs..."
            data={mag}
            columns={magLogColumns}
            defaultSortKey="date"
            defaultSortDirection="desc"
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleAddNew}
            resource="mag"
          />
        }
      />
      <Route path="new" element={<MagLogForm />} />
      <Route path="edit/:id" element={<MagLogForm />} />
    </Routes>
  );
}

export const associatedMagLogRoutes: any[] = [
  // MAG logs
  trpc.mag.getAll,
  trpc.mag.getById,
];
