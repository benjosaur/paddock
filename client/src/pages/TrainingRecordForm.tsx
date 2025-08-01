import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { trpc } from "../utils/trpc";
import type { TrainingRecord } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { trainingRecordTypes } from "shared/const";
import { associatedVolunteerRoutes } from "../routes/VolunteersRoutes";
import { associatedMpRoutes } from "../routes/MpsRoutes";

export function TrainingRecordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("ownerId") || "";
  const id = searchParams.get("id") || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<TrainingRecord, "id">>({
    ownerId: "",
    archived: "N",
    expiryDate: "",
    details: {
      name: "",
      recordName: "",
      notes: "",
    },
  });

  const queryClient = useQueryClient();

  // Get owner (volunteer or MP) data
  const volunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id: ownerId }),
    enabled: ownerId.startsWith("v") && Boolean(ownerId),
  });

  const mpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id: ownerId }),
    enabled: ownerId.startsWith("m") && Boolean(ownerId),
  });

  const recordQuery = useQuery({
    ...trpc.trainingRecords.getById.queryOptions({ ownerId, id }),
    enabled: isEditing,
  });

  const createMutation = useMutation(
    trpc.trainingRecords.create.mutationOptions({
      onSuccess: () => {
        // Invalidate both volunteer and MP routes since we don't know which one we're updating
        [...associatedVolunteerRoutes, ...associatedMpRoutes].forEach(
          (route) => {
            queryClient.invalidateQueries({ queryKey: route.queryKey() });
          }
        );
        navigate("/records");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.trainingRecords.update.mutationOptions({
      onSuccess: () => {
        [...associatedVolunteerRoutes, ...associatedMpRoutes].forEach(
          (route) => {
            queryClient.invalidateQueries({ queryKey: route.queryKey() });
          }
        );
        navigate("/records");
      },
    })
  );

  // Get owner data
  const owner = ownerId.startsWith("v") ? volunteerQuery.data : mpQuery.data;

  // Set owner name when owner data is loaded (for new records only)
  useEffect(() => {
    if (owner && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          name: owner.details.name,
        },
      }));
    }
  }, [owner, isEditing]);

  // Set form data when editing
  useEffect(() => {
    if (isEditing && recordQuery.data) {
      const record = recordQuery.data;
      setFormData({
        ownerId: record.ownerId,
        archived: record.archived,
        expiryDate: record.expiryDate,
        details: record.details,
      });
    }
  }, [isEditing, recordQuery.data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name;
    const value = e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSelectChange = (
    field: string,
    newValue: {
      label: string;
      value: string;
    } | null
  ) => {
    if (!newValue) return;
    setFormData((prev) => updateNestedValue(field, newValue.value, prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordData = {
      ...formData,
      ownerId,
    };

    if (isEditing) {
      updateMutation.mutate({ id, ...recordData });
    } else {
      createMutation.mutate(recordData);
    }
  };

  const handleCancel = () => {
    navigate("/records");
  };

  const trainingRecordTypeOptions = trainingRecordTypes.map((type) => ({
    value: type,
    label: type,
  }));

  if (
    (ownerId.startsWith("v") && volunteerQuery.isLoading) ||
    (ownerId.startsWith("m") && mpQuery.isLoading) ||
    (isEditing && recordQuery.isLoading)
  ) {
    return <div>Loading...</div>;
  }

  if (
    (ownerId.startsWith("v") && volunteerQuery.error) ||
    (ownerId.startsWith("m") && mpQuery.error) ||
    (isEditing && recordQuery.error)
  ) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Training Record" : "Add Training Record"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Record Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Person Name *
                </label>
                <Input
                  id="name"
                  name="details.name"
                  value={formData.details.name}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing} // Name comes from owner, can't be changed unless editing existing record
                />
              </div>

              <div>
                <label
                  htmlFor="recordName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Training Record Type *
                </label>
                <Select
                  id="recordName"
                  value={
                    formData.details.recordName
                      ? {
                          label: formData.details.recordName,
                          value: formData.details.recordName,
                        }
                      : null
                  }
                  options={trainingRecordTypeOptions}
                  onChange={(selectedOption) =>
                    handleSelectChange("details.recordName", selectedOption)
                  }
                  placeholder="Select training record type..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiry Date *
                </label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Additional Information
              </h3>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <Input
                  id="notes"
                  name="details.notes"
                  value={formData.details.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about this training record..."
                />
              </div>

              {owner && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Owner Information
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {owner.details.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong>{" "}
                    {ownerId.startsWith("v") ? "Volunteer" : "MP"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>ID:</strong> {ownerId}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Record" : "Create Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
