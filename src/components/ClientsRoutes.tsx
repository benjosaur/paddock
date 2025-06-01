import { useNavigate, Routes, Route } from "react-router-dom";
import { DataTable } from "./DataTable";
import { ClientForm } from "./ClientForm";
import { mockClients } from "../data/mockData";
import type { Client, TableColumn } from "../types";

const clientColumns: TableColumn<Client>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "age", header: "Age" },
  { key: "postCode", header: "Post Code" },
  {
    key: "servicesProvided",
    header: "Services",
    render: (item: Client) => item.servicesProvided.join(", "),
  },
  {
    key: "needs",
    header: "Need Types",
    render: (item: Client) => item.needs.join(", "),
  },
  {
    key: "hasMp",
    header: "Has MP?",
    render: (item: Client) => (item.hasMp ? "Yes" : "No"),
  },
  {
    key: "hasAttendanceAllowance",
    header: "Has AA?",
    render: (item: Client) => (item.hasAttendanceAllowance ? "Yes" : "No"),
  },
];

interface ClientsRoutesProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewClient: (client: Client) => void;
}

export default function ClientsRoutes({
  onEdit,
  onDelete,
  onViewClient,
}: ClientsRoutesProps) {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/clients/create");
  };

  return (
    <Routes>
      <Route
        index
        element={
          <DataTable
            key="clients"
            title="Clients"
            searchPlaceholder="Search clients..."
            data={mockClients}
            columns={clientColumns}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewItem={onViewClient as (item: unknown) => void}
            onAddNew={handleAddNew}
          />
        }
      />
      <Route path="create" element={<ClientForm />} />
    </Routes>
  );
}
