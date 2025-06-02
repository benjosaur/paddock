import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { mockClients, mockMagLogs } from "../data/mockData";
import type { MagLog, Client } from "../types";

export function MagLogForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: number }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<MagLog>>({
    date: "",
    total: undefined,
    attendees: [],
    notes: "",
  });

  // Load existing data when editing
  useEffect(() => {
    if (isEditing && id) {
      const existingLog = mockMagLogs.find((log) => log.id === id);
      if (existingLog) {
        setFormData(existingLog);
      }
    }
  }, [id, isEditing]);

  const clientOptions = mockClients.map((client: Client) => ({
    value: client.id,
    label: client.name,
  }));

  const handleInputChange = (field: keyof MagLog, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumericInputChange = (field: keyof MagLog, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value);
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
  };

  const handleAttendeesChange = (selectedOptions: any) => {
    const attendees = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, attendees }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      console.log("Updating MAG Log:", formData);
    } else {
      console.log("Creating MAG Log:", formData);
    }
    navigate("/mag-logs");
  };

  const handleCancel = () => {
    navigate("/mag-logs");
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit MAG Log" : "Create New MAG Log"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Log Information
              </h3>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date *
                </label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="total"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Attendees *
                </label>
                <Input
                  id="total"
                  type="number"
                  min="0"
                  value={formData.total || ""}
                  onChange={(e) =>
                    handleNumericInputChange("total", e.target.value)
                  }
                  placeholder="e.g., 8"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Attendees</h3>

              <div>
                <label
                  htmlFor="attendees"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registered Attendees
                </label>
                <Select
                  options={clientOptions}
                  value={clientOptions.filter((option) =>
                    formData.attendees?.includes(option.value)
                  )}
                  onChange={handleAttendeesChange}
                  placeholder="Search and select attendees..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No clients found"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Search by client name to add registered attendees
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the MAG log session..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update MAG Log" : "Create MAG Log"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
