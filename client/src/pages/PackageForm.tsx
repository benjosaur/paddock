import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { SingleValue, MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { Package, MpMetadata, ReqPackage } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { serviceOptions, localities } from "shared/const";
import { associatedPackageRoutes } from "../routes/PackageRoutes";

export function PackageForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  // below will now always be provided
  const initialRequestId = location.state?.requestId || "";

  const [formData, setFormData] = useState<Omit<ReqPackage, "id">>({
    carerId: "",
    requestId: initialRequestId,
    startDate: "",
    endDate: "open",
    details: {
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
      notes: "",
      services: [],
    },
  });

  // no local error state; rely on max attribute for validation

  const queryClient = useQueryClient();

  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());

  const packageQuery = useQuery({
    ...trpc.packages.getById.queryOptions({ id }),
    enabled: isEditing,
  });

  // below only fetches after above query returns (or given by state if adding from requests screen)
  const requestQuery = useQuery({
    ...trpc.requests.getById.queryOptions({ id: formData.requestId }),
    enabled: Boolean(formData.requestId),
  });

  const requestEndDate = requestQuery.data?.endDate;

  const formatDateDmy = (date?: string | null) => {
    if (!date) return "";
    if (date === "open") return "open";
    const [y, m, d] = date.split("-");
    return y && m && d ? `${d} ${m} ${y}` : date;
  };

  const createPackageMutation = useMutation(
    trpc.packages.create.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/packages");
      },
    })
  );

  const updatePackageMutation = useMutation(
    trpc.packages.update.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/packages");
      },
    })
  );

  // Load existing data when editing
  useEffect(() => {
    if (packageQuery.data) {
      setFormData(packageQuery.data as ReqPackage);
    }
  }, [packageQuery.data]);

  useEffect(() => {
    if (!isEditing && formData.requestId && requestQuery.data) {
      const selectedRequest = requestQuery.data;
      if (selectedRequest) {
        setFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            address: selectedRequest.details.address,
            services: selectedRequest.details.services || [],
          },
          request: selectedRequest,
        }));
      }
    }
  }, [formData.requestId, requestQuery.data, isEditing]);

  const mpOptions = (mpsQuery.data || [])
    .filter((mp: MpMetadata) => mp.id && mp.details?.name)
    .map((mp: MpMetadata) => ({
      value: mp.id,
      label: mp.details.name,
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
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target instanceof HTMLInputElement && e.target.type === "number"
        ? Number(e.target.value)
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

  // removed custom end date validation; the input's max enforces this

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
  if (mpsQuery.isLoading || requestQuery.isLoading)
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
                  htmlFor="requestId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Request
                </label>
                <Input
                  id="requestId"
                  name="requestId"
                  value={`${
                    requestQuery.data?.details.customId || ""
                  } - ${formatDateDmy(requestQuery.data?.startDate)}`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Name
                </label>
                <Input
                  id="clientName"
                  name="details.name"
                  value={requestQuery.data?.details.name || ""}
                  readOnly
                  className="bg-gray-50"
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
                  onChange={(selectedOption) => {
                    handleSelectChange("carerId", selectedOption);
                    setFormData((prev) =>
                      updateNestedValue(
                        "details.name",
                        selectedOption?.label ?? "",
                        prev
                      )
                    );
                  }}
                  placeholder="Select a carer/MP..."
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
                  max={
                    requestEndDate && requestEndDate !== "open"
                      ? requestEndDate
                      : undefined
                  }
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
                {requestEndDate && requestEndDate !== "open" && (
                  <small className="text-gray-500 block">
                    Package must end before request end date:{" "}
                    {formatDateDmy(requestEndDate)}
                  </small>
                )}
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
                  value={formData.details.weeklyHours ?? 0}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="oneOffStartDateHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  One-off Hours
                </label>
                <Input
                  id="oneOffStartDateHours"
                  name="details.oneOffStartDateHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.details.oneOffStartDateHours ?? 0}
                  onChange={handleInputChange}
                  placeholder="0"
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
                  <Input
                    name="details.address.county"
                    placeholder="County"
                    value={formData.details.address.county || "Somerset"}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="details.address.postCode"
                    placeholder="Post Code"
                    value={formData.details.address.postCode || ""}
                    onChange={handleInputChange}
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
