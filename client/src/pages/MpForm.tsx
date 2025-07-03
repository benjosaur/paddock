import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { MpMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";

export function MpForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<MpMetadata, "id">>({
    dateOfBirth: "",
    postCode: "",
    recordName: "",
    recordExpiry: "",
    details: {
      name: "",
      address: "",
      phone: "",
      email: "",
      nextOfKin: "",
      needs: [],
      services: [],
      specialisms: [],
      transport: false,
      capacity: "",
      notes: "",
    },
    trainingRecords: [],
  });

  const queryClient = useQueryClient();

  const mpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id }),
    enabled: isEditing,
  });
  const mpQueryKey = trpc.mps.getAll.queryKey();

  const createMpMutation = useMutation(
    trpc.mps.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mpQueryKey });
        navigate("/mps");
      },
    })
  );

  const updateMpMutation = useMutation(
    trpc.mps.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: mpQueryKey });
        navigate("/mps");
      },
    })
  );

  useEffect(() => {
    if (mpQuery.data) {
      setFormData(mpQuery.data);
    }
  }, [mpQuery.data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name;
    let value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleCSVInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as
      | "details.services"
      | "details.needs"
      | "details.specialisms";
    let value = e.target.value.split(",");
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      console.log(formData);
      updateMpMutation.mutate({ id, ...formData });
    } else {
      createMpMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    navigate("/mps");
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
                Contact Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name *
                </label>
                <Input
                  id="name"
                  name="details.name"
                  value={formData.details.name || ""}
                  onChange={handleInputChange}
                  required
                />
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
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <Input
                  id="address"
                  name="details.address"
                  value={formData.details.address || ""}
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
                  name="postCode"
                  value={formData.postCode || ""}
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
                  name="recordName"
                  value={formData.recordName || ""}
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
                  name="recordExpiry"
                  value={formData.recordExpiry || ""}
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
                  htmlFor="needs"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Needs Offered (comma-separated)
                </label>
                <Input
                  id="needs"
                  name="details.needs"
                  value={formData.details.needs}
                  onChange={handleCSVInputChange}
                  placeholder="e.g., Personal Care, Domestic Support"
                />
              </div>

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
                  value={formData.details.services}
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
                  value={formData.details.specialisms}
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
                            {record.recordName} - Expires: {record.recordExpiry}
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
              {isEditing ? "Update MP" : "Create MP"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
