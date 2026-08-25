// Small pieces shared by every variant so the variants stay about layout.
import { FileText, FilePlus2, MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MockPerson } from "./data";
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABEL,
  EVENT_META,
  SOURCE_ICON,
  TONE,
  fileKind,
  formatBytes,
  isImage,
  minutesLabel,
  type AttachmentEntry,
  type NoteEntry,
  type TimelineEntry,
  type Tone,
} from "./model";
import type { TimelineState } from "./useTimelineState";

export interface VariantProps {
  state: TimelineState;
  person: MockPerson;
  openAddNote: () => void;
  openAddFile: () => void;
}

export function entryTone(entry: TimelineEntry): Tone {
  return entry.type === "event" ? EVENT_META[entry.kind].tone : "slate";
}

export function EntryIcon({
  entry,
  className,
}: {
  entry: TimelineEntry;
  className?: string;
}) {
  const Icon =
    entry.type === "event"
      ? EVENT_META[entry.kind].icon
      : entry.type === "note"
        ? SOURCE_ICON[entry.source]
        : FileText;
  return <Icon className={className} aria-hidden />;
}

export function noteMeta(entry: NoteEntry): string {
  const minutes = minutesLabel(entry.minutesTaken);
  return minutes ? `${entry.source} · ${minutes}` : entry.source;
}

export function lastContact(entries: TimelineEntry[]): NoteEntry | undefined {
  // entries are newest-first
  return entries.find((entry): entry is NoteEntry => entry.type === "note");
}

// Fade-in plus a ring that the state hook clears after a couple of seconds.
export const highlightClass = (isNew: boolean) =>
  isNew
    ? "motion-safe:animate-in ring-2 ring-blue-400/70 ring-offset-2 ring-offset-white"
    : "";

export function FilterChips({
  state,
  className,
}: {
  state: TimelineState;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label="Show">
      {ENTRY_TYPES.map((type) => {
        const on = state.filters[type];
        return (
          <button
            key={type}
            type="button"
            aria-pressed={on}
            onClick={() => state.toggleFilter(type)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
              on
                ? "border-gray-800 bg-gray-800 text-white"
                : "border-gray-200 bg-white text-gray-500 line-through decoration-gray-400 hover:border-gray-300 hover:text-gray-700",
            )}
          >
            {ENTRY_TYPE_LABEL[type]}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] tabular-nums",
                on ? "bg-white/20" : "bg-gray-100",
              )}
            >
              {state.counts[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AddButtons({
  onNote,
  onFile,
  size = "sm",
  noteVariant = "default",
  fileVariant = "outline",
  className,
}: {
  onNote: () => void;
  onFile: () => void;
  size?: "sm" | "default";
  noteVariant?: "default" | "outline";
  fileVariant?: "default" | "outline";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant={noteVariant} size={size} onClick={onNote} className="gap-1.5">
        <MessageSquarePlus className="h-4 w-4" />
        Add note
      </Button>
      <Button variant={fileVariant} size={size} onClick={onFile} className="gap-1.5">
        <FilePlus2 className="h-4 w-4" />
        Add file
      </Button>
    </div>
  );
}

export function AttachmentThumb({
  entry,
  className,
}: {
  entry: AttachmentEntry;
  className?: string;
}) {
  if (entry.url !== "#" && isImage(entry.contentType)) {
    return (
      <img
        src={entry.url}
        alt=""
        loading="lazy"
        className={cn("shrink-0 rounded-lg object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400",
        className,
      )}
    >
      <FileText className="h-[45%] w-[45%]" aria-hidden />
    </span>
  );
}

export function AttachmentName({
  entry,
  className,
}: {
  entry: AttachmentEntry;
  className?: string;
}) {
  return (
    <a
      href={entry.url === "#" ? undefined : entry.url}
      target="_blank"
      rel="noreferrer"
      title={entry.fileName}
      className={cn(
        "truncate font-medium text-gray-800 hover:underline",
        className,
      )}
    >
      {entry.fileName}
    </a>
  );
}

export function attachmentMeta(entry: AttachmentEntry): string {
  return `${fileKind(entry.contentType)} · ${formatBytes(entry.size)}`;
}

export function DeleteButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete"
      title="Delete"
      className={cn(
        "rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 group-hover:opacity-100",
        className,
      )}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function ToneChip({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE[tone].chip,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  hasEntries,
  onNote,
  onFile,
}: {
  hasEntries: boolean;
  onNote: () => void;
  onFile: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-12 text-center">
      <p className="text-sm text-gray-600">
        {hasEntries
          ? "Nothing matches the current filters."
          : "Nothing logged yet. Add a note or a file to start the timeline."}
      </p>
      {!hasEntries && <AddButtons onNote={onNote} onFile={onFile} />}
    </div>
  );
}
