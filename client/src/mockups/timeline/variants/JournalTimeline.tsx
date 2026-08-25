// Variant 5 — Journal. Reads like a message log about the person: notes are
// bubbles, files are media, and what the system did appears as centred
// dividers between them. The composer sits at the top, next to the newest
// entry, so adding something is where your eye already is.
import {
  EVENT_META,
  TONE,
  entryDomId,
  fmtDay,
  groupByDay,
  isImage,
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
  FilterChips,
  attachmentMeta,
  highlightClass,
  noteMeta,
  type VariantProps,
} from "../parts";
import { cn } from "@/lib/utils";

export function JournalTimeline({
  state,
  person,
  openAddNote,
  openAddFile,
}: VariantProps) {
  const days = groupByDay(state.visible);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Composer
        personName={person.name}
        onNote={openAddNote}
        onFile={openAddFile}
      />
      <div className="flex items-center justify-end py-2">
        <FilterChips state={state} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-gray-50/70 px-4 pb-6">
        {days.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              hasEntries={state.entries.length > 0}
              onNote={openAddNote}
              onFile={openAddFile}
            />
          </div>
        ) : (
          days.map((day) => (
            <section key={day.key} className="space-y-3 pb-2">
              <div className="sticky top-0 z-10 flex justify-center py-2">
                <span className="rounded-full bg-gray-200/80 px-3 py-0.5 text-[11px] font-semibold text-gray-600 backdrop-blur">
                  {fmtDay(day.key)}
                </span>
              </div>
              {day.entries.map((entry) => {
                const isNew = entry.id === state.justAddedId;
                if (entry.type === "event") {
                  return <EventDivider key={entry.id} entry={entry} isNew={isNew} />;
                }
                if (entry.type === "note") {
                  return (
                    <NoteBubble
                      key={entry.id}
                      entry={entry}
                      isNew={isNew}
                      onDelete={() => state.remove(entry.id)}
                    />
                  );
                }
                return (
                  <FileBubble
                    key={entry.id}
                    entry={entry}
                    isNew={isNew}
                    onDelete={() => state.remove(entry.id)}
                  />
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function EventDivider({ entry, isNew }: { entry: EventEntry; isNew: boolean }) {
  const tone = TONE[EVENT_META[entry.kind].tone];
  return (
    <div
      id={entryDomId(entry.id)}
      className={cn("flex scroll-mt-12 items-center gap-3 rounded-lg", highlightClass(isNew))}
    >
      <span className="h-px flex-1 bg-gray-200" />
      <span className={cn("flex items-center gap-2 text-xs", tone.text)}>
        <EntryIcon entry={entry} className="h-3.5 w-3.5" />
        <span className="font-semibold">{entry.title}</span>
        {entry.detail && <span className="text-gray-500">{entry.detail}</span>}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function Avatar({ entry }: { entry: NoteEntry | AttachmentEntry }) {
  return (
    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200">
      <EntryIcon entry={entry} className="h-4 w-4" />
    </span>
  );
}

function NoteBubble({
  entry,
  isNew,
  onDelete,
}: {
  entry: NoteEntry;
  isNew: boolean;
  onDelete: () => void;
}) {
  return (
    <div id={entryDomId(entry.id)} className="group flex scroll-mt-12 items-start gap-3">
      <Avatar entry={entry} />
      <div
        className={cn(
          "max-w-[78%] rounded-2xl rounded-tl-md bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-200/70",
          highlightClass(isNew),
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {entry.note}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">{noteMeta(entry)}</p>
      </div>
      <DeleteButton onClick={onDelete} className="mt-2" />
    </div>
  );
}

function FileBubble({
  entry,
  isNew,
  onDelete,
}: {
  entry: AttachmentEntry;
  isNew: boolean;
  onDelete: () => void;
}) {
  const showImage = entry.url !== "#" && isImage(entry.contentType);
  return (
    <div id={entryDomId(entry.id)} className="group flex scroll-mt-12 items-start gap-3">
      <Avatar entry={entry} />
      <div
        className={cn(
          "max-w-[78%] overflow-hidden rounded-2xl rounded-tl-md bg-white shadow-sm ring-1 ring-gray-200/70",
          highlightClass(isNew),
        )}
      >
        {showImage && (
          <a href={entry.url} target="_blank" rel="noreferrer">
            <img
              src={entry.url}
              alt={entry.fileName}
              loading="lazy"
              className="block max-h-56 w-full max-w-sm object-cover"
            />
          </a>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          {!showImage && <AttachmentThumb entry={entry} className="h-10 w-10" />}
          <div className="min-w-0">
            <AttachmentName entry={entry} className="block text-sm" />
            <p className="text-[11px] text-gray-400">{attachmentMeta(entry)}</p>
          </div>
        </div>
      </div>
      <DeleteButton onClick={onDelete} className="mt-2" />
    </div>
  );
}
