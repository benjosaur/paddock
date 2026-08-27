// Timeline tab for the person detail modals: one newest-first record of
// what happened (system events on a centre spine), what the coordinator
// wrote (notes, left) and what they filed (attachments, right). Adding is a
// journal-style composer at the top.
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/permissions";
import {
  useAttachmentMutations,
  type AttachmentResource,
} from "@/hooks/useAttachmentMutations";
import { DeleteAlert } from "../DeleteAlert";
import { cn } from "@/lib/utils";
import { AttachmentDialog, NoteDialog } from "./AddEntryDialogs";
import type { TimelineData } from "./build";
import {
  EVENT_META,
  TONE,
  attachmentEntryId,
  attachmentMeta,
  entryDomId,
  fmtHours,
  fmtShortYear,
  groupByMonth,
  highlightClass,
  hoursInMonth,
  noteEntryId,
  noteMeta,
  type AttachmentEntry,
  type DateSpan,
  type EventEntry,
  type Note,
  type NoteEntry,
} from "./model";
import {
  AttachmentName,
  AttachmentThumb,
  CardAction,
  Composer,
  EntryIcon,
} from "./parts";

interface TimelineProps {
  data: TimelineData;
  personName: string;
  ownerId: string;
  // Permission resource of the owner: notes and files need its update.
  resource: AttachmentResource;
  // The owner's current notes; saving replaces the whole array on the
  // record, like the old notes tab did.
  notes: Note[];
  onSaveNotes: (notes: Note[]) => void;
  isSavingNotes: boolean;
}

type DeleteTarget =
  | { kind: "note"; index: number }
  | { kind: "attachment"; id: string; fileName: string };

export function Timeline({
  data,
  personName,
  ownerId,
  resource,
  notes,
  onSaveNotes,
  isSavingNotes,
}: TimelineProps) {
  const { user } = useAuth();
  const canUpdate = !!user && hasPermission(user.role, resource, "update");
  const { upload, remove } = useAttachmentMutations(ownerId, resource);

  const [noteDialog, setNoteDialog] = useState<{
    open: boolean;
    index?: number;
  }>({ open: false });
  const [fileOpen, setFileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const months = useMemo(() => groupByMonth(data.entries), [data.entries]);

  // Once the refetched record contains the new entry, bring it into view
  // and then drop the highlight.
  useEffect(() => {
    if (!justAddedId) return;
    const element = document.getElementById(entryDomId(justAddedId));
    if (!element) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
    const timer = window.setTimeout(() => setJustAddedId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [justAddedId, data.entries]);

  const saveNote = (note: Note) => {
    if (noteDialog.index === undefined) {
      onSaveNotes([...notes, note]);
      setJustAddedId(noteEntryId(notes.length));
    } else {
      onSaveNotes(notes.map((n, i) => (i === noteDialog.index ? note : n)));
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "note") {
      onSaveNotes(notes.filter((_, i) => i !== deleteTarget.index));
    } else {
      remove.mutate({ ownerId, attachmentId: deleteTarget.id });
    }
    setDeleteTarget(null);
  };

  const notConfigured = data.entries.some(
    (entry) => entry.type === "attachment" && !entry.attachment.url,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {canUpdate && (
        <Composer
          personName={personName}
          onNote={() => setNoteDialog({ open: true })}
          onFile={() => setFileOpen(true)}
          uploading={upload.isPending}
        />
      )}

      {notConfigured && (
        <p className="mt-2 text-sm text-red-600">
          Attachments are not configured for this environment.
        </p>
      )}

      <div className="mt-3 grid grid-cols-[1fr_3rem_1fr] border-b border-gray-200/70 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        <span>Notes</span>
        <span className="text-center">Record</span>
        <span className="text-right">Files</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        {months.length === 0 ? (
          <p className="pt-6 text-center text-sm text-gray-500">
            Nothing on the record yet
            {canUpdate && " — add a note or a file to start the timeline"}.
          </p>
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
                <div className="sticky top-0 z-10 col-span-3 flex justify-center bg-white py-1">
                  <MonthPill
                    label={month.label}
                    monthKey={month.key}
                    requested={data.requested}
                    delivered={data.delivered}
                  />
                </div>
                {month.entries.map((entry) => {
                  const isNew = entry.id === justAddedId;
                  if (entry.type === "event") {
                    return <SpineEvent key={entry.id} entry={entry} isNew={isNew} />;
                  }
                  if (entry.type === "note") {
                    return (
                      <SpineNote
                        key={entry.id}
                        entry={entry}
                        isNew={isNew}
                        onEdit={
                          canUpdate
                            ? () => setNoteDialog({ open: true, index: entry.index })
                            : undefined
                        }
                        onDelete={
                          canUpdate
                            ? () => setDeleteTarget({ kind: "note", index: entry.index })
                            : undefined
                        }
                      />
                    );
                  }
                  return (
                    <SpineFile
                      key={entry.id}
                      entry={entry}
                      isNew={isNew}
                      onDelete={
                        canUpdate
                          ? () =>
                              setDeleteTarget({
                                kind: "attachment",
                                id: entry.attachment.id,
                                fileName: entry.attachment.details.fileName,
                              })
                          : undefined
                      }
                    />
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>

      <NoteDialog
        open={noteDialog.open}
        onOpenChange={(open) => setNoteDialog((prev) => ({ ...prev, open }))}
        onSave={saveNote}
        personName={personName}
        initial={noteDialog.index === undefined ? undefined : notes[noteDialog.index]}
        isSaving={isSavingNotes}
      />
      <AttachmentDialog
        open={fileOpen}
        onOpenChange={setFileOpen}
        personName={personName}
        onSave={(input) =>
          upload.mutate(input, {
            onSuccess: ({ attachmentId }) =>
              setJustAddedId(attachmentEntryId(attachmentId)),
          })
        }
      />
      <DeleteAlert
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        itemName={deleteTarget?.kind === "attachment" ? deleteTarget.fileName : undefined}
        itemType={deleteTarget?.kind === "attachment" ? "attachment" : "note"}
      />
    </div>
  );
}

// Month marker with the care in that month: hours requested (open care
// requests, clients only) and hours delivered (care confirmed).
function MonthPill({
  label,
  monthKey,
  requested,
  delivered,
}: {
  label: string;
  monthKey: string;
  requested?: DateSpan[];
  delivered: DateSpan[];
}) {
  const hours = (n: number, text: string, tone: string) => (
    <span className={cn("normal-case tracking-normal", n ? tone : "text-gray-400")}>
      {fmtHours(n)} {text}
    </span>
  );
  return (
    <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 shadow-sm">
      {label}
      <span className="h-3 w-px bg-gray-200" />
      {requested && hours(hoursInMonth(requested, monthKey), "requested", TONE.blue.text)}
      {hours(hoursInMonth(delivered, monthKey), "delivered", TONE.green.text)}
    </span>
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
  onEdit,
  onDelete,
}: {
  entry: NoteEntry;
  isNew: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
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
            {noteMeta(entry.note)}
          </span>
          <span className="flex items-center gap-1">
            {fmtShortYear(entry.date)}
            {onEdit && <CardAction icon={Pencil} label="Edit note" onClick={onEdit} />}
            {onDelete && (
              <CardAction icon={Trash2} label="Delete note" onClick={onDelete} danger />
            )}
          </span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {entry.note.note}
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
  onDelete?: () => void;
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
        <AttachmentThumb attachment={entry.attachment} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <AttachmentName attachment={entry.attachment} className="block text-sm" />
          <p className="text-xs text-gray-500">
            {attachmentMeta(entry.attachment)} · {fmtShortYear(entry.date)}
          </p>
        </div>
        {onDelete && (
          <CardAction icon={Trash2} label="Delete file" onClick={onDelete} danger />
        )}
      </div>
    </>
  );
}
