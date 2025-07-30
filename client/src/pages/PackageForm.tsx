import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Select, { SingleValue, MultiValue } from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { Package, MpMetadata, RequestMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { serviceOptions } from "shared/const";

export function PackageForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const initialRequestId = location.state?.requestId || "";

  const [formData, setFormData] = useState<Omit<Package, "id">>({
    carerId: "",
    requestId: initialRequestId,
    startDate: "",
    endDate: "open",
    details: {
      name: "",
      weeklyHours: 0,
      address: {
        streetAddress: "",
        locality: "",
        county: "Somerset",
        postCode: "",
      },
      notes: "",
      services: [],
    },
  });

  const queryClient = useQueryClient();

  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const requestsQuery = useQuery(trpc.requests.getAllMetadata.queryOptions());

  const packageQuery = useQuery({
    ...trpc.packages.getById.queryOptions({ id }),
    enabled: isEditing,
  });
  const packageQueryKey = trpc.packages.getAll.queryKey();

  const createPackageMutation = useMutation(
    trpc.packages.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: packageQueryKey });
        navigate("/packages");
      },
    })
  );

  const updatePackageMutation = useMutation(
    trpc.packages.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: packageQueryKey });
        navigate("/packages");
      },
    })
  );

  // Load existing data when editing
  useEffect(() => {
    if (packageQuery.data) {
      setFormData(packageQuery.data);
    }
  }, [packageQuery.data]);

  // Auto-populate package details when request is selected (only for new packages)
  useEffect(() => {
    if (!isEditing && formData.requestId && requestsQuery.data) {
      const selectedRequest = requestsQuery.data.find(
        (request: RequestMetadata) => request.id === formData.requestId
      );
      if (selectedRequest) {
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            name: `${selectedRequest.details.name}`,
            address: selectedRequest.details.address,
            services: selectedRequest.details.services || [],
          },
        }));
      }
    }
  }, [formData.requestId, requestsQuery.data, isEditing]);

  const mpOptions = (mpsQuery.data || [])
    .filter((mp: MpMetadata) => mp.id && mp.details?.name)
    .map((mp: MpMetadata) => ({
      value: mp.id,
      label: mp.details.name,
    }));

  const requestOptions = (requestsQuery.data || [])
    .filter((request: RequestMetadata) => request.id && request.details?.name)
    .map((request: RequestMetadata) => ({
      value: request.id,
      label: `${request.details.name} - ${request.requestType}`,
    }));

  const serviceSelectOptions = serviceOptions.map((service) => ({
    value: service,
    label: service,
  }));

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const field = e.target.name;
    let value =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSelectChange = (
    field: string,
    selectedOption: SingleValue<{ value: string; label: string }>
  ) => {
    const value = selectedOption ? selectedOption.value : "";
    setFormData((prev) => updateNestedValue(field, value, prev));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updatePackageMutation.mutate({ ...formData, id } as Package);
    } else {
      createPackageMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    navigate("/packages");
  };

  if (isEditing && packageQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && packageQuery.error) return <div>Error loading package</div>;
  if (mpsQuery.isLoading || requestsQuery.isLoading)
    return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Package" : "Create New Package"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Package Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Name
                </label>
                <Input
                  id="name"
                  name="details.name"
                  value={formData.details.name || ""}
                  placeholder="Auto-generated from selected request"
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="requestId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Request *
                </label>
                <Select
                  options={requestOptions}
                  value={
                    requestOptions.find(
                      (option) => option.value === formData.requestId
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleSelectChange("requestId", selectedOption)
                  }
                  placeholder="Select a request..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  noOptionsMessage={() => "No requests found"}
                  isClearable
                />
              </div>

              <div>
                <label
                  htmlFor="carerId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Carer/MP *
                </label>
                <Select
                  options={mpOptions}
                  value={
                    mpOptions.find(
                      (option) => option.value === formData.carerId
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleSelectChange("carerId", selectedOption)
                  }
                  placeholder="Select a carer/MP..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  noOptionsMessage={() => "No carers/MPs found"}
                  isClearable
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

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate === "open" ? "" : formData.endDate}
                  onChange={(e) => {
                    const value = e.target.value || "open";
                    setFormData((prev) =>
                      updateNestedValue("endDate", value, prev)
                    );
                  }}
                />
                <small className="text-gray-500">
                  Leave empty for ongoing package
                </small>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Package Details
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
                  step="0.5"
                  min="0"
                  value={formData.details.weeklyHours || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Address
                </label>
                <div className="space-y-2">
                  <Input
                    name="details.address.streetAddress"
                    placeholder="Street Address"
                    value={formData.details.address.streetAddress || ""}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="details.address.locality"
                    placeholder="Town/City *"
                    value={formData.details.address.locality || ""}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    name="details.address.county"
                    placeholder="County"
                    value={formData.details.address.county || "Somerset"}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="details.address.postCode"
                    placeholder="Post Code *"
                    value={formData.details.address.postCode || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services
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
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No services found"}
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
                  name="details.notes"
                  value={formData.details.notes || ""}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the package..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
