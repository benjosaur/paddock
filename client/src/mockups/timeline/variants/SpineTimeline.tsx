// Variant 3 — Spine. A centre line carries what the system knows (care
// requests, packages, MAG, AA). What the coordinator typed sits to the
// left; what they filed sits to the right. The side tells you the source.
import { Fragment } from "react";
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
import { FilePlus2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AttachmentName,
  AttachmentThumb,
  DeleteButton,
  EmptyState,
  EntryIcon,
  FilterChips,
  attachmentMeta,
  highlightClass,
  noteMeta,
  type VariantProps,
} from "../parts";
import { cn } from "@/lib/utils";

export function SpineTimeline({
  state,
  openAddNote,
  openAddFile,
}: VariantProps) {
  const months = groupByMonth(state.visible);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Timeline</h3>
        <FilterChips state={state} />
      </header>

      {/* Column headings double as the add buttons: the action lives on the
          side its result will appear. */}
      <div className="grid grid-cols-[1fr_3rem_1fr] items-center border-b border-gray-200/70 pb-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Notes
          </span>
          <Button size="sm" onClick={openAddNote} className="gap-1.5">
            <MessageSquarePlus className="h-4 w-4" />
            Add note
          </Button>
        </div>
        <div />
        <div className="flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={openAddFile}
            className="gap-1.5"
          >
            <FilePlus2 className="h-4 w-4" />
            Add file
          </Button>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Files
          </span>
        </div>
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
          <div className="relative grid grid-cols-[1fr_3rem_1fr] gap-y-3 pb-8 pt-3 before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-px before:-translate-x-1/2 before:bg-gray-200">
            {months.map((month) => (
              <Fragment key={month.key}>
                <div className="sticky top-0 z-10 col-span-3 flex justify-center py-1">
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
              </Fragment>
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
    <div id={entryDomId(entry.id)} className="col-span-3 flex justify-center scroll-mt-12">
      <div
        className={cn(
          "flex max-w-[70%] items-center gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm",
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
    <div className="flex items-start justify-center pt-4">
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
          "group relative col-start-1 scroll-mt-12 rounded-xl border border-gray-200/70 bg-white px-4 py-3 shadow-sm after:absolute after:right-[-1.5rem] after:top-[1.15rem] after:h-px after:w-6 after:bg-gray-200",
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
          "group relative col-start-3 scroll-mt-12 flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white px-3 py-2.5 shadow-sm before:absolute before:left-[-1.5rem] before:top-[1.15rem] before:h-px before:w-6 before:bg-gray-200",
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
