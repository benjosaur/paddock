import { useCallback, useEffect, useMemo, useState } from "react";
import { SEED_ENTRIES } from "./data";
import {
  entryDomId,
  newId,
  sortEntries,
  type AttachmentEntry,
  type EntryType,
  type NoteEntry,
  type TimelineEntry,
} from "./model";

export type NoteInput = Omit<NoteEntry, "id" | "type">;
export type AttachmentInput = Omit<AttachmentEntry, "id" | "type">;

const ALL_ON: Record<EntryType, boolean> = {
  event: true,
  attachment: true,
  note: true,
};

// Local, in-memory stand-in for the real mutations. Lives at the page level
// so entries you add survive switching between variants.
export function useTimelineState() {
  const [entries, setEntries] = useState<TimelineEntry[]>(() =>
    sortEntries(SEED_ENTRIES),
  );
  const [filters, setFilters] = useState(ALL_ON);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const insert = useCallback((entry: TimelineEntry) => {
    setEntries((prev) => sortEntries([...prev, entry]));
    // Make sure the new entry is visible even if its type was filtered out.
    setFilters((prev) => (prev[entry.type] ? prev : { ...prev, [entry.type]: true }));
    setJustAddedId(entry.id);
  }, []);

  const addNote = useCallback(
    (input: NoteInput) => insert({ id: newId(), type: "note", ...input }),
    [insert],
  );

  const addAttachment = useCallback(
    (input: AttachmentInput) =>
      insert({ id: newId(), type: "attachment", ...input }),
    [insert],
  );

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const reset = useCallback(() => {
    setEntries(sortEntries(SEED_ENTRIES));
    setFilters(ALL_ON);
    setJustAddedId(null);
  }, []);

  const toggleFilter = useCallback((type: EntryType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const visible = useMemo(
    () => entries.filter((entry) => filters[entry.type]),
    [entries, filters],
  );

  const counts = useMemo(() => {
    const result: Record<EntryType, number> = { event: 0, attachment: 0, note: 0 };
    for (const entry of entries) result[entry.type] += 1;
    return result;
  }, [entries]);

  // Bring a freshly added entry into view in whichever variant is mounted,
  // then drop the highlight.
  useEffect(() => {
    if (!justAddedId) return;
    const element = document.getElementById(entryDomId(justAddedId));
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // "nearest" + each entry's scroll-mt keeps it clear of sticky headings.
    element?.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
    const timer = window.setTimeout(() => setJustAddedId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [justAddedId]);

  return {
    entries,
    visible,
    counts,
    filters,
    toggleFilter,
    addNote,
    addAttachment,
    remove,
    reset,
    justAddedId,
  };
}

export type TimelineState = ReturnType<typeof useTimelineState>;
