// Variant 3 — Spine. A centre line carries what the system knows (care
// requests, packages, MAG, AA). What the coordinator typed sits to the
// left; what they filed sits to the right. The side tells you the source.
// Adding is a journal-style composer at the top (from variant 5).
import {
  EVENT_META,
  TONE,
  entryDomId,
  fmtShortYear,
  groupByMonth,
  type AttachmentEntry,
  type EventEntry,
  type NoteEntry,
} from "../model";
import {
  AttachmentName,
  AttachmentThumb,
  Composer,
  DeleteButton,
  EmptyState,
  EntryIcon,
  attachmentMeta,
  highlightClass,
  noteMeta,
  type VariantProps,
} from "../parts";
import { cn } from "@/lib/utils";

export function SpineTimeline({
  state,
  person,
  openAddNote,
  openAddFile,
}: VariantProps) {
  const months = groupByMonth(state.visible);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Composer
        personName={person.name}
        onNote={openAddNote}
        onFile={openAddFile}
      />

      <div className="mt-3 grid grid-cols-[1fr_3rem_1fr] border-b border-gray-200/70 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        <span>Notes</span>
        <span className="text-center">Record</span>
        <span className="text-right">Files</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        {months.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              hasEntries={state.entries.length > 0}
              onNote={openAddNote}
              onFile={openAddFile}
            />
          </div>
        ) : (
          // The spine is one line behind every month; each month is its own
          // section so its sticky pill is pushed out by the next month
          // instead of stacking on top of it.
          <div className="relative pb-8 before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-px before:-translate-x-1/2 before:bg-gray-200">
            {months.map((month) => (
              <section
                key={month.key}
                className="grid grid-cols-[1fr_3rem_1fr] gap-y-3 pb-3"
              >
                <div className="sticky top-0 z-10 col-span-3 flex justify-center bg-white/95 py-1 backdrop-blur">
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 shadow-sm">
                    {month.label}
                  </span>
                </div>
                {month.entries.map((entry) => {
                  const isNew = entry.id === state.justAddedId;
                  if (entry.type === "event") {
                    return <SpineEvent key={entry.id} entry={entry} isNew={isNew} />;
                  }
                  if (entry.type === "note") {
                    return (
                      <SpineNote
                        key={entry.id}
                        entry={entry}
                        isNew={isNew}
                        onDelete={() => state.remove(entry.id)}
                      />
                    );
                  }
                  return (
                    <SpineFile
                      key={entry.id}
                      entry={entry}
                      isNew={isNew}
                      onDelete={() => state.remove(entry.id)}
                    />
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpineEvent({ entry, isNew }: { entry: EventEntry; isNew: boolean }) {
  const tone = TONE[EVENT_META[entry.kind].tone];
  return (
    <div
      id={entryDomId(entry.id)}
      className="col-span-3 flex scroll-mt-12 justify-center"
    >
      <div
        className={cn(
          "relative z-[1] flex max-w-[70%] items-center gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm",
          tone.chip,
          highlightClass(isNew),
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            tone.node,
          )}
        >
          <EntryIcon entry={entry} className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 text-sm">
          <span className="font-medium">{entry.title}</span>
          {entry.detail && <span className="opacity-80"> · {entry.detail}</span>}
        </div>
        <span className="shrink-0 text-xs opacity-70">{fmtShortYear(entry.date)}</span>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <div className="relative z-[1] flex items-start justify-center pt-4">
      <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-gray-300" />
    </div>
  );
}

function SpineNote({
  entry,
  isNew,
  onDelete,
}: {
  entry: NoteEntry;
  isNew: boolean;
  onDelete: () => void;
}) {
  return (
    <>
      <div
        id={entryDomId(entry.id)}
        className={cn(
          "group relative z-[1] col-start-1 scroll-mt-12 rounded-xl border border-gray-200/70 bg-white px-4 py-3 shadow-sm after:absolute after:right-[-1.5rem] after:top-[1.15rem] after:h-px after:w-6 after:bg-gray-200",
          highlightClass(isNew),
        )}
      >
        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <EntryIcon entry={entry} className="h-3.5 w-3.5" />
            {noteMeta(entry)}
          </span>
          <span className="flex items-center gap-1">
            {fmtShortYear(entry.date)}
            <DeleteButton onClick={onDelete} />
          </span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {entry.note}
        </p>
      </div>
      <Dot />
      <div />
    </>
  );
}

function SpineFile({
  entry,
  isNew,
  onDelete,
}: {
  entry: AttachmentEntry;
  isNew: boolean;
  onDelete: () => void;
}) {
  return (
    <>
      <div />
      <Dot />
      <div
        id={entryDomId(entry.id)}
        className={cn(
          "group relative z-[1] col-start-3 flex scroll-mt-12 items-center gap-3 rounded-xl border border-gray-200/70 bg-white px-3 py-2.5 shadow-sm before:absolute before:left-[-1.5rem] before:top-[1.15rem] before:h-px before:w-6 before:bg-gray-200",
          highlightClass(isNew),
        )}
      >
        <AttachmentThumb entry={entry} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <AttachmentName entry={entry} className="block text-sm" />
          <p className="text-xs text-gray-500">
            {attachmentMeta(entry)} · {fmtShortYear(entry.date)}
          </p>
        </div>
        <DeleteButton onClick={onDelete} />
      </div>
    </>
  );
}
