import type { UserRole } from "../types";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getVisibleMenuItems } from "../utils/permissions";

interface SidebarProps {
  userRole: UserRole;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ userRole, onSignOut }: SidebarProps) {
  const location = useLocation();
  const menuItems = getVisibleMenuItems(userRole);

  return (
    <div className="w-48 bg-gradient-to-b from-gray-50/90 to-gray-100/80 backdrop-blur-sm border-r border-gray-200/60 p-6 flex flex-col space-y-3">
      <div className="self-center text-xl font-bold text-gray-800">
        Wivey Cares
      </div>
      <div className="font-semibold text-gray-800 mt-5 px-3 mb-4">
        {userRole}
      </div>

      <nav className="flex flex-col space-y-1 flex-1">
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

      <button
        onClick={onSignOut}
        className="flex items-center space-x-2 w-full px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100/70 hover:text-gray-800 rounded-md transition-colors duration-150 ease-in-out"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
