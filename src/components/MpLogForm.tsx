import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { mockClients, mockMps } from "../data/mockData";
import type { MpLog, Client, Mp } from "../types";

export function MpLogForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<MpLog>>({
    date: "",
    client: "",
    mp: "",
    services: [],
    hoursLogged: undefined,
    notes: "",
  });

  const [servicesInput, setServicesInput] = useState("");

  const clientOptions = mockClients.map((client: Client) => ({
    value: client.name,
    label: client.name,
  }));

  const mpOptions = mockMps.map((mp: Mp) => ({
    value: mp.name,
    label: mp.name,
  }));

  const handleInputChange = (field: keyof MpLog, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumericInputChange = (field: keyof MpLog, value: string) => {
    const numericValue = value === "" ? undefined : parseFloat(value);
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
  };

  const handleArrayInputChange = (value: string) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setFormData((prev) => ({ ...prev, services: array }));
    setServicesInput(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating MP Log:", formData);
    navigate("/mp-logs");
  };

  const handleCancel = () => {
    navigate("/mp-logs");
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Create New MP Log
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
                  Client *
                </label>
                <Select
                  options={clientOptions}
                  value={
                    clientOptions.find(
                      (option) => option.value === formData.client
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("client", selectedOption?.value || "")
                  }
                  placeholder="Select a client..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="mp"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  MP *
                </label>
                <Select
                  options={mpOptions}
                  value={
                    mpOptions.find((option) => option.value === formData.mp) ||
                    null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("mp", selectedOption?.value || "")
                  }
                  placeholder="Select an MP..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Service Details
              </h3>

              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services (comma-separated) *
                </label>
                <Input
                  id="services"
                  value={servicesInput}
                  onChange={(e) => handleArrayInputChange(e.target.value)}
                  placeholder="e.g., Consultation, Document Review"
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
                  step="0.5"
                  min="0"
                  value={formData.hoursLogged || ""}
                  onChange={(e) =>
                    handleNumericInputChange("hoursLogged", e.target.value)
                  }
                  placeholder="e.g., 2.5"
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
                  placeholder="Additional notes about the service provided..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Create MP Log</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
