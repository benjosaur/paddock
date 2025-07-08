import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { ClientRequest, ClientMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalise, updateNestedValue } from "@/utils/helpers";
import { requestStatus, requestTypes } from "shared/const";

export function ClientRequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "";
  const clientId = searchParams.get("clientId") || "";

  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<ClientRequest, "id">>({
    clientId: "",
    requestType: "mp",
    startDate: "",
    details: {
      name: "",
      status: "pending",
      schedule: "",
      notes: "",
    },
  });

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());

  const clientRequestQuery = useQuery({
    ...trpc.clientRequests.getById.queryOptions({ id, clientId }),
    enabled: isEditing,
  });
  const clientRequestQueryKey = trpc.clientRequests.getAll.queryKey();

  const clients = clientsQuery.data || [];
  const clientRequest = clientRequestQuery.data;

  const createMutation = useMutation(
    trpc.clientRequests.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientRequestQueryKey });
        navigate("/new-requests");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.clientRequests.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientRequestQueryKey });
        navigate("/new-requests");
      },
    })
  );

  const clientOptions = clients.map((client: ClientMetadata) => ({
    value: client.id,
    label: client.details.name,
  }));

  const requestTypeOptions = requestTypes.map((option) => ({
    value: option,
    label: capitalise(option),
  }));

  const requestStatusOptions = requestStatus.map((option) => ({
    value: option,
    label: capitalise(option),
  }));

  useEffect(() => {
    if (isEditing && clientRequest) {
      setFormData(clientRequest);
    }
  }, [isEditing, clientRequest]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = e.target.name;
    let value =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSelectClientChange = (
    newValue: {
      label: string;
      value: string;
    } | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      clientId: newValue?.value ?? "",
      details: { ...prev.details, name: newValue?.label ?? "" },
    }));
  };

  const handleSelectChange = (
    field: string,
    newValue: {
      label: string;
      value: string;
    } | null
  ) => {
    if (!newValue) return null;
    setFormData((prev) => updateNestedValue(field, newValue.value, prev));
  };

  const handleCancel = () => {
    navigate("/new-requests");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ ...formData, id });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEditing && clientsQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && clientsQuery.error) return <div>Error loading client</div>;

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
                  onChange={handleSelectClientChange}
                  placeholder="Select a client..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isLoading={clientsQuery.isLoading}
                  required
                  isDisabled={isEditing}
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
                    handleSelectChange("requestType", selectedOption)
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
                  name="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={handleInputChange}
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
                  name="details.schedule"
                  value={formData.details.schedule || ""}
                  onChange={handleInputChange}
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
                  options={requestStatusOptions}
                  value={
                    requestStatusOptions.find(
                      (option) => option.value === formData.details.status
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleSelectChange("details.status", selectedOption)
                  }
                  placeholder="Select status..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditing
                ? "Update Request"
                : "Create Client Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
