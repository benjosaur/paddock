import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";

interface Note {
  date: string;
  note: string;
}

interface NotesEditorProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
  disabled?: boolean;
}

export function NotesEditor({
  notes,
  onChange,
  disabled = false,
}: NotesEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note>({ date: "", note: "" });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNote, setNewNote] = useState<Note>({
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const handleAddNote = () => {
    if (newNote.note.trim()) {
      onChange([...notes, newNote]);
      setNewNote({ date: new Date().toISOString().split("T")[0], note: "" });
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
      setEditingNote({ date: "", note: "" });
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingNote({ date: "", note: "" });
  };

  const handleDeleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    onChange(updatedNotes);
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
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        )}
      </div>

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
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-medium text-gray-500">
                      {formatDate(note.date)}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
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
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(index)}
                        className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
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
      </div>
    </div>
  );
}
