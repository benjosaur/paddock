import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SingleValue, MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { Package, MpMetadata, RequestMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { serviceOptions, localities } from "shared/const";
import { associatedPackageRoutes } from "../routes/PackageRoutes";

export function RenewPackageForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";

  const [oldPackageData, setOldPackageData] = useState<Package | null>(null);
  const [newPackageData, setNewPackageData] = useState<Omit<Package, "id">>({
    carerId: "",
    requestId: "",
    archived: "N",
    startDate: "",
    endDate: "open",
    details: {
      name: "",
      oneOffStartDateHours: 0,
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
      notes: "",
      services: [],
    },
  });

  const queryClient = useQueryClient();

  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const requestsQuery = useQuery(trpc.requests.getAllMetadata.queryOptions());

  const packageQuery = useQuery({
    ...trpc.packages.getById.queryOptions({ id }),
    enabled: Boolean(id),
  });

  const renewPackageMutation = useMutation(
    trpc.packages.renew.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/packages");
      },
    })
  );

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

  useEffect(() => {
    if (packageQuery.data) {
      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      const today = new Date();
      const currentDate = formatDate(today);

      today.setDate(today.getDate() - 1);
      const previousDate = formatDate(today);

      setOldPackageData({
        ...packageQuery.data,
        endDate: previousDate,
      });

      setNewPackageData({
        carerId: packageQuery.data.carerId,
        requestId: packageQuery.data.requestId,
        archived: "N",
        startDate: currentDate,
        endDate: "open",
        details: {
          ...packageQuery.data.details,
        },
      });
    }
  }, [packageQuery.data]);

  // Sync new package start date with old package end date
  useEffect(() => {
    if (oldPackageData?.endDate && oldPackageData.endDate !== "open") {
      const nextDay = new Date(oldPackageData.endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayString = nextDay.toISOString().split("T")[0];

      setNewPackageData((prev) => ({
        ...prev,
        startDate: nextDayString,
      }));
    }
  }, [oldPackageData?.endDate]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    isOld: boolean = false
  ) => {
    const field = e.target.name;
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target instanceof HTMLInputElement && e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;

    if (isOld && oldPackageData) {
      setOldPackageData((prev) =>
        prev ? updateNestedValue(field, value, prev) : null
      );
    } else {
      setNewPackageData((prev) => updateNestedValue(field, value, prev));
    }
  };

  const handleSelectChange = (
    field: string,
    selectedOption: SingleValue<{ value: string; label: string }>,
    isOld: boolean = false
  ) => {
    const value = selectedOption ? selectedOption.value : "";

    if (isOld && oldPackageData) {
      setOldPackageData((prev) =>
        prev ? updateNestedValue(field, value, prev) : null
      );
    } else {
      setNewPackageData((prev) => updateNestedValue(field, value, prev));
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

    if (isOld && oldPackageData) {
      setOldPackageData((prev) =>
        prev ? updateNestedValue(field, selectedValues, prev) : null
      );
    } else {
      setNewPackageData((prev) =>
        updateNestedValue(field, selectedValues, prev)
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPackageData) {
      renewPackageMutation.mutate({
        oldPackage: oldPackageData,
        newPackage: newPackageData,
      });
    }
  };

  const handleCancel = () => {
    navigate("/packages");
  };

  if (packageQuery.isLoading || mpsQuery.isLoading || requestsQuery.isLoading) {
    return <div>Loading...</div>;
  }
  if (packageQuery.error) return <div>Error loading package</div>;
  if (!oldPackageData) return <div>Package not found</div>;

  const renderFormSection = (
    title: string,
    formData: Package | Omit<Package, "id">,
    isOld: boolean = false
  ) => (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">{title}</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Package Information
            </h3>

            <div>
              <label
                htmlFor={`name-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client Name
              </label>
              <Input
                id={`name-${isOld ? "old" : "new"}`}
                name="details.name"
                value={formData.details.name || ""}
                placeholder="Auto-generated from selected request"
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor={`requestId-${isOld ? "old" : "new"}`}
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
                  handleSelectChange("requestId", selectedOption, isOld)
                }
                placeholder="Select a request..."
                isSearchable
                noOptionsMessage={() => "No requests found"}
                isClearable
                isDisabled={true}
              />
            </div>

            <div>
              <label
                htmlFor={`carerId-${isOld ? "old" : "new"}`}
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
                  handleSelectChange("carerId", selectedOption, isOld)
                }
                placeholder="Select a carer/MP..."
                isSearchable
                noOptionsMessage={() => "No carers/MPs found"}
                isClearable
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
                  if (isOld && oldPackageData) {
                    setOldPackageData((prev) =>
                      prev ? updateNestedValue("endDate", value, prev) : null
                    );
                  } else {
                    setNewPackageData((prev) =>
                      updateNestedValue("endDate", value, prev)
                    );
                  }
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
                htmlFor={`weeklyHours-${isOld ? "old" : "new"}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Weekly Hours *
              </label>
              <Input
                id={`weeklyHours-${isOld ? "old" : "new"}`}
                name="details.weeklyHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.details.weeklyHours || ""}
                onChange={(e) => handleInputChange(e, isOld)}
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
                  onChange={(e) => handleInputChange(e, isOld)}
                />
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
                <Input
                  name="details.address.county"
                  placeholder="County"
                  value={formData.details.address.county || "Somerset"}
                  onChange={(e) => handleInputChange(e, isOld)}
                />
                <Input
                  name="details.address.postCode"
                  placeholder="Post Code *"
                  value={formData.details.address.postCode || ""}
                  onChange={(e) => handleInputChange(e, isOld)}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`services-${isOld ? "old" : "new"}`}
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
              <textarea
                id={`notes-${isOld ? "old" : "new"}`}
                name="details.notes"
                value={formData.details.notes || ""}
                onChange={(e) => handleInputChange(e, isOld)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes about the package..."
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
          Renew Package
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderFormSection("Current Package (Ending)", oldPackageData, true)}
          {renderFormSection("New Package", newPackageData, false)}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={renewPackageMutation.isPending}>
            {renewPackageMutation.isPending ? "Renewing..." : "Renew Package"}
          </Button>
        </div>
      </form>
    </div>
  );
}
