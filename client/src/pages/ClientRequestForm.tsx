import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { mockClients, mockClientRequests } from "../data/mockData";
import type { ClientRequest, Client } from "../types";

export function ClientRequestForm() {
  const navigate = useNavigate();
  const id = Number(useParams<{ id: string }>().id);
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<ClientRequest>>({
    clientId: undefined,
    requestType: "volunteer",
    startDate: "",
    schedule: "",
    status: "pending",
  });

  const clientOptions = mockClients.map((client: Client) => ({
    value: client.id,
    label: client.name,
  }));

  const requestTypeOptions = [
    { value: "volunteer", label: "Volunteer" },
    { value: "paid", label: "Paid" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  useEffect(() => {
    if (isEditing && id) {
      const request = mockClientRequests.find((r) => r.id === id);
      if (request) {
        setFormData(request);
      }
    }
  }, [isEditing, id]);

  const handleInputChange = (
    field: keyof ClientRequest,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      console.log("Updating Client Request:", formData);
    } else {
      console.log("Creating Client Request:", formData);
    }
    navigate("/new-requests");
  };

  const handleCancel = () => {
    navigate("/new-requests");
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Client Request" : "Create New Client Request"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Request Information
              </h3>

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
                      (option) => option.value === formData.clientId
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("clientId", selectedOption?.value)
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
                  htmlFor="requestType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Request Type *
                </label>
                <Select
                  options={requestTypeOptions}
                  value={
                    requestTypeOptions.find(
                      (option) => option.value === formData.requestType
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange(
                      "requestType",
                      selectedOption?.value || ""
                    )
                  }
                  placeholder="Select request type..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date *
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
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
                  htmlFor="schedule"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Schedule *
                </label>
                <Input
                  id="schedule"
                  value={formData.schedule || ""}
                  onChange={(e) =>
                    handleInputChange("schedule", e.target.value)
                  }
                  placeholder="e.g., Mon, Wed, Fri at 10:00 AM"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={
                    statusOptions.find(
                      (option) => option.value === formData.status
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("status", selectedOption?.value || "")
                  }
                  placeholder="Select status..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Request" : "Create Client Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
