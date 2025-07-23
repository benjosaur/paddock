import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { VolunteerFull } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { FieldEditModal } from "@/components/FieldEditModal";

export function VolunteerForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<VolunteerFull, "id">>({
    archived: "N",
    dateOfBirth: "",
    dbsExpiry: "",
    publicLiabilityExpiry: "",
    details: {
      name: "",
      address: {
        streetAddress: "",
        locality: "",
        county: "Somerset",
        postCode: "",
      },
      phone: "",
      email: "",
      nextOfKin: "",
      services: [],
      specialisms: [],
      transport: false,
      capacity: "",
      attendsMag: false,
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
  const thisVolunteerQueryKey = trpc.volunteers.getById.queryKey();
  const volunteerQueryKey = trpc.volunteers.getAll.queryKey();

  const createVolunteerMutation = useMutation(
    trpc.volunteers.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteerQueryKey });
        navigate("/volunteers");
      },
    })
  );

  const updateVolunteerMutation = useMutation(
    trpc.volunteers.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteerQueryKey });
        navigate("/volunteers");
      },
    })
  );

  const updateNameMutation = useMutation(
    trpc.volunteers.updateName.mutationOptions({
      onSuccess: () => {
        const queryKeys = [
          thisVolunteerQueryKey,
          trpc.trainingRecords.getAll.queryKey(),
        ];

        queryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name;
    let value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleCSVInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as "details.services" | "details.specialisms";
    let value = e.target.value.split(",");
    setFormData((prev) => updateNestedValue(field, value, prev));
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
                Contact Information
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
                  Date of Birth *
                </label>
                <Input
                  id="dob"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                  required
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
                <Input
                  id="locality"
                  name="details.address.locality"
                  value={formData.details.address.locality || ""}
                  onChange={handleInputChange}
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
                  Services Offered (comma-separated)
                </label>
                <Input
                  id="services"
                  name="details.services"
                  value={formData.details.services.join(",")}
                  onChange={handleCSVInputChange}
                  placeholder="e.g., Personal Care, Domestic Support"
                />
              </div>

              <div>
                <label
                  htmlFor="specialisms"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Specialisms (comma-separated)
                </label>
                <Input
                  id="specialisms"
                  name="details.specialisms"
                  value={formData.details.specialisms.join(",")}
                  onChange={handleCSVInputChange}
                  placeholder="e.g., Dementia Care, Mobility Support"
                />
              </div>

              <div>
                <label
                  htmlFor="transport"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transport
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    name="details.transport"
                    type="checkbox"
                    checked={formData.details.transport || false}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Has Transport?
                  </span>
                </label>
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

              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">
                  Training Records
                </h4>
                {/* TODO */}
                <Button type="button" onClick={() => {}} size="sm">
                  Edit Records
                </Button>

                {formData.trainingRecords &&
                  formData.trainingRecords.length > 0 && (
                    <div className="space-y-2">
                      {formData.trainingRecords.map((record, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm">
                            {record.details.name} - Expires: {record.expiryDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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
