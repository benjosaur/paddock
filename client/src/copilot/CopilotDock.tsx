import { useRef } from "react";
import { hasPermission } from "../utils/permissions";
import type { PaddockUser } from "../types/auth";
import { CopilotCursor, CursorHandle } from "./CopilotCursor";
import { CopilotWidget } from "./CopilotWidget";

// Mounts the copilot chat widget plus the virtual cursor overlay. Lives
// inside <Router> (the widget's executor navigates via real link clicks and
// the hook needs the shared query client) but outside the per-page
// ErrorBoundary so it survives page errors.
export function CopilotDock({ user }: { user: PaddockUser }) {
  const cursorRef = useRef<CursorHandle | null>(null);

  if (!hasPermission(user.role, "copilot", "create")) return null;

  return (
    <>
      <CopilotWidget role={user.role} cursorRef={cursorRef} />
      <CopilotCursor handleRef={cursorRef} />
    </>
  );
}
