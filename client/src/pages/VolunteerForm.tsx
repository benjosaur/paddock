import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { VolunteerFull } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { FieldEditModal } from "@/components/FieldEditModal";
import { MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import { serviceOptions, localities, volunteerRoles } from "shared/const";
import { associatedVolunteerRoutes } from "../routes/VolunteersRoutes";

export function VolunteerForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<VolunteerFull, "id">>({
    dateOfBirth: "",
    endDate: "open",
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
      role: "Volunteer",
      attendsMag: false,
      publicLiabilityNumber: "",
      dbsNumber: "",
      notes: [],
    },
    trainingRecords: [],
    requests: [],
  });

  const queryClient = useQueryClient();

  const volunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id }),
    enabled: isEditing,
  });

  const createVolunteerMutation = useMutation(
    trpc.volunteers.create.mutationOptions({
      onSuccess: () => {
        associatedVolunteerRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/volunteers");
      },
    })
  );

  const updateVolunteerMutation = useMutation(
    trpc.volunteers.update.mutationOptions({
      onSuccess: () => {
        associatedVolunteerRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/volunteers");
      },
    })
  );

  const updateNameMutation = useMutation(
    trpc.volunteers.updateName.mutationOptions({
      onSuccess: () => {
        associatedVolunteerRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  useEffect(() => {
    if (volunteerQuery.data) {
      const volunteer = volunteerQuery.data;
      setFormData(volunteer);
    }
  }, [volunteerQuery.data]);

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

  const handleFieldChangeSubmit = (field: string, newValue: string) => {
    if (!isEditing) return;

    if (field == "details.name") {
      updateNameMutation.mutate({
        volunteerId: id,
        newName: newValue,
      });
    } else throw new Error(`${field} not a recognised field`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateVolunteerMutation.mutate({ ...formData, id });
    } else {
      createVolunteerMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    navigate("/volunteers");
  };

  const serviceSelectOptions = serviceOptions.map((service) => ({
    value: service,
    label: service,
  }));

  const roleSelectOptions = volunteerRoles.map((role) => ({
    value: role,
    label: role,
  }));

  if (isEditing && volunteerQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && volunteerQuery.error)
    return <div>Error loading volunteer</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Volunteer" : "Create New Volunteer"}
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
                  <Input
                    id="name"
                    name="details.name"
                    value={formData.details.name || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isEditing}
                    className="flex-1"
                  />
                  {isEditing && !volunteerQuery.isLoading && (
                    <FieldEditModal
                      field="details.name"
                      currentValue={formData.details.name}
                      onSubmit={handleFieldChangeSubmit}
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
                  Post Code *
                </label>
                <Input
                  id="postCode"
                  name="details.address.postCode"
                  value={formData.details.address.postCode || ""}
                  onChange={handleInputChange}
                  required
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
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Current Role *
                </label>
                <Select
                  id="role"
                  value={
                    formData.details.role
                      ? {
                          label: formData.details.role,
                          value: formData.details.role,
                        }
                      : null
                  }
                  options={roleSelectOptions}
                  onChange={(selectedOption) =>
                    handleSelectChange("details.role", selectedOption)
                  }
                  placeholder="Select role..."
                  required
                />
              </div>

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
              {isEditing ? "Update Volunteer" : "Create Volunteer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
