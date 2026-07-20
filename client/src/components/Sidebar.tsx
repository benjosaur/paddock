import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { getVisibleMenuItems } from "../utils/permissions";
import { PaddockUser } from "@/types/auth";

interface SidebarProps {
  user: PaddockUser;
  onSignOut: () => Promise<void>;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuItems = getVisibleMenuItems(user.role);

  // Close the drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const content = (
    <>
      <div className="flex items-center gap-2.5 px-3">
        <img src="/wivey-cares.png" alt="" className="h-7 w-7 rounded-md" />
        <span className="text-lg font-bold text-gray-800">Wivey Cares</span>
      </div>
      <div className="mt-3 mb-4 px-3">
        <span className="inline-block rounded-full bg-gray-200/70 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
          {user.role}
        </span>
      </div>

      <nav className="flex flex-1 flex-col space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            data-copilot-id={`nav.${item.key}`}
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
        className="mt-3 flex w-full cursor-pointer items-center space-x-2 rounded-md border-t border-gray-200/60 px-3 pb-2.5 pt-4 text-sm text-gray-600 transition-colors duration-150 ease-in-out hover:text-gray-800"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center gap-2 border-b border-gray-200/60 bg-white/90 px-3 py-2.5 backdrop-blur-sm md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src="/wivey-cares.png" alt="" className="h-6 w-6 rounded" />
        <span className="font-bold text-gray-800">Wivey Cares</span>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-gray-50 p-4 shadow-xl"
          >
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              autoFocus
              className="mb-2 self-end rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-52 flex-col border-r border-gray-200/60 bg-gradient-to-b from-gray-50/90 to-gray-100/80 p-4 backdrop-blur-sm md:flex">
        {content}
      </aside>
    </>
  );
}
