import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { allowedAttachmentTypes, maxAttachmentBytes, notesSource } from "shared/const";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import {
  validateAttachmentFile,
  type AttachmentUploadInput,
} from "@/hooks/useAttachmentMutations";
import {
  SOURCE_ICON,
  fileKind,
  formatBytes,
  isImage,
  todayYmd,
  type Note,
  type NoteSource,
} from "./model";

// Both dialogs ask for the date first. The date is what places the entry
// in the timeline, so it is the one field that is never optional.

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- note

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: Note) => void;
  personName: string;
  // Editing an existing note; omitted when adding.
  initial?: Note;
  isSaving: boolean;
}

export function NoteDialog({
  open,
  onOpenChange,
  onSave,
  personName,
  initial,
  isSaving,
}: NoteDialogProps) {
  const [date, setDate] = useState(todayYmd);
  const [source, setSource] = useState<NoteSource>("Phone");
  const [minutes, setMinutes] = useState("10");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ?? todayYmd());
    setSource(initial?.source ?? "Phone");
    setMinutes(String(initial?.minutesTaken ?? 10));
    setText(initial?.note ?? "");
  }, [open, initial]);

  const canSave = date !== "" && text.trim() !== "" && !isSaving;

  const save = () => {
    if (!canSave) return;
    onSave({
      date,
      source,
      minutesTaken: Math.max(0, parseInt(minutes, 10) || 0),
      note: text.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit note" : "Add note"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Change the note or the date it belongs to."
              : `Log a contact with ${personName}. It appears in the timeline on the date you give.`}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="note-date">
              <Input
                id="note-date"
                type="date"
                value={date}
                max={todayYmd()}
                onChange={(event) => setDate(event.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field label="Time taken (mins)" htmlFor="note-minutes">
              <Input
                id="note-minutes"
                type="number"
                min={0}
                step={5}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
              />
            </Field>
          </div>

          <Field label="How">
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-gray-200/70 bg-gray-50/80 p-1">
              {notesSource.map((option) => {
                const Icon = SOURCE_ICON[option];
                const active = option === source;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSource(option)}
                    aria-pressed={active}
                    className={cn(
                      "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                      active
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Note" htmlFor="note-text">
            <Textarea
              id="note-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={`What happened with ${personName.split(" ")[0]}?`}
              className="min-h-[120px]"
              required
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {initial ? "Save note" : "Add note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- file

interface AttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: AttachmentUploadInput) => void;
  personName: string;
}

export function AttachmentDialog({
  open,
  onOpenChange,
  onSave,
  personName,
}: AttachmentDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(todayYmd);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(todayYmd());
      setFile(null);
      setPreviewUrl(null);
      setError(null);
      setDragging(false);
    }
  }, [open]);

  // Release the preview object URL when it's replaced or the dialog closes.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const choose = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = validateAttachmentFile(candidate);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(candidate);
    setPreviewUrl(isImage(candidate.type) ? URL.createObjectURL(candidate) : null);
  };

  const canSave = file !== null && date !== "";

  const save = () => {
    if (!file || !canSave) return;
    onSave({ file, date });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>Add file</DialogTitle>
          <DialogDescription>
            Attach a document or photo to {personName}'s record.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={allowedAttachmentTypes.join(",")}
            className="hidden"
            onChange={(event) => {
              choose(event.target.files?.[0]);
              event.target.value = ""; // allow re-selecting the same file
            }}
          />

          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white p-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <FileText className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-gray-800"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {fileKind(file.type)} · {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                choose(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                dragging
                  ? "border-blue-400 bg-blue-50/60"
                  : "border-gray-300/80 bg-gray-50/60 hover:border-gray-400 hover:bg-gray-50",
              )}
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Choose a file or drop it here
              </span>
              <span className="text-xs text-gray-500">
                Images, PDFs and documents up to{" "}
                {maxAttachmentBytes / (1024 * 1024)}MB
              </span>
            </button>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Field
            label="Document date"
            htmlFor="file-date"
            hint="The date on the document itself, not today's date."
          >
            <Input
              id="file-date"
              type="date"
              value={date}
              max={todayYmd()}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              Add file
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
