import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { trpc } from "../utils/trpc";
import type { TrainingRecord } from "../types";
import { trainingRecordSchema } from "../types";
import { validateOrToast } from "@/utils/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { formatLocalDateYYYYMMDD } from "@/hooks/useTodaysDate";
import { useConfig, activeValues } from "@/hooks/useConfig";
import { associatedRecordRoutes } from "@/routes/RecordsRoutes";

export function TrainingRecordForm() {
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(searchParams.get("id"));
  return isEditing ? <EditTrainingRecordForm /> : <AddTrainingRecordsForm />;
}

// Get owner (volunteer or MP) data
function useRecordOwner(ownerId: string) {
  const volunteerQuery = useQuery({
    ...trpc.volunteers.getById.queryOptions({ id: ownerId }),
    enabled: ownerId.startsWith("v") && Boolean(ownerId),
  });

  const mpQuery = useQuery({
    ...trpc.mps.getById.queryOptions({ id: ownerId }),
    enabled: ownerId.startsWith("m") && Boolean(ownerId),
  });

  return {
    owner: ownerId.startsWith("v") ? volunteerQuery.data : mpQuery.data,
    isLoading:
      (ownerId.startsWith("v") && volunteerQuery.isLoading) ||
      (ownerId.startsWith("m") && mpQuery.isLoading),
    error:
      (ownerId.startsWith("v") && volunteerQuery.error) ||
      (ownerId.startsWith("m") && mpQuery.error),
  };
}

function useRecordsSaved() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return () => {
    // Invalidate both volunteer and MP routes since we don't know which one we're updating
    associatedRecordRoutes.forEach((route) => {
      queryClient.invalidateQueries({ queryKey: route.queryKey() });
    });
    navigate("/records");
  };
}

function OwnerInfoBox({ ownerId, name }: { ownerId: string; name: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        Owner Information
      </h4>
      <p className="text-sm text-gray-600">
        <strong>Name:</strong> {name}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Type:</strong> {ownerId.startsWith("v") ? "Volunteer" : "MP"}
      </p>
      <p className="text-sm text-gray-600">
        <strong>ID:</strong> {ownerId}
      </p>
    </div>
  );
}

type RecordEntry = {
  recordName: string;
  recordNumber: string;
  completionDate: string;
  expiryDate: string;
  notes: string;
};

function AddTrainingRecordsForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("ownerId") || "";
  const config = useConfig();

  const [entries, setEntries] = useState<RecordEntry[]>(() => [
    {
      recordName: "",
      recordNumber: "",
      completionDate: formatLocalDateYYYYMMDD(new Date()),
      expiryDate: "",
      notes: "",
    },
  ]);

  const { owner, isLoading, error } = useRecordOwner(ownerId);
  const onSaved = useRecordsSaved();
  const createManyMutation = useMutation(
    trpc.trainingRecords.createMany.mutationOptions({ onSuccess: onSaved })
  );

  const activeTypes = activeValues(config.trainingRecordTypes);
  // Each entry must have a distinct type, so hide types picked by other entries.
  const typeOptionsFor = (index: number) =>
    activeTypes
      .filter(
        (type) =>
          !entries.some(
            (entry, i) => i !== index && entry.recordName === type
          )
      )
      .map((type) => ({ value: type, label: type }));

  const updateEntry = (
    index: number,
    field: keyof RecordEntry,
    value: string
  ) =>
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );

  // "Add Another" carries the previous record's fields over, except the
  // type and notes, which are entry-specific.
  const addEntry = () =>
    setEntries((prev) => [
      ...prev,
      { ...prev[prev.length - 1], recordName: "", notes: "" },
    ]);

  const removeEntry = (index: number) =>
    setEntries((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner) return;

    const chosenTypes = entries
      .map((entry) => entry.recordName)
      .filter(Boolean);
    if (
      new Set(chosenTypes.map((type) => type.toLowerCase())).size !==
      chosenTypes.length
    ) {
      toast.error("Each record must have a different training record type");
      return;
    }

    const schema = trainingRecordSchema.omit({ id: true });
    const records: Omit<TrainingRecord, "id">[] = [];
    for (const [index, entry] of entries.entries()) {
      const validated = validateOrToast<Omit<TrainingRecord, "id">>(
        schema,
        {
          ownerId,
          endDate: "open",
          completionDate: entry.completionDate,
          expiryDate: entry.expiryDate,
          details: {
            name: owner.details.name,
            recordName: entry.recordName,
            recordNumber: entry.recordNumber,
            notes: entry.notes,
          },
        },
        {
          toastPrefix: `Record ${index + 1}: check the required fields`,
          logPrefix: `Training record ${index + 1}`,
        }
      );
      if (!validated) return;
      records.push(validated);
    }
    createManyMutation.mutate(records);
  };

  const handleCancel = () => {
    navigate("/records");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Add Training Records
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
                <Input id="name" value={owner?.details.name ?? ""} disabled />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Additional Information
              </h3>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Archived Date
                </label>
                <Input id="endDate" value="Active" disabled />
              </div>

              {owner && (
                <OwnerInfoBox ownerId={ownerId} name={owner.details.name} />
              )}
            </div>
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">
                    Record {index + 1}
                  </h4>
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEntry(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`recordName-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Training Record Type *
                    </label>
                    <Select
                      id={`recordName-${index}`}
                      value={
                        entry.recordName
                          ? {
                              label: entry.recordName,
                              value: entry.recordName,
                            }
                          : null
                      }
                      options={typeOptionsFor(index)}
                      onChange={(selectedOption) => {
                        if (!selectedOption) return;
                        updateEntry(index, "recordName", selectedOption.value);
                      }}
                      placeholder="Select training record type..."
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`recordNumber-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Record Number
                    </label>
                    <Input
                      id={`recordNumber-${index}`}
                      value={entry.recordNumber}
                      onChange={(e) =>
                        updateEntry(index, "recordNumber", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`completionDate-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Completion Date
                    </label>
                    <Input
                      id={`completionDate-${index}`}
                      type="date"
                      value={entry.completionDate}
                      onChange={(e) =>
                        updateEntry(index, "completionDate", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`expiryDate-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Expiry Date *
                    </label>
                    <Input
                      id={`expiryDate-${index}`}
                      type="date"
                      value={entry.expiryDate}
                      onChange={(e) =>
                        updateEntry(index, "expiryDate", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor={`notes-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Notes
                    </label>
                    <Input
                      id={`notes-${index}`}
                      value={entry.notes}
                      onChange={(e) =>
                        updateEntry(index, "notes", e.target.value)
                      }
                      placeholder="Additional notes about this training record..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addEntry}>
              <Plus className="w-4 h-4 mr-1" />
              Add Another
            </Button>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTrainingRecordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("ownerId") || "";
  const id = searchParams.get("id") || "";
  const config = useConfig();

  const [formData, setFormData] = useState<Omit<TrainingRecord, "id">>({
    ownerId: "",
    endDate: "open",
    completionDate: "",
    expiryDate: "",
    details: {
      name: "",
      recordName: "",
      recordNumber: "",
      notes: "",
    },
  });

  const { owner, isLoading: ownerLoading, error: ownerError } =
    useRecordOwner(ownerId);

  const recordQuery = useQuery({
    ...trpc.trainingRecords.getById.queryOptions({ ownerId, id }),
    enabled: Boolean(id),
  });

  const onSaved = useRecordsSaved();
  const updateMutation = useMutation(
    trpc.trainingRecords.update.mutationOptions({ onSuccess: onSaved })
  );

  // Set form data when editing
  useEffect(() => {
    if (recordQuery.data) {
      const record = recordQuery.data;
      setFormData({
        ownerId: record.ownerId,
        endDate: record.endDate,
        completionDate: record.completionDate,
        expiryDate: record.expiryDate,
        details: record.details,
      });
    }
  }, [recordQuery.data]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = e.target.name;
    const value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target instanceof HTMLInputElement && e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;
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
    const schema = trainingRecordSchema.omit({ id: true });
    const validated = validateOrToast<TrainingRecord>(schema, recordData, {
      toastPrefix: "Form Validation Error",
      logPrefix: "Training record",
    });
    if (!validated) return;
    updateMutation.mutate({
      id,
      ...(validated as Omit<TrainingRecord, "id">),
    });
  };

  const handleCancel = () => {
    navigate("/records");
  };

  const trainingRecordTypeOptions = activeValues(
    config.trainingRecordTypes
  ).map((type) => ({
    value: type,
    label: type,
  }));

  if (ownerLoading || recordQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (ownerError || recordQuery.error) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Edit Training Record
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
                  htmlFor="dbsNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Record Number
                </label>
                <Input
                  id="recordNumber"
                  name="details.recordNumber"
                  value={formData.details.recordNumber || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="completionDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Completion Date
                </label>
                <Input
                  id="completionDate"
                  name="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={handleInputChange}
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
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Archived Date
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
                <OwnerInfoBox ownerId={ownerId} name={owner.details.name} />
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Update Record</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
