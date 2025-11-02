import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { MpMetadata } from "../types";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { CoverDetails } from "shared/schemas/convenience";
import { associatedPackageRoutes } from "@/routes/PackageRoutes";
import { updateNestedValue } from "@/utils/helpers";

export function CoverPackageForm() {
  const navigate = useNavigate();
  const packageId = useParams<{ id: string }>().id || "";

  const [formData, setFormData] = useState<CoverDetails>({
    carerId: "",
    oneOffStartDateHours: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const queryClient = useQueryClient();

  const mpsQuery = useSuspenseQuery(trpc.mps.getAll.queryOptions());

  const requestQuery = useSuspenseQuery(
    trpc.requests.getRequestWithOnePackageByPackageId.queryOptions({
      packageId: packageId,
    })
  );

  const createCoverMutation = useMutation(
    trpc.packages.addCoverPeriod.mutationOptions({
      onSuccess: () => {
        associatedPackageRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/packages");
      },
    })
  );

  const mps = mpsQuery.data || [];
  const request = requestQuery.data;

  if (!request) {
    return (
      <div className="text-red-500">
        No request found with package ID {packageId}
      </div>
    );
  }

  const mpOptions = mps
    .filter((mp: MpMetadata) => mp.id && mp.details?.name)
    .map((mp: MpMetadata) => ({
      value: mp.id,
      label: mp.details.name,
    }));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = e.target.name;
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSelectChange = (
    field: string,
    selectedOption: { value: string; label: string } | null
  ) => {
    const value = selectedOption ? selectedOption.value : "";
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCoverMutation.mutate({
      oldPackage: request.packages[0],
      coverDetails: formData,
    });
  };

  const handleCancel = () => {
    navigate("/packages");
  };

  // Calculate total cover hours
  const calculateTotalCoverHours = () => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !request.details?.weeklyHours
    ) {
      return 0;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    console.log(startDate, endDate);

    if (endDate < startDate) {
      return 0;
    }

    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const weeklyHours = request.details.weeklyHours;
    const oneOffHours = formData.oneOffStartDateHours || 0;

    return (totalDays / 7) * weeklyHours + oneOffHours;
  };

  if (mpsQuery.isLoading) return <div>Loading...</div>;
  if (mpsQuery.error) return <div>Error loading data</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Create Cover Package
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Cover Information
              </h3>

              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client
                </label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={request.details?.name || "Unknown Client"}
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
                  onChange={(selectedOption) =>
                    handleSelectChange("carerId", selectedOption)
                  }
                  placeholder="Select a carer/MP..."
                  isSearchable
                  noOptionsMessage={() => "No carers/MPs found"}
                  isClearable
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="weeklyHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Weekly Hours
                </label>
                <Input
                  id="weeklyHours"
                  name="weeklyHours"
                  value={request.details?.weeklyHours || 0}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="oneOffStartDateHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Extra Hours?
                </label>
                <Input
                  id="oneOffStartDateHours"
                  name="oneOffStartDateHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.oneOffStartDateHours ?? ""}
                  onChange={handleInputChange}
                  placeholder=""
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Cover Period
              </h3>

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
                  End Date *
                </label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Total Cover Hours
                </label>
                <div className="text-lg font-semibold text-blue-800">
                  {calculateTotalCoverHours().toFixed(1)} hours
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  (
                  {formData.startDate &&
                  formData.endDate &&
                  formData.startDate <= formData.endDate
                    ? Math.ceil(
                        (new Date(formData.endDate).getTime() -
                          new Date(formData.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    : 0}{" "}
                  days × {request.details?.weeklyHours || 0} weekly hours ÷ 7) +{" "}
                  {formData.oneOffStartDateHours || 0} extra hours
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCoverMutation.isPending}>
              {createCoverMutation.isPending
                ? "Creating..."
                : "Create Cover Package"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
