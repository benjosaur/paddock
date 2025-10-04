import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { notesSource } from "shared/const";
import { DeleteAlert } from "./DeleteAlert";

export interface Note {
  date: string;
  note: string;
  source: (typeof notesSource)[number];
  minutesTaken: number;
}

interface NotesEditorProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
  onSubmit: (notes: Note[]) => void;
  isPending: boolean;
  disabled?: boolean;
}

export function NotesEditor({
  notes,
  onChange,
  disabled = false,
  onSubmit,
}: NotesEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note>({
    date: "",
    note: "",
    source: "Phone",
    minutesTaken: 0,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNote, setNewNote] = useState<Note>({
    date: new Date().toISOString().split("T")[0],
    note: "",
    source: "Phone",
    minutesTaken: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const handleAddNote = () => {
    if (newNote.note.trim()) {
      const updatedNotes = [...notes, newNote];
      onChange(updatedNotes);
      onSubmit(updatedNotes);
      setNewNote({
        date: new Date().toISOString().split("T")[0],
        note: "",
        source: "Phone",
        minutesTaken: 0,
      });
      setIsAddingNew(false);
    }
  };

  const handleEditNote = (index: number) => {
    setEditingIndex(index);
    setEditingNote({ ...notes[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingNote.note.trim()) {
      const updatedNotes = [...notes];
      updatedNotes[editingIndex] = editingNote;
      onChange(updatedNotes);
      setEditingIndex(null);
      setEditingNote({
        date: "",
        note: "",
        source: "Phone",
        minutesTaken: 0,
      });
      onSubmit(updatedNotes);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingNote({
      date: "",
      note: "",
      source: "Phone",
      minutesTaken: 0,
    });
  };

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteIndex !== null) {
      const updatedNotes = notes.filter((_, i) => i !== deleteIndex);
      onChange(updatedNotes);
      onSubmit(updatedNotes);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteIndex(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notes.length === 0 && !isAddingNew && (
          <div className="text-sm text-gray-500 italic bg-gray-50/50 rounded-lg p-3 text-center">
            No notes added yet
          </div>
        )}

        {notes.map((note, index) => (
          <div
            key={index}
            className="bg-white/60 border border-gray-200/60 rounded-lg p-4 space-y-3"
          >
            {editingIndex === index ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={editingNote.date}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, date: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Note
                  </label>
                  <Textarea
                    value={editingNote.note}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, note: e.target.value })
                    }
                    placeholder="Add your note here..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Source
                    </label>
                    <Select
                      value={{
                        label: editingNote.source,
                        value: editingNote.source,
                      }}
                      onChange={(selectedOption) =>
                        setEditingNote({
                          ...editingNote,
                          source:
                            (selectedOption?.value as typeof editingNote.source) ||
                            "Phone",
                        })
                      }
                      options={notesSource.map((source) => ({
                        label: source,
                        value: source,
                      }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Time Taken (mins)
                    </label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={editingNote.minutesTaken}
                      onChange={(e) =>
                        setEditingNote({
                          ...editingNote,
                          minutesTaken: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={!editingNote.note.trim()}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-gray-500">
                        {formatDate(note.date)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                        {note.source}
                      </span>
                      {note.minutesTaken > 0 && (
                        <span className="text-gray-500">
                          {note.minutesTaken}m
                        </span>
                      )}
                    </div>
                    <div className="text-md text-gray-700 whitespace-pre-wrap">
                      {note.note}
                    </div>
                  </div>
                  {!disabled && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(index)}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-6 h-6" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(index)}
                        className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-6 h-6" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isAddingNew && (
          <div className="bg-blue-50/50 border border-blue-200/60 rounded-lg p-4 space-y-3">
            <div className="text-sm font-medium text-blue-800 mb-2">
              Add New Note
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={newNote.date}
                onChange={(e) =>
                  setNewNote({ ...newNote, date: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Note
              </label>
              <Textarea
                value={newNote.note}
                onChange={(e) =>
                  setNewNote({ ...newNote, note: e.target.value })
                }
                placeholder="Add your note here..."
                className="min-h-[80px] text-sm"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Source
                </label>
                <Select
                  value={{ label: newNote.source, value: newNote.source }}
                  onChange={(selectedOption) =>
                    setNewNote({
                      ...newNote,
                      source:
                        (selectedOption?.value as typeof newNote.source) ||
                        "Phone",
                    })
                  }
                  options={notesSource.map((source) => ({
                    label: source,
                    value: source,
                  }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Time Taken (mins)
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={newNote.minutesTaken}
                  onChange={(e) =>
                    setNewNote({
                      ...newNote,
                      minutesTaken: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewNote({
                    date: new Date().toISOString().split("T")[0],
                    note: "",
                    source: "Phone",
                    minutesTaken: 0,
                  });
                }}
                className="flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.note.trim()}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Note
              </Button>
            </div>
          </div>
        )}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className="flex ml-auto items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        )}
      </div>
      <DeleteAlert
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
