import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SingleValue, MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type {
  Package,
  MpMetadata,
  ReqPackage,
  SolePackage,
  VolunteerMetadata,
} from "../types";
import { packageSchema, reqPackageSchema, solePackageSchema } from "../types";
import { validateOrToast } from "@/utils/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { serviceOptions, localities } from "shared/const";
import { associatedPackageRoutes } from "../routes/PackageRoutes";
import { formatYmdToDmy, getEarliestEndDate } from "@/utils/date";
import { isIdMp, isIdVolunteer } from "shared/utils";

export function RenewPackageForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";

  const [oldPackageData, setOldPackageData] = useState<Package | null>(null);
  const [newPackageData, setNewPackageData] = useState<
    Omit<ReqPackage, "id"> | Omit<SolePackage, "id">
  >({
    carerId: "",
    // requestId: "",
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

  const mpsQuery = useQuery(trpc.mps.getAllNotEndedYet.queryOptions());
  const volunteersQuery = useQuery(
    trpc.volunteers.getAllNotEndedYet.queryOptions()
  );

  const packageQuery = useQuery({
    ...trpc.packages.getById.queryOptions({ id }),
    enabled: Boolean(id),
  });

  // request should be immutable between old and new package anyway
  const requestQuery = useQuery({
    ...trpc.requests.getById.queryOptions({
      id: "requestId" in newPackageData ? newPackageData.requestId : "",
    }),
    enabled: "requestId" in newPackageData && Boolean(newPackageData.requestId),
  });

  // When editing package the original carer (&request) may have an end date which the package needs to adhere to. The selection of other carers, however, only presents from those not ended.
  const originalCarerId = packageQuery.data?.carerId;
  const originalCarerName = packageQuery.data?.details.name;

  const originalMpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id: originalCarerId! }), // assertion that not undef as a result of enabled condition
    enabled: Boolean(originalCarerId && isIdMp(originalCarerId)),
  });

  const originalVolunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id: originalCarerId! }), // assertion that not undef as a result of enabled condition
    enabled: Boolean(originalCarerId && isIdVolunteer(originalCarerId)),
  });

  const mpOptions = (mpsQuery.data || [])
    .filter((mp: MpMetadata) => mp.id && mp.details?.name)
    .map((mp: MpMetadata) => ({
      value: mp.id,
      label: mp.details.name,
    }));

  const volunteerOptions = (volunteersQuery.data || [])
    .filter((v: VolunteerMetadata) => v.id && v.details?.name)
    .map((v: VolunteerMetadata) => ({
      value: v.id,
      label: v.details.name,
    }));

  const originalCarerOption = {
    value: originalCarerId as string,
    label: originalCarerName as string,
  };

  let carerOptions;
  carerOptions = [...mpOptions, ...volunteerOptions];
  if (
    originalCarerId &&
    !carerOptions.some((carer) => carer.value == originalCarerId) // will exist if original carer not ended
  ) {
    carerOptions = [...carerOptions, originalCarerOption];
  }

  const requestEndDate = requestQuery.data?.endDate;
  const isRequestEndDate = Boolean(requestEndDate && requestEndDate !== "open");

  const originalCarerEndDate =
    originalMpQuery.data?.endDate || originalVolunteerQuery.data?.endDate;
  const isCarerEndDate = Boolean(
    originalCarerEndDate && originalCarerEndDate !== "open"
  );

  const isEndDateRequiredForOldPackage =
    (oldPackageData?.carerId == originalCarerId && isCarerEndDate) ||
    isRequestEndDate;

  let earliestEndDateForOldPackage: string;
  if (isEndDateRequiredForOldPackage) {
    earliestEndDateForOldPackage = getEarliestEndDate([
      originalCarerEndDate!,
      requestEndDate!,
    ]); // boolean asserts guarantee string values
  }

  const isEndDateRequiredForNewPackage =
    (newPackageData.carerId == originalCarerId && isCarerEndDate) ||
    isRequestEndDate;
  let earliestEndDateForNewPackage: string;
  if (isEndDateRequiredForNewPackage) {
    earliestEndDateForNewPackage = getEarliestEndDate([
      originalCarerEndDate!,
      requestEndDate!,
    ]); // boolean asserts guarantee string values
  }

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

  useEffect(() => {
    if (packageQuery.data) {
      const { id, ...rest } = packageQuery.data;

      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      const today = new Date();
      const currentDate = formatDate(today);

      today.setDate(today.getDate() - 1);
      const previousDate = formatDate(today);

      setOldPackageData({
        ...packageQuery.data, //incl id
        endDate: previousDate,
      });

      if ("requestId" in packageQuery.data) {
        setNewPackageData({
          ...rest,
          requestId: packageQuery.data.requestId,
          startDate: currentDate,
          endDate: "open",
          details: {
            ...packageQuery.data.details,
          },
        });
      } else {
        setNewPackageData({
          ...rest,
          startDate: currentDate,
          endDate: "open",
          details: {
            ...packageQuery.data.details,
          },
        });
      }
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
    if (!oldPackageData) return;
    const oldValidated = validateOrToast<Package>(
      packageSchema,
      oldPackageData,
      { toastPrefix: "Form Validation Error", logPrefix: "Old package" }
    );
    if (!oldValidated) return;
    const newValidated =
      "requestId" in newPackageData
        ? (validateOrToast<ReqPackage>(
            reqPackageSchema.omit({ id: true }),
            newPackageData as Omit<ReqPackage, "id">,
            {
              toastPrefix: "Form Validation Error",
              logPrefix: "New package",
            }
          ) as ReqPackage | null)
        : (validateOrToast<SolePackage>(
            solePackageSchema.omit({ id: true }),
            newPackageData as Omit<SolePackage, "id">,
            {
              toastPrefix: "Form Validation Error",
              logPrefix: "New package",
            }
          ) as SolePackage | null);
    if (!newValidated) return;
    renewPackageMutation.mutate({
      oldPackage: oldValidated,
      newPackage: newValidated,
    });
  };

  const handleCancel = () => {
    navigate("/packages");
  };

  if (
    packageQuery.isLoading ||
    mpsQuery.isLoading ||
    requestQuery.isLoading ||
    originalMpQuery.isLoading ||
    originalVolunteerQuery.isLoading
  ) {
    return <div>Loading...</div>;
  }
  if (packageQuery.error) return <div>Error loading package</div>;
  if (!oldPackageData) return <div>Package not found</div>;

  const serviceSelectOptions = serviceOptions.map((service) => ({
    value: service,
    label: service,
  }));

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

            {"requestId" in formData && (
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
                  } - ${formatYmdToDmy(requestQuery.data?.startDate)}`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor={`carerId-${isOld ? "old" : "new"}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Carer *
            </label>
            <Select
              options={carerOptions}
              value={
                carerOptions.find(
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
              End Date{" "}
              {isOld
                ? isEndDateRequiredForOldPackage && "*"
                : isEndDateRequiredForNewPackage && "*"}
            </label>
            <Input
              id={`endDate-${isOld ? "old" : "new"}`}
              name="endDate"
              type="date"
              value={formData.endDate === "open" ? "" : formData.endDate}
              max={
                isOld
                  ? earliestEndDateForOldPackage == "open"
                    ? undefined
                    : earliestEndDateForOldPackage
                  : earliestEndDateForNewPackage == "open"
                  ? undefined
                  : earliestEndDateForNewPackage
              }
              required={
                isOld
                  ? isEndDateRequiredForOldPackage
                  : isEndDateRequiredForNewPackage
              }
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
            {(isOld && isEndDateRequiredForOldPackage) ||
            (!isOld && isEndDateRequiredForNewPackage) ? (
              <small className="text-gray-500 block">
                Must end by{" "}
                {formatYmdToDmy(
                  isOld
                    ? earliestEndDateForOldPackage
                    : earliestEndDateForNewPackage
                )}
                {(isOld &&
                  isEndDateRequiredForOldPackage &&
                  originalCarerId == oldPackageData.carerId) ||
                  (!isOld &&
                    isEndDateRequiredForNewPackage &&
                    originalCarerId == newPackageData.carerId &&
                    isCarerEndDate && (
                      <div>
                        (Carer Ends: {formatYmdToDmy(originalCarerEndDate)})
                      </div>
                    ))}
                {((isOld && isEndDateRequiredForOldPackage) ||
                  (!isOld && isEndDateRequiredForNewPackage)) &&
                  isRequestEndDate && (
                    <div className="text-gray-500 block">
                      (Request Ends: {formatYmdToDmy(requestEndDate)})
                    </div>
                  )}
              </small>
            ) : (
              <small className="text-gray-500 block">
                Leave empty for ongoing package
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
              value={formData.details.weeklyHours ?? ""}
              onChange={(e) => handleInputChange(e, isOld)}
              placeholder=""
              required
              disabled={isOld}
            />
          </div>

          <div>
            <label
              htmlFor={`oneOffStartDateHours-${isOld ? "old" : "new"}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              One-off Hours
            </label>
            <Input
              id={`oneOffStartDateHours-${isOld ? "old" : "new"}`}
              name="details.oneOffStartDateHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.details.oneOffStartDateHours ?? ""}
              onChange={(e) => handleInputChange(e, isOld)}
              placeholder=""
              disabled={isOld}
            />
          </div>

          {"address" in formData.details && (
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
                  disabled={isOld}
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
                  isDisabled={isOld}
                />
                <Input
                  name="details.address.county"
                  placeholder="County"
                  value={formData.details.address.county || "Somerset"}
                  onChange={(e) => handleInputChange(e, isOld)}
                  disabled={isOld}
                />
                <Input
                  name="details.address.postCode"
                  placeholder="Post Code *"
                  value={formData.details.address.postCode || ""}
                  onChange={(e) => handleInputChange(e, isOld)}
                  disabled={isOld}
                  required
                />
              </div>
            </div>
          )}

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
                  formData.details.services?.some(
                    (service) => service === option.value
                  )
                ) || null
              }
              onChange={(newValues) =>
                handleMultiSelectChange("details.services", newValues, isOld)
              }
              placeholder="Search and select services..."
              isSearchable
              isMulti
              noOptionsMessage={() => "No services found"}
              isDisabled={isOld}
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
              readOnly={isOld}
            />
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
