// Variant 2 — Day book. A ledger: the date sits once in a left gutter and
// everything from that day is listed beside it. Dense and scannable, like
// the paper day-books the charity keeps.
import { Fragment } from "react";
import {
  TONE,
  entryDomId,
  fmtMonthShort,
  groupByDay,
  weekday,
  type TimelineEntry,
} from "../model";
import {
  AddButtons,
  AttachmentName,
  AttachmentThumb,
  DeleteButton,
  EmptyState,
  EntryIcon,
  FilterChips,
  attachmentMeta,
  entryTone,
  highlightClass,
  noteMeta,
  type VariantProps,
} from "../parts";
import { cn } from "@/lib/utils";

export function DayBookTimeline({
  state,
  person,
  openAddNote,
  openAddFile,
}: VariantProps) {
  const days = groupByDay(state.visible);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-gray-800 pb-3">
        <div>
          <p className="font-plex text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Day book
          </p>
          <h3 className="font-display text-xl font-semibold text-gray-900">
            {person.name}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips state={state} />
          <AddButtons
            onNote={openAddNote}
            onFile={openAddFile}
            noteVariant="outline"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        {days.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              hasEntries={state.entries.length > 0}
              onNote={openAddNote}
              onFile={openAddFile}
            />
          </div>
        ) : (
          days.map((day, index) => {
            const year = day.key.slice(0, 4);
            const prevYear = index > 0 ? days[index - 1].key.slice(0, 4) : null;
            return (
              <Fragment key={day.key}>
                {year !== prevYear && (
                  <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/95 py-2 backdrop-blur">
                    <span className="font-plex text-xs font-semibold tracking-widest text-gray-800">
                      {year}
                    </span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                )}
                <div className="grid grid-cols-[5.5rem_1fr] border-b border-gray-200/70">
                  <div className="py-3 pr-4 text-right">
                    <div className="font-plex text-2xl leading-none text-gray-900">
                      {day.key.slice(8, 10)}
                    </div>
                    <div className="font-plex mt-1 text-[11px] uppercase tracking-wider text-gray-500">
                      {fmtMonthShort(day.key)}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {weekday(day.key)}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 border-l border-gray-200/70">
                    {day.entries.map((entry) => (
                      <DayBookRow
                        key={entry.id}
                        entry={entry}
                        isNew={entry.id === state.justAddedId}
                        onDelete={() => state.remove(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}

function tag(entry: TimelineEntry): string {
  if (entry.type === "event") return "Event";
  if (entry.type === "note") return `Note · ${entry.source}`;
  return "File";
}

function DayBookRow({
  entry,
  isNew,
  onDelete,
}: {
  entry: TimelineEntry;
  isNew: boolean;
  onDelete: () => void;
}) {
  const tone = TONE[entryTone(entry)];
  return (
    <div
      id={entryDomId(entry.id)}
      className={cn(
        "group grid grid-cols-[7.5rem_1fr_auto] items-start gap-3 py-2.5 pl-4 pr-2 rounded-r-lg scroll-mt-12",
        highlightClass(isNew),
      )}
    >
      <span
        className={cn(
          "font-plex flex items-center gap-1.5 pt-0.5 text-[11px] uppercase tracking-wider",
          entry.type === "event" ? tone.text : "text-gray-500",
        )}
      >
        <EntryIcon entry={entry} className="h-3.5 w-3.5" />
        {tag(entry)}
      </span>

      <div className="min-w-0 text-sm">
        {entry.type === "event" && (
          <p className="text-gray-800">
            <span className="font-medium">{entry.title}</span>
            {entry.detail && (
              <span className="text-gray-500"> — {entry.detail}</span>
            )}
          </p>
        )}
        {entry.type === "note" && (
          <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
            {entry.note}
          </p>
        )}
        {entry.type === "attachment" && (
          <div className="flex items-center gap-3">
            <AttachmentThumb entry={entry} className="h-9 w-9" />
            <div className="min-w-0">
              <AttachmentName entry={entry} className="block" />
              <p className="text-xs text-gray-500">{attachmentMeta(entry)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 whitespace-nowrap text-xs text-gray-400">
        {entry.type === "note" && <span>{noteMeta(entry).split(" · ")[1] ?? ""}</span>}
        {entry.type !== "event" && <DeleteButton onClick={onDelete} />}
      </div>
    </div>
  );
}
