import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { hasPermission } from "../utils/permissions";

interface PermissionGateProps {
  resource: string;
  action: "read" | "create" | "update" | "delete";
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();

  if (!user || !hasPermission(user.role, resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
