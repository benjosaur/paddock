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

export function RenewRequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "";

  const [oldRequestData, setOldRequestData] = useState<RequestMetadata | null>(
    null
  );
  const [newRequestData, setNewRequestData] = useState<
    Omit<RequestMetadata, "id">
  >({
    clientId: "",
    archived: "N",
    requestType: "paid",
    startDate: "",
    endDate: "open",
    details: {
      customId: "",
      name: "",
      weeklyHours: 0,
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
    enabled: Boolean(id),
  });

  const clients = clientsQuery.data || [];
  const request = requestQuery.data;

  const renewMutation = useMutation(
    trpc.requests.renew.mutationOptions({
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
    if (request) {
      const currentDate = new Date().toISOString().split("T")[0];

      setOldRequestData({
        ...request,
        endDate: currentDate,
      });

      setNewRequestData({
        clientId: request.clientId,
        archived: "N",
        requestType: request.requestType,
        startDate: currentDate,
        endDate: "open",
        details: {
          ...request.details,
        },
      });
    }
  }, [request]);

  // Sync new request start date with old request end date
  useEffect(() => {
    if (oldRequestData?.endDate && oldRequestData.endDate !== "open") {
      setNewRequestData((prev) => ({
        ...prev,
        startDate: oldRequestData.endDate,
      }));
    }
  }, [oldRequestData?.endDate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isOld: boolean = false
  ) => {
    const field = e.target.name;
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target instanceof HTMLInputElement && e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;

    if (isOld && oldRequestData) {
      setOldRequestData((prev) =>
        prev ? updateNestedValue(field, value, prev) : null
      );
    } else {
      setNewRequestData((prev) => updateNestedValue(field, value, prev));
    }
  };

  const handleSelectClientChange = (
    newValue: {
      label: string;
      value: string;
    } | null,
    isOld: boolean = false
  ) => {
    if (isOld && oldRequestData) {
      setOldRequestData((prev) =>
        prev
          ? {
              ...prev,
              clientId: newValue?.value ?? "",
              details: { ...prev.details, name: newValue?.label ?? "" },
            }
          : null
      );
    } else {
      setNewRequestData((prev) => ({
        ...prev,
        clientId: newValue?.value ?? "",
        details: { ...prev.details, name: newValue?.label ?? "" },
      }));
    }
  };

  const handleSelectChange = (
    field: string,
    newValue: {
      label: string;
      value: string;
    } | null,
    isOld: boolean = false
  ) => {
    if (!newValue) return null;

    if (isOld && oldRequestData) {
      setOldRequestData((prev) =>
        prev ? updateNestedValue(field, newValue.value, prev) : null
      );
    } else {
      setNewRequestData((prev) =>
        updateNestedValue(field, newValue.value, prev)
      );
    }
  };

  const handleMultiSelectChange = (
    field: string,
    newValues: MultiValue<{
      label: string;
      value: string;
    }>,
    isOld: boolean = false
  ) => {
    const selectedValues = newValues.map((option) => option.value);

    if (isOld && oldRequestData) {
      setOldRequestData((prev) =>
        prev ? updateNestedValue(field, selectedValues, prev) : null
      );
    } else {
      setNewRequestData((prev) =>
        updateNestedValue(field, selectedValues, prev)
      );
    }
  };

  const handleCancel = () => {
    navigate("/requests");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldRequestData) {
      renewMutation.mutate({
        oldRequest: oldRequestData,
        newRequest: newRequestData,
      });
    }
  };

  if (requestQuery.isLoading || clientsQuery.isLoading)
    return <div>Loading...</div>;
  if (requestQuery.error) return <div>Error loading request</div>;
  if (!oldRequestData) return <div>Request not found</div>;

  const renderFormSection = (
    title: string,
    formData: RequestMetadata | Omit<RequestMetadata, "id">,
    isOld: boolean = false
  ) => (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">{title}</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Request Information
            </h3>

            <div>
              <label
                htmlFor={`client-${isOld ? "old" : "new"}`}
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
                onChange={(newValue) =>
                  handleSelectClientChange(newValue, isOld)
                }
                placeholder="Select a client..."
                isSearchable
                isLoading={clientsQuery.isLoading}
                required
                isDisabled={true}
              />
            </div>

            <div>
              <label
                htmlFor={`requestType-${isOld ? "old" : "new"}`}
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
                  handleSelectChange("requestType", selectedOption, isOld)
                }
                placeholder="Select request type..."
                required
                isDisabled={isOld}
              />
            </div>

            <div>
              <label
                htmlFor={`startDate-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date *
              </label>
              <Input
                id={`startDate-${isOld ? "old" : "new"}`}
                name="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => handleInputChange(e, isOld)}
                required
                disabled={true}
              />
            </div>

            <div>
              <label
                htmlFor={`endDate-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <Input
                id={`endDate-${isOld ? "old" : "new"}`}
                name="endDate"
                type="date"
                value={formData.endDate === "open" ? "" : formData.endDate}
                onChange={(e) => {
                  const value = e.target.value || "open";
                  if (isOld && oldRequestData) {
                    setOldRequestData((prev) =>
                      prev ? updateNestedValue("endDate", value, prev) : null
                    );
                  } else {
                    setNewRequestData((prev) =>
                      updateNestedValue("endDate", value, prev)
                    );
                  }
                }}
              />
              <small className="text-gray-500">
                Leave empty for ongoing request
              </small>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Service Details
            </h3>

            <div>
              <label
                htmlFor={`weeklyHours-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Weekly Hours *
              </label>
              <Input
                id={`weeklyHours-${isOld ? "old" : "new"}`}
                name="details.weeklyHours"
                type="number"
                min="0"
                max="168"
                step="0.5"
                value={formData.details.weeklyHours || ""}
                onChange={(e) => handleInputChange(e, isOld)}
                placeholder="e.g., 10"
                required
              />
            </div>

            <div>
              <label
                htmlFor={`services-${isOld ? "old" : "new"}`}
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
                  handleMultiSelectChange("details.services", newValues, isOld)
                }
                placeholder="Search and select services..."
                isSearchable
                isMulti
                noOptionsMessage={() => "No services found"}
              />
            </div>

            <div>
              <label
                htmlFor={`notes-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <Input
                id={`notes-${isOld ? "old" : "new"}`}
                name="details.notes"
                value={formData.details.notes || ""}
                onChange={(e) => handleInputChange(e, isOld)}
                placeholder="Additional notes about the request"
              />
            </div>

            <div>
              <label
                htmlFor={`status-${isOld ? "old" : "new"}`}
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
                  handleSelectChange("details.status", selectedOption, isOld)
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
                htmlFor={`streetAddress-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Street Address
              </label>
              <Input
                id={`streetAddress-${isOld ? "old" : "new"}`}
                name="details.address.streetAddress"
                value={formData.details.address.streetAddress || ""}
                onChange={(e) => handleInputChange(e, isOld)}
              />
            </div>

            <div>
              <label
                htmlFor={`locality-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Locality *
              </label>
              <Select
                id={`locality-${isOld ? "old" : "new"}`}
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
                    selectedOption,
                    isOld
                  )
                }
                placeholder="Select locality..."
                required
              />
            </div>

            <div>
              <label
                htmlFor={`county-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                County
              </label>
              <Input
                id={`county-${isOld ? "old" : "new"}`}
                name="details.address.county"
                value={formData.details.address.county || ""}
                onChange={(e) => handleInputChange(e, isOld)}
              />
            </div>

            <div>
              <label
                htmlFor={`postCode-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Post Code
              </label>
              <Input
                id={`postCode-${isOld ? "old" : "new"}`}
                name="details.address.postCode"
                value={formData.details.address.postCode || ""}
                onChange={(e) => handleInputChange(e, isOld)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Renew Request
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderFormSection("Current Request (Ending)", oldRequestData, true)}
          {renderFormSection("New Request", newRequestData, false)}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={renewMutation.isPending}>
            {renewMutation.isPending ? "Renewing..." : "Renew Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
