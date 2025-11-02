import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import { useQuery } from "@tanstack/react-query";
import type { SolePackage } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { soleServiceOptions } from "shared/const";
import { associatedPackageRoutes } from "../routes/PackageRoutes";
import { useTodaysDate } from "@/hooks/useTodaysDate";

export function SolePackageForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const volunteerIdParam = searchParams.get("volunteerId") || "";
  const packageId = searchParams.get("id") || "";
  const isEditing = Boolean(packageId);
  const queryClient = useQueryClient();

  const packageQuery = useQuery({
    ...trpc.packages.getById.queryOptions({ id: packageId }),
    enabled: isEditing,
  });

  // derive volunteerId: from package when editing, else from search param
  const derivedVolunteerId = isEditing
    ? (packageQuery.data as SolePackage | undefined)?.carerId || ""
    : volunteerIdParam;

  const volunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id: derivedVolunteerId }),
    enabled: !!derivedVolunteerId,
  });

  const [formData, setFormData] = useState<Omit<SolePackage, "id">>({
    carerId: volunteerIdParam,
    startDate: "",
    endDate: "open",
    details: {
      name: "",
      weeklyHours: 0,
      oneOffStartDateHours: 0,
      notes: "",
      services: [],
    },
  });

  useTodaysDate({
    enabled: !isEditing && !formData.startDate,
    setDate: (value) => setFormData((prev) => ({ ...prev, startDate: value })),
  });

  useEffect(() => {
    if (volunteerQuery.data?.details?.name) {
      setFormData((prev) =>
        prev.details.name
          ? prev
          : updateNestedValue(
              "details.name",
              volunteerQuery.data!.details.name,
              prev
            )
      );
    }
  }, [volunteerQuery.data?.details?.name]);

  useEffect(() => {
    if (isEditing && packageQuery.data) {
      const { id: _id, ...rest } = packageQuery.data as SolePackage;
      setFormData(rest as Omit<SolePackage, "id">);
    }
  }, [isEditing, packageQuery.data]);

  const createSolePackage = useMutation(
    trpc.packages.createSole.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/packages");
      },
    })
  );

  const updatePackage = useMutation(
    trpc.packages.update.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/packages");
      },
    })
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const field = e.target.name;
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleMultiSelectChange = (
    field: string,
    newValues: MultiValue<{ label: string; value: string }>
  ) => {
    const selectedValues = newValues.map((option) => option.value);
    setFormData((prev) => updateNestedValue(field, selectedValues, prev));
  };

  const serviceSelectOptions = soleServiceOptions.map((s) => ({
    value: s,
    label: s,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.carerId) return;
    if (isEditing) {
      updatePackage.mutate({
        ...(formData as Omit<SolePackage, "id">),
        id: packageId,
      } as SolePackage);
    } else {
      createSolePackage.mutate(formData);
    }
  };

  if (isEditing && packageQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && packageQuery.error)
    return <div>Error loading sole package</div>;

  // keep create-mode validation when no volunteer id was provided
  if (!isEditing && !derivedVolunteerId)
    return (
      <div className="p-6">
        <div className="text-red-600">Missing volunteerId in query string.</div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Sole Package" : "Create Sole Package"}
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
                  htmlFor="carerId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Volunteer ID (Carer)
                </label>
                <Input
                  id="carerId"
                  name="carerId"
                  value={formData.carerId}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="details.name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Carer Name
                </label>
                <Input
                  id="details.name"
                  name="details.name"
                  value={formData.details.name}
                  readOnly
                  className="bg-gray-50"
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
                  htmlFor="details.weeklyHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Weekly Hours *
                </label>
                <Input
                  id="details.weeklyHours"
                  name="details.weeklyHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.details.weeklyHours ?? ""}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="details.oneOffStartDateHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  One-off Hours
                </label>
                <Input
                  id="details.oneOffStartDateHours"
                  name="details.oneOffStartDateHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.details.oneOffStartDateHours ?? ""}
                  onChange={handleInputChange}
                  placeholder=""
                />
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
                    serviceSelectOptions.filter((o) =>
                      formData.details.services?.includes(o.value)
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
                  htmlFor="details.notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="details.notes"
                  name="details.notes"
                  value={formData.details.notes || ""}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isEditing
                  ? updatePackage.isPending
                  : createSolePackage.isPending
              }
            >
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
