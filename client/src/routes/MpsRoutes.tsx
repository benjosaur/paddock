import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { MpForm } from "../components/MpForm";
import { mockMps } from "../data/mockData";
import type { Mp, TableColumn } from "../types";

const mpColumns: TableColumn<Mp>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "postCode", header: "Post Code" },
  {
    key: "servicesOffered",
    header: "Services",
    render: (item: Mp) => item.servicesOffered.join(", "),
  },
  { key: "dbsExpiry", header: "DBS Expiry" },
  { key: "capacity", header: "Capacity?" },
  { key: "transport", header: "Transport?" },
];

export function MpsRoutes({
  handleDelete,
  handleViewMp,
}: {
  handleDelete: (id: string) => void;
  handleViewMp: (mp: Mp) => void;
}) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/mps/create");
  };

  const handleEditNavigation = (id: string) => {
    navigate(`/mps/edit/${id}`);
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="mps"
            title="MPs"
            searchPlaceholder="Search MPs..."
            data={mockMps}
            columns={mpColumns}
            onEdit={handleEditNavigation}
            onDelete={handleDelete}
            onViewItem={handleViewMp as (item: unknown) => void}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<MpForm />} />
      <Route path="edit/:id" element={<MpForm />} />
    </Routes>
  );
}

export default MpsRoutes;
