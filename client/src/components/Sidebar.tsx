import type { UserRole } from "../types";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const location = useLocation();
  const menuItems = [
    { key: "mp-logs", label: "MP Logs", path: "/mp-logs" },
    { key: "volunteer-logs", label: "Volunteer Logs", path: "/volunteer-logs" },
    { key: "mag-logs", label: "MAG Logs", path: "/mag-logs" },
    { key: "clients", label: "Clients", path: "/clients" },
    { key: "mps", label: "MPs", path: "/mps" },
    { key: "volunteers", label: "Volunteers", path: "/volunteers" },
    { key: "expiries", label: "Expiries", path: "/expiries" },
    { key: "new-requests", label: "New Requests", path: "/new-requests" },
    { key: "table-search", label: "Search Tables", path: "/table-search" },
  ];

  return (
    <div className="w-48 bg-gradient-to-b from-gray-50/90 to-gray-100/80 backdrop-blur-sm border-r border-gray-200/60 p-6 flex flex-col space-y-3">
      <div className="mb-8">
        <div className="text-sm text-gray-500 font-medium">View:</div>
        <div className="font-semibold text-gray-800 mt-1">{userRole}</div>
      </div>

      <nav className="flex flex-col space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`block w-full select-none text-left px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out ${
              location.pathname === item.path
                ? "bg-gray-200/70 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
