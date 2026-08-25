// DEV-only mockup gallery: /mockups/timeline/:variant
// Renders each timeline variant inside a stand-in for ClientDetailModal (same
// header, tab bar and footer; the Timeline tab replaces Notes + Attachments).
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AddAttachmentDialog, AddNoteDialog } from "./AddEntryDialogs";
import { MOCK_CLIENT, type MockPerson } from "./data";
import { useTimelineState } from "./useTimelineState";
import { VARIANTS } from "./variants";

export default function TimelineMockupRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to={VARIANTS[0].slug} replace />} />
      <Route path=":variant" element={<TimelineMockupPage />} />
    </Routes>
  );
}

const basePath = "/mockups/timeline";

function TimelineMockupPage() {
  const { variant: slug } = useParams();
  const navigate = useNavigate();
  const index = VARIANTS.findIndex((variant) => variant.slug === slug);

  const state = useTimelineState();
  const [noteOpen, setNoteOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [asDialog, setAsDialog] = useState(false);

  const step = (delta: number) => {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
    navigate(`${basePath}/${next.slug}`);
  };

  // ← / → flick between variants unless you're typing or a dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (noteOpen || fileOpen) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, noteOpen, fileOpen]);

  if (index === -1) return <Navigate to={`${basePath}/${VARIANTS[0].slug}`} replace />;

  const variant = VARIANTS[index];
  const Timeline = variant.component;
  const timeline = (
    <Timeline
      state={state}
      person={MOCK_CLIENT}
      openAddNote={() => setNoteOpen(true)}
      openAddFile={() => setFileOpen(true)}
    />
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200/70 bg-white/80 px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Timeline mockups
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous variant"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {VARIANTS.map((candidate, i) => (
            <Link
              key={candidate.slug}
              to={`${basePath}/${candidate.slug}`}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                candidate.slug === variant.slug
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {i + 1} · {candidate.name}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next variant"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500 lg:inline">
          ← →
        </kbd>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAsDialog(true)} className="gap-1.5">
            <Maximize2 className="h-4 w-4" />
            Open as real modal
          </Button>
          <Button variant="ghost" size="sm" onClick={state.reset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Reset data
          </Button>
        </div>
        <p className="basis-full text-sm text-gray-500">{variant.blurb}</p>
      </div>

      {/* Static frame with the modal's exact chrome, so the switcher stays usable. */}
      <div className="mx-auto flex h-[80vh] w-full max-w-7xl flex-col rounded-lg border bg-background p-6 shadow-lg">
        <DetailShell
          person={MOCK_CLIENT}
          heading={
            <h2 className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent">
              Client Details: {MOCK_CLIENT.name}
            </h2>
          }
        >
          {timeline}
        </DetailShell>
      </div>

      {asDialog && (
        <Dialog open onOpenChange={(open) => !open && setAsDialog(false)}>
          <DialogContent
            className="flex h-[80vh] w-[80vw] flex-col"
            aria-describedby={undefined}
          >
            <DetailShell
              person={MOCK_CLIENT}
              heading={
                <DialogTitle className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent">
                  Client Details: {MOCK_CLIENT.name}
                </DialogTitle>
              }
              onClose={() => setAsDialog(false)}
            >
              {timeline}
            </DetailShell>
          </DialogContent>
        </Dialog>
      )}

      <AddNoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        onSave={state.addNote}
        personName={MOCK_CLIENT.name}
      />
      <AddAttachmentDialog
        open={fileOpen}
        onOpenChange={setFileOpen}
        onSave={state.addAttachment}
        personName={MOCK_CLIENT.name}
      />
    </div>
  );
}

// ClientDetailModal's chrome with the Timeline tab in place of Notes and
// Attachments. The real modal wraps its tabs in `flex-grow overflow-y-auto`;
// the timeline needs `min-h-0` on that chain instead so it can own its own
// scroll region and keep its header pinned.
function DetailShell({
  person,
  heading,
  onClose,
  children,
}: {
  person: MockPerson;
  heading: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 text-center sm:text-left">{heading}</div>
      <div className="flex min-h-0 flex-grow flex-col pr-2">
        <Tabs defaultValue="timeline" className="mt-4 flex min-h-0 w-full flex-1 flex-col">
          <TabsList className="mb-4 grid w-full grid-cols-5">
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="services">Services & Needs</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="requests">New Care Requests</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          {["contact", "services", "logs", "requests"].map((value) => (
            <TabsContent
              key={value}
              value={value}
              className="rounded-lg border bg-white/80 p-4 text-sm text-gray-500"
            >
              Unchanged — as in the current modal for {person.name}.
            </TabsContent>
          ))}
          <TabsContent
            value="timeline"
            className="flex min-h-0 flex-1 flex-col rounded-lg border bg-white/80 p-4"
          >
            {children}
          </TabsContent>
        </Tabs>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button variant="default" disabled>
            Edit
          </Button>
          <Button variant="destructive" disabled>
            Delete
          </Button>
        </div>
        <Button variant="outline" onClick={onClose} disabled={!onClose}>
          Close
        </Button>
      </div>
    </>
  );
}
