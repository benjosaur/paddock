// Variant 1 — Rail. One vertical rail on the left, a coloured node per
// entry, sticky month headings. The reference layout: the least surprising
// reading of "a timeline".
import {
  EVENT_META,
  TONE,
  fmtDay,
  groupByMonth,
  relativeDays,
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
  lastContact,
  noteMeta,
  type VariantProps,
} from "../parts";
import { entryDomId } from "../model";
import { cn } from "@/lib/utils";

export function RailTimeline({
  state,
  openAddNote,
  openAddFile,
}: VariantProps) {
  const months = groupByMonth(state.visible);
  const last = lastContact(state.entries);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Timeline</h3>
          <p className="text-sm text-gray-500">
            {state.entries.length} entries
            {last && <> · last contact {relativeDays(last.date)}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips state={state} />
          <AddButtons onNote={openAddNote} onFile={openAddFile} />
        </div>
      </header>

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
          months.map((month) => (
            <section key={month.key}>
              <h4 className="sticky top-0 z-10 -mx-1 bg-white/95 px-1 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 backdrop-blur">
                {month.label}
              </h4>
              <ol className="ml-4 space-y-4 border-l-2 border-gray-200 pb-6 pl-8">
                {month.entries.map((entry) => (
                  <RailItem
                    key={entry.id}
                    entry={entry}
                    isNew={entry.id === state.justAddedId}
                    onDelete={() => state.remove(entry.id)}
                  />
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function RailItem({
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
    <li id={entryDomId(entry.id)} className="group relative scroll-mt-12">
      <span
        className={cn(
          "absolute -left-[calc(2rem+17px)] top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white",
          tone.node,
        )}
      >
        <EntryIcon entry={entry} className="h-4 w-4" />
      </span>

      <div
        className={cn(
          "rounded-xl border border-gray-200/70 bg-white px-4 py-3 shadow-sm transition-shadow",
          highlightClass(isNew),
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium text-gray-500">
            {fmtDay(entry.date)}
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-400">
            {entry.type === "event" && (
              <span className={cn("font-medium", tone.text)}>
                {EVENT_META[entry.kind].label}
              </span>
            )}
            {entry.type === "note" && <span>{noteMeta(entry)}</span>}
            {entry.type === "attachment" && <span>{attachmentMeta(entry)}</span>}
            {entry.type !== "event" && <DeleteButton onClick={onDelete} />}
          </span>
        </div>

        {entry.type === "event" && (
          <div className="mt-1">
            <p className="font-medium text-gray-800">{entry.title}</p>
            {entry.detail && (
              <p className="text-sm text-gray-500">{entry.detail}</p>
            )}
          </div>
        )}

        {entry.type === "note" && (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {entry.note}
          </p>
        )}

        {entry.type === "attachment" && (
          <div className="mt-2 flex items-center gap-3">
            <AttachmentThumb entry={entry} className="h-14 w-14" />
            <AttachmentName entry={entry} className="text-sm" />
          </div>
        )}
      </div>
    </li>
  );
}
