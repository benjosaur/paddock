// Timeline entry model shared by the Client, MP and Volunteer detail modals.
// Entries are built from the owner's getById payload (see build.ts): system
// events derived from the record, the attachments and the notes.
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Banknote,
  Brain,
  CirclePlay,
  CircleStop,
  ClipboardCheck,
  Flag,
  GraduationCap,
  HeartHandshake,
  Mail,
  Phone,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import type { AttachmentWithUrl, ClientFull } from "shared";

export type Note = ClientFull["details"]["notes"][number];
export type NoteSource = Note["source"];

// Dated facts on the record itself — nothing typed in on this screen.
export type EventKind =
  | "started"
  | "agreement"
  | "risk-assessment"
  | "request-start"
  | "request-end"
  | "package-start"
  | "package-end"
  | "mag"
  | "aa-requested"
  | "aa-confirmed"
  | "training"
  | "fee"
  | "ended";

export interface EventEntry {
  id: string;
  type: "event";
  date: string; // YYYY-MM-DD
  kind: EventKind;
  title: string;
  detail?: string;
}

export interface AttachmentEntry {
  id: string;
  type: "attachment";
  date: string; // the document's own date
  attachment: AttachmentWithUrl;
}

export interface NoteEntry {
  id: string;
  type: "note";
  date: string;
  // Position in details.notes — notes have no id, so this is how edits and
  // deletes address them.
  index: number;
  note: Note;
}

export type TimelineEntry = EventEntry | AttachmentEntry | NoteEntry;

export const noteEntryId = (index: number) => `note-${index}`;
export const attachmentEntryId = (attachmentId: string) => `att-${attachmentId}`;
export const entryDomId = (id: string) => `timeline-entry-${id}`;

export const isYmd = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

// Within one day: what happened to the person first, then the paperwork,
// then the coordinator's notes about it.
const TYPE_RANK: Record<TimelineEntry["type"], number> = {
  event: 0,
  attachment: 1,
  note: 2,
};

// Newest first. Array.prototype.sort is stable, so same-day entries of one
// type keep their source order.
export function sortEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return TYPE_RANK[a.type] - TYPE_RANK[b.type];
  });
}

export interface MonthGroup {
  key: string; // YYYY-MM
  label: string;
  entries: TimelineEntry[];
}

// Expects sorted entries.
export function groupByMonth(entries: TimelineEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, label: fmtMonth(entry.date), entries: [entry] });
  }
  return groups;
}

// ---------------------------------------------------------------- spans

// Same shape as requests/packages: YYYY-MM-DD start, YYYY-MM-DD or "open"
// end, details.weeklyHours and details.oneOffStartDateHours.
export interface DateSpan {
  id: string;
  startDate: string;
  endDate: string;
  weeklyHours: number;
  oneOffStartDateHours: number;
}

const utc = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

// Hours the spans add up to within one month (key: YYYY-MM): weekly hours
// pro-rated over the days each span overlaps the month, plus the one-off
// hours in the month the span starts.
export function hoursInMonth(spans: DateSpan[], monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  const monthStart = Date.UTC(y, m - 1, 1);
  const monthEnd = Date.UTC(y, m, 0); // last day of the month
  const day = 86_400_000;
  let hours = 0;
  for (const span of spans) {
    if (!isYmd(span.startDate)) continue;
    const from = Math.max(utc(span.startDate), monthStart);
    const to = Math.min(
      isYmd(span.endDate) ? utc(span.endDate) : Infinity,
      monthEnd,
    );
    if (to < from) continue;
    const days = (to - from) / day + 1;
    hours += (span.weeklyHours * days) / 7;
    if (span.startDate.startsWith(monthKey)) hours += span.oneOffStartDateHours;
  }
  return hours;
}

/** "18h", "2.5h" */
export function fmtHours(hours: number): string {
  const rounded = Math.round(hours * 2) / 2;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
}

// ------------------------------------------------------------------- dates
// String-based: YYYY-MM-DD never goes through `new Date(str)`, which would
// shift the day in some timezones.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

/** "12 Aug 2026" */
export function fmtShortYear(ymd: string): string {
  const { y, m, d } = parts(ymd);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** "August 2026" */
export function fmtMonth(ymd: string): string {
  const { y, m } = parts(ymd);
  return `${MONTHS[m - 1]} ${y}`;
}

export function todayYmd(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// -------------------------------------------------------------- kind meta

export type Tone = "blue" | "green" | "violet" | "amber" | "slate" | "red";

// Literal class strings so Tailwind's scanner sees every utility.
export const TONE: Record<Tone, { node: string; chip: string; text: string }> =
  {
    blue: {
      node: "bg-blue-600 text-white",
      chip: "bg-blue-50 text-blue-800 border-blue-200/70",
      text: "text-blue-700",
    },
    green: {
      node: "bg-emerald-600 text-white",
      chip: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
      text: "text-emerald-700",
    },
    violet: {
      node: "bg-violet-600 text-white",
      chip: "bg-violet-50 text-violet-800 border-violet-200/70",
      text: "text-violet-700",
    },
    amber: {
      node: "bg-amber-500 text-white",
      chip: "bg-amber-50 text-amber-800 border-amber-200/70",
      text: "text-amber-700",
    },
    slate: {
      node: "bg-slate-600 text-white",
      chip: "bg-slate-100 text-slate-700 border-slate-200/70",
      text: "text-slate-600",
    },
    red: {
      node: "bg-red-600 text-white",
      chip: "bg-red-50 text-red-800 border-red-200/70",
      text: "text-red-700",
    },
  };

export const EVENT_META: Record<EventKind, { icon: LucideIcon; tone: Tone }> = {
  started: { icon: UserRoundPlus, tone: "slate" },
  agreement: { icon: ClipboardCheck, tone: "slate" },
  "risk-assessment": { icon: ShieldCheck, tone: "slate" },
  "request-start": { icon: CirclePlay, tone: "blue" },
  "request-end": { icon: CircleStop, tone: "blue" },
  "package-start": { icon: HeartHandshake, tone: "green" },
  "package-end": { icon: CircleStop, tone: "green" },
  mag: { icon: Brain, tone: "violet" },
  "aa-requested": { icon: Banknote, tone: "amber" },
  "aa-confirmed": { icon: BadgeCheck, tone: "amber" },
  training: { icon: GraduationCap, tone: "violet" },
  fee: { icon: Banknote, tone: "amber" },
  ended: { icon: Flag, tone: "red" },
};

export const SOURCE_ICON: Record<NoteSource, LucideIcon> = {
  Phone: Phone,
  Email: Mail,
  "In Person": Users,
};

// --------------------------------------------------------------- helpers

export const isImage = (contentType: string) => contentType.startsWith("image/");

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKind(contentType: string): string {
  if (isImage(contentType)) return "Image";
  if (contentType === "application/pdf") return "PDF";
  if (
    contentType.includes("wordprocessingml") ||
    contentType === "application/msword"
  )
    return "Word";
  if (contentType.includes("opendocument")) return "ODT";
  return "File";
}

export function minutesLabel(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "Phone · 10 min" */
export function noteMeta(note: Note): string {
  const minutes = minutesLabel(note.minutesTaken);
  return minutes ? `${note.source} · ${minutes}` : note.source;
}

/** "PDF · 412 KB" */
export function attachmentMeta(attachment: AttachmentWithUrl): string {
  return `${fileKind(attachment.details.contentType)} · ${formatBytes(attachment.details.size)}`;
}

// Fade-in plus a ring that the Timeline clears after a couple of seconds.
export const highlightClass = (isNew: boolean) =>
  isNew
    ? "motion-safe:animate-in ring-2 ring-blue-400/70 ring-offset-2 ring-offset-white"
    : "";
