import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { mockVolunteers, mockVolunteerLogs } from "../data/mockData";
import { mockClients } from "../data/mockData";
import type { Client, VolunteerLog, Volunteer } from "../types";

export function VolunteerLogForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: number }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<VolunteerLog>>({
    date: "",
    clientId: "",
    volunteerId: "",
    activity: "",
    hoursLogged: 0,
    notes: "",
  });

  // Load existing data when editing
  useEffect(() => {
    if (isEditing && id) {
      const existingLog = mockVolunteerLogs.find((log) => log.id === id);
      if (existingLog) {
        setFormData(existingLog);
      }
    }
  }, [id, isEditing]);

  const clientOptions = mockClients.map((client: Client) => ({
    value: client.id,
    label: client.name,
  }));

  const volunteerOptions = mockVolunteers.map((volunteer: Volunteer) => ({
    value: volunteer.id,
    label: volunteer.name,
  }));

  const handleInputChange = (
    field: keyof VolunteerLog,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(
      isEditing ? "Updating Volunteer Log:" : "Creating Volunteer Log:",
      formData
    );
    navigate("/volunteer-logs");
  };

  const handleCancel = () => {
    navigate("/volunteer-logs");
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Volunteer Log" : "Create New Volunteer Log"}
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
                  htmlFor="client"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client
                </label>
                <Select
                  options={clientOptions}
                  value={
                    clientOptions.find(
                      (option) => option.value === formData.clientId
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("clientId", selectedOption?.value || "")
                  }
                  placeholder="Select a client..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isClearable
                />
              </div>

              <div>
                <label
                  htmlFor="volunteer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Volunteer *
                </label>
                <Select
                  options={volunteerOptions}
                  value={
                    volunteerOptions.find(
                      (option) => option.value === formData.volunteerId
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange(
                      "volunteerId",
                      selectedOption?.value || ""
                    )
                  }
                  placeholder="Select a volunteer..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="hoursLogged"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hours Logged *
                </label>
                <Input
                  id="hoursLogged"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.hoursLogged || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "hoursLogged",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="e.g., 4.5"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Activity Details
              </h3>

              <div>
                <label
                  htmlFor="activity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Activity *
                </label>
                <Input
                  id="activity"
                  value={formData.activity || ""}
                  onChange={(e) =>
                    handleInputChange("activity", e.target.value)
                  }
                  placeholder="e.g., Admin Support, Event Planning"
                  required
                />
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
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the volunteer activity..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Volunteer Log" : "Create Volunteer Log"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
