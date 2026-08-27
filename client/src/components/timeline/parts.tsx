// Small presentational pieces for the Timeline.
import type { LucideIcon } from "lucide-react";
import { FileText, Paperclip } from "lucide-react";
import type { AttachmentWithUrl } from "shared";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  EVENT_META,
  SOURCE_ICON,
  isImage,
  type TimelineEntry,
} from "./model";

// Journal-style entry bar: a fake input that opens the note dialog, and a
// paperclip for files. Adding lives next to the newest entry.
export function Composer({
  personName,
  onNote,
  onFile,
  uploading,
}: {
  personName: string;
  onNote: () => void;
  onFile: () => void;
  uploading: boolean;
}) {
  const firstName = personName.split(" ")[0];
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gray-200/70 bg-white p-2 shadow-sm">
      <button
        type="button"
        onClick={onNote}
        className="flex h-10 flex-1 cursor-text items-center rounded-xl bg-gray-50 px-4 text-left text-sm text-gray-400 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
      >
        Add a note about {firstName}…
      </button>
      <Button
        variant="outline"
        size={uploading ? "sm" : "icon"}
        onClick={onFile}
        disabled={uploading}
        aria-label="Add file"
        title="Add file"
        className="gap-1.5"
      >
        <Paperclip className="h-4 w-4" />
        {uploading && "Uploading…"}
      </Button>
    </div>
  );
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
        ? SOURCE_ICON[entry.note.source]
        : FileText;
  return <Icon className={className} aria-hidden />;
}

// The server serves url: "" when the environment has no images bucket;
// render those without a link or preview.
export function AttachmentThumb({
  attachment,
  className,
}: {
  attachment: AttachmentWithUrl;
  className?: string;
}) {
  if (attachment.url && isImage(attachment.details.contentType)) {
    return (
      <img
        src={attachment.url}
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
  attachment,
  className,
}: {
  attachment: AttachmentWithUrl;
  className?: string;
}) {
  const name = attachment.details.fileName;
  if (!attachment.url) {
    return (
      <span className={cn("truncate font-medium text-gray-800", className)} title={name}>
        {name}
      </span>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      title={name}
      className={cn("truncate font-medium text-gray-800 hover:underline", className)}
    >
      {name}
    </a>
  );
}

// Hover-revealed action on a card (edit / delete). The card needs `group`.
export function CardAction({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-md p-1 text-gray-400 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover:opacity-100",
        danger
          ? "hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-500/30"
          : "hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-blue-500/30",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
