import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { RequestMetadata, ClientMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalise, updateNestedValue } from "@/utils/helpers";
import {
  requestStatus,
  requestTypes,
  serviceOptions,
  localities,
} from "shared/const";
import { associatedRequestRoutes } from "../routes/RequestRoutes";

export function RequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "";
  const clientId = searchParams.get("clientId") || "";

  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<RequestMetadata, "id">>({
    clientId: "",
    archived: "N",
    requestType: "paid",
    startDate: "",
    endDate: "open",
    details: {
      customId: "",
      name: "",
      weeklyHours: 0,
      oneOffStartDateHours: 0,
      address: {
        streetAddress: "",
        locality: "Wiveliscombe",
        county: "Somerset",
        postCode: "",
        deprivation: {
          income: false,
          health: false,
        },
      },
      status: "pending",
      services: [],
      notes: "",
    },
  });

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());

  const requestQuery = useQuery({
    ...trpc.requests.getById.queryOptions({ id }),
    enabled: isEditing,
  });

  const clients = clientsQuery.data || [];
  const request = requestQuery.data;

  const createMutation = useMutation(
    trpc.requests.create.mutationOptions({
      onSuccess: () => {
        associatedRequestRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/requests");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.requests.update.mutationOptions({
      onSuccess: () => {
        associatedRequestRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/requests");
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

  const serviceSelectOptions = serviceOptions.map((service) => ({
    value: service,
    label: service,
  }));

  useEffect(() => {
    if (isEditing && request) {
      setFormData(request);
    }
  }, [isEditing, request]);

  // Set initial client from query parameter (only for new requests)
  useEffect(() => {
    if (!isEditing && clientId && clients.length > 0 && !formData.clientId) {
      const selectedClient = clients.find((client) => client.id === clientId);
      if (selectedClient) {
        setFormData((prev) => ({
          ...prev,
          clientId: selectedClient.id,
          details: {
            ...prev.details,
            name: selectedClient.details.name,
            services: selectedClient.details.services || [],
          },
        }));
      }
    }
  }, [clientId, clients, isEditing, formData.clientId]);

  // Auto-populate services when client is selected (only for new requests)
  useEffect(() => {
    if (!isEditing && formData.clientId) {
      const selectedClient = clients.find(
        (client) => client.id === formData.clientId
      );
      if (selectedClient?.details.services) {
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            services: selectedClient.details.services,
          },
        }));
      }
    }
  }, [formData.clientId, clients, isEditing]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = e.target.name;
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target instanceof HTMLInputElement && e.target.type === "number"
        ? Number(e.target.value)
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

  const handleMultiSelectChange = (
    field: string,
    newValues: MultiValue<{
      label: string;
      value: string;
    }>
  ) => {
    const selectedValues = newValues.map((option) => option.value);
    setFormData((prev) => updateNestedValue(field, selectedValues, prev));
  };

  const handleCancel = () => {
    navigate("/requests");
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
                  Client
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
                  htmlFor="weeklyHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Weekly Hours *
                </label>
                <Input
                  id="weeklyHours"
                  name="details.weeklyHours"
                  type="number"
                  min="0"
                  max="168"
                  step="0.5"
                  value={formData.details.weeklyHours || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="oneOffStartDateHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  One-off Hours (on Start Date)
                </label>
                <Input
                  id="oneOffStartDateHours"
                  name="details.oneOffStartDateHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.details.oneOffStartDateHours || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Required
                </label>
                <Select
                  options={serviceSelectOptions}
                  value={
                    serviceSelectOptions.filter((option) =>
                      formData.details.services?.includes(option.value)
                    ) || null
                  }
                  onChange={(newValues) =>
                    handleMultiSelectChange("details.services", newValues)
                  }
                  placeholder="Search and select services..."
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No services found"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Services automatically populated from selected client. Modify
                  as needed.
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <Input
                  id="notes"
                  name="details.notes"
                  value={formData.details.notes || ""}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the request"
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
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Service Address
              </h3>

              <div>
                <label
                  htmlFor="streetAddress"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Street Address
                </label>
                <Input
                  id="streetAddress"
                  name="details.address.streetAddress"
                  value={formData.details.address.streetAddress || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="locality"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Locality *
                </label>
                <Select
                  id="locality"
                  value={
                    formData.details.address.locality
                      ? {
                          label: formData.details.address.locality,
                          value: formData.details.address.locality,
                        }
                      : null
                  }
                  options={localities.map((locality) => ({
                    label: locality,
                    value: locality,
                  }))}
                  onChange={(selectedOption) =>
                    handleSelectChange(
                      "details.address.locality",
                      selectedOption
                    )
                  }
                  placeholder="Select locality..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="county"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  County
                </label>
                <Input
                  id="county"
                  name="details.address.county"
                  value={formData.details.address.county || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="postCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Post Code
                </label>
                <Input
                  id="postCode"
                  name="details.address.postCode"
                  value={formData.details.address.postCode || ""}
                  onChange={handleInputChange}
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
                : "Create Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
