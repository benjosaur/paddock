import type { UserRole } from "../types";

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const menuItems = [
    "Logs",
    "MP volunteer MAG",
    "MP",
    "Volunteers",
    "Expiries",
    "Expiries",
  ];

  return (
    <div className="w-48 bg-gray-100 p-4 space-y-2">
      <div className="mb-6">
        <div className="text-sm text-gray-600">View:</div>
        <div className="font-medium text-gray-900">{userRole}</div>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              index === 0
                ? "bg-gray-200 text-gray-900 font-medium"
                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}
