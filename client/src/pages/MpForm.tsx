import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { MpFull } from "../types";
import { mpFullSchema } from "../types";
import { validateOrToast } from "@/utils/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { FieldEditModal } from "@/components/FieldEditModal";
import { MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { serviceOptions, localities } from "shared/const";
import { associatedMpRoutes } from "../routes/MpsRoutes";

export function MpForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<MpFull, "id">>({
    endDate: "open",
    dateOfBirth: "",
    dbsExpiry: "",
    publicLiabilityExpiry: "",
    details: {
      name: "",
      address: {
        streetAddress: "",
        locality: "Wiveliscombe",
        county: "Somerset",
        postCode: "",
      },
      phone: "",
      email: "",
      nextOfKin: "",
      services: [],
      capacity: "",
      attendsMag: false,
      publicLiabilityNumber: "",
      dbsNumber: "",
      startDate: "",
      notes: [],
    },
    trainingRecords: [],
    requests: [],
  });

  const queryClient = useQueryClient();

  const mpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id }),
    enabled: isEditing,
  });

  const createMpMutation = useMutation(
    trpc.mps.create.mutationOptions({
      onSuccess: () => {
        associatedMpRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/mps");
      },
    })
  );

  const updateMpMutation = useMutation(
    trpc.mps.update.mutationOptions({
      onSuccess: () => {
        associatedMpRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/mps");
      },
    })
  );

  const updateNameMutation = useMutation(
    trpc.mps.updateName.mutationOptions({
      onSuccess: () => {
        associatedMpRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  useEffect(() => {
    if (mpQuery.data) {
      setFormData(mpQuery.data);
    }
  }, [mpQuery.data]);

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

  const prepareMpPayload = (
    data: Omit<MpFull, "id">
  ): Omit<MpFull, "id"> | null => {
    const validated = validateOrToast<Omit<MpFull, "id">>(
      mpFullSchema.omit({ id: true }),
      data,
      { toastPrefix: "Form Validation Error", logPrefix: "MP form" }
    );
    return validated;
  };

  const handleFieldChangeSubmit = (field: string, newValue: string) => {
    if (!isEditing) return;
    const validated = prepareMpPayload(formData);
    if (!validated) return;

    if (field == "details.name") {
      updateNameMutation.mutate({
        mp: { id, ...validated },
        newName: newValue,
      });
    } else throw new Error(`${field} not a recognised field`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validated = prepareMpPayload(formData);
    if (!validated) return;
    if (isEditing) {
      updateMpMutation.mutate({ id, ...(validated as Omit<MpFull, "id">) });
    } else {
      createMpMutation.mutate(validated as Omit<MpFull, "id">);
    }
  };

  const handleCancel = () => {
    navigate("/mps");
  };

  const serviceSelectOptions = serviceOptions.map((service) => ({
    value: service,
    label: service,
  }));

  const [openField, setOpenField] = useState<string | null>(null);
  const openModalFor = (field: string) => {
    if (!isEditing || mpQuery.isLoading) return;
    setOpenField(field);
  };

  if (isEditing && mpQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && mpQuery.error) return <div>Error loading MP</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit MP" : "Create New MP"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                General Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="name"
                      name="details.name"
                      value={formData.details.name || ""}
                      onChange={handleInputChange}
                      required
                      readOnly={isEditing}
                      className="w-full cursor-pointer disabled:opacity-100"
                      onClick={() => openModalFor("details.name")}
                      aria-readonly={isEditing}
                    />
                  </div>
                  {isEditing && !mpQuery.isLoading && (
                    <FieldEditModal
                      field="details.name"
                      currentValue={formData.details.name}
                      onSubmit={handleFieldChangeSubmit}
                      externalOpen={openField === "details.name"}
                      onExternalOpenChange={(o) =>
                        setOpenField(o ? "details.name" : null)
                      }
                    />
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="dob"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date of Birth
                </label>
                <Input
                  id="dob"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                />
              </div>

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

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <Input
                  id="phone"
                  name="details.phone"
                  type="tel"
                  value={formData.details.phone || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="details.email"
                  type="email"
                  value={formData.details.email || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="nextOfKin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Next of Kin
                </label>
                <Input
                  id="nextOfKin"
                  name="details.nextOfKin"
                  value={formData.details.nextOfKin || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="dbsNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  DBS Number
                </label>
                <Input
                  id="dbsNumber"
                  name="details.dbsNumber"
                  value={formData.details.dbsNumber || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="dbsExpiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  DBS Expiry
                </label>
                <Input
                  id="dbsExpiry"
                  type="date"
                  name="dbsExpiry"
                  value={formData.dbsExpiry || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="publicLiabilityNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Public Liability Number
                </label>
                <Input
                  id="publicLiabilityNumber"
                  name="details.publicLiabilityNumber"
                  value={formData.details.publicLiabilityNumber || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="publicLiabilityExpiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Public Liability Expiry
                </label>
                <Input
                  id="publicLiabilityExpiry"
                  type="date"
                  name="publicLiabilityExpiry"
                  value={formData.publicLiabilityExpiry || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <Input
                  id="startDate"
                  name="details.startDate"
                  type="date"
                  value={formData.details.startDate || ""}
                  onChange={handleInputChange}
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
                  type={formData.endDate === "open" ? "text" : "date"}
                  value={
                    formData.endDate === "open"
                      ? "Active"
                      : formData.endDate || ""
                  }
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Services & Capacity
              </h3>
              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Offered
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
                  Search by service name to add offered services
                </p>
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Capacity
                </label>
                <Input
                  id="capacity"
                  name="details.capacity"
                  value={formData.details.capacity || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Full Time, Part Time"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update MP" : "Create MP"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
