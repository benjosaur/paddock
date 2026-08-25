// Timeline mockup data model. Deliberately mirrors the real shapes in
// shared/schemas (notes: date/note/source/minutesTaken; attachments:
// date/fileName/contentType/size/url) so a production version can build the
// same entry union straight from a person's getById payload.
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Banknote,
  Brain,
  CirclePlay,
  CircleStop,
  ClipboardCheck,
  Flag,
  HeartHandshake,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { notesSource } from "shared/const";

export type NoteSource = (typeof notesSource)[number];

// System events derived from the person record itself (nothing the
// coordinator types in on this screen).
export type EventKind =
  | "agreement"
  | "risk-assessment"
  | "request-start"
  | "request-end"
  | "package-start"
  | "package-end"
  | "mag"
  | "aa-requested"
  | "aa-confirmed"
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
  date: string; // the document's own date, as entered at upload
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}

export interface NoteEntry {
  id: string;
  type: "note";
  date: string;
  note: string;
  source: NoteSource;
  minutesTaken: number;
}

export type TimelineEntry = EventEntry | AttachmentEntry | NoteEntry;
export type EntryType = TimelineEntry["type"];

export const ENTRY_TYPES: EntryType[] = ["event", "attachment", "note"];

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  event: "Events",
  attachment: "Files",
  note: "Notes",
};

// Within one day: what happened to the person first, then the paperwork,
// then the coordinator's notes about it.
const TYPE_RANK: Record<EntryType, number> = {
  event: 0,
  attachment: 1,
  note: 2,
};

// Newest first. Array.prototype.sort is stable, so entries added on the same
// day with the same type keep insertion order.
export function sortEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return TYPE_RANK[a.type] - TYPE_RANK[b.type];
  });
}

export const entryDomId = (id: string) => `timeline-entry-${id}`;

// ---------------------------------------------------------------- grouping

export interface DayGroup {
  key: string; // YYYY-MM-DD
  entries: TimelineEntry[];
}

export interface MonthGroup {
  key: string; // YYYY-MM
  label: string;
  entries: TimelineEntry[];
}

export function groupByDay(entries: TimelineEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.key === entry.date) last.entries.push(entry);
    else groups.push({ key: entry.date, entries: [entry] });
  }
  return groups;
}

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
    const from = Math.max(utc(span.startDate), monthStart);
    const to = Math.min(
      span.endDate === "open" ? Infinity : utc(span.endDate),
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
// All string-based: YYYY-MM-DD never goes through `new Date(str)`, which
// would shift the day in some timezones.

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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

export function weekday(ymd: string): string {
  const { y, m, d } = parts(ymd);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "Tue 12 Aug 2026" */
export function fmtDay(ymd: string): string {
  const { y, m, d } = parts(ymd);
  return `${weekday(ymd)} ${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

/** "12 Aug" */
export function fmtShort(ymd: string): string {
  const { m, d } = parts(ymd);
  return `${d} ${MONTHS[m - 1].slice(0, 3)}`;
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

/** "Aug" */
export function fmtMonthShort(ymd: string): string {
  return MONTHS[parts(ymd).m - 1].slice(0, 3);
}

export function todayYmd(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  const a = parts(fromYmd);
  const b = parts(toYmd);
  const ms =
    Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86_400_000);
}

/** "today", "yesterday", "12 days ago", "3 months ago" */
export function relativeDays(ymd: string, today = todayYmd()): string {
  const days = daysBetween(ymd, today);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 31) return `${days} days ago`;
  const months = Math.round(days / 30.4);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// -------------------------------------------------------------- kind meta

export type Tone = "blue" | "green" | "violet" | "amber" | "slate" | "red";

// Literal class strings so Tailwind's scanner sees every utility.
export const TONE: Record<
  Tone,
  { node: string; chip: string; text: string; bar: string; ring: string }
> = {
  blue: {
    node: "bg-blue-600 text-white",
    chip: "bg-blue-50 text-blue-800 border-blue-200/70",
    text: "text-blue-700",
    bar: "bg-blue-500",
    ring: "ring-blue-200",
  },
  green: {
    node: "bg-emerald-600 text-white",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  violet: {
    node: "bg-violet-600 text-white",
    chip: "bg-violet-50 text-violet-800 border-violet-200/70",
    text: "text-violet-700",
    bar: "bg-violet-500",
    ring: "ring-violet-200",
  },
  amber: {
    node: "bg-amber-500 text-white",
    chip: "bg-amber-50 text-amber-800 border-amber-200/70",
    text: "text-amber-700",
    bar: "bg-amber-500",
    ring: "ring-amber-200",
  },
  slate: {
    node: "bg-slate-600 text-white",
    chip: "bg-slate-100 text-slate-700 border-slate-200/70",
    text: "text-slate-600",
    bar: "bg-slate-400",
    ring: "ring-slate-200",
  },
  red: {
    node: "bg-red-600 text-white",
    chip: "bg-red-50 text-red-800 border-red-200/70",
    text: "text-red-700",
    bar: "bg-red-500",
    ring: "ring-red-200",
  },
};

export const EVENT_META: Record<
  EventKind,
  { label: string; icon: LucideIcon; tone: Tone }
> = {
  agreement: { label: "Client agreement", icon: ClipboardCheck, tone: "slate" },
  "risk-assessment": {
    label: "Risk assessment",
    icon: ShieldCheck,
    tone: "slate",
  },
  "request-start": {
    label: "Care request started",
    icon: CirclePlay,
    tone: "blue",
  },
  "request-end": { label: "Care request ended", icon: CircleStop, tone: "blue" },
  "package-start": {
    label: "Care confirmed",
    icon: HeartHandshake,
    tone: "green",
  },
  "package-end": { label: "Care ended", icon: CircleStop, tone: "green" },
  mag: { label: "MAG attended", icon: Brain, tone: "violet" },
  "aa-requested": {
    label: "Attendance Allowance requested",
    icon: Banknote,
    tone: "amber",
  },
  "aa-confirmed": {
    label: "Attendance Allowance confirmed",
    icon: BadgeCheck,
    tone: "amber",
  },
  ended: { label: "Client ended", icon: Flag, tone: "red" },
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
  if (contentType.includes("wordprocessingml") || contentType === "application/msword")
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

let seq = 0;
export const newId = () => `local-${++seq}-${Math.random().toString(36).slice(2, 8)}`;
