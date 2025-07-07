import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select, { MultiValue } from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { MagLog, ClientMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";

export function MagLogForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<MagLog, "id">>({
    date: "",
    clients: [],
    details: {
      total: 0,
      notes: "",
    },
  });

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());

  const magLogQuery = useQuery({
    ...trpc.magLogs.getById.queryOptions({ id }),
    enabled: isEditing && !!id,
  });

  const magLogQueryKey = trpc.magLogs.getAll.queryKey();

  const createMagLogMutation = useMutation(
    trpc.magLogs.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: magLogQueryKey });
        navigate("/mag-logs");
      },
    })
  );

  const updateMagLogMutation = useMutation(
    trpc.magLogs.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: magLogQueryKey });
        navigate("/mag-logs");
      },
    })
  );

  // Load existing data when editing
  useEffect(() => {
    if (magLogQuery.data) {
      setFormData(magLogQuery.data);
    }
  }, [magLogQuery.data]);

  const clientOptions = (clientsQuery.data || []).map(
    (client: ClientMetadata) => ({
      value: client.id,
      label: client.details.name,
    })
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const field = e.target.name;
    let value =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMagLogMutation.mutate({ ...formData, id } as MagLog & {
        id: number;
      });
    } else {
      createMagLogMutation.mutate(formData as Omit<MagLog, "id">);
    }
  };

  const handleMultiSelectChange = (
    field: string,
    options: ({ id: string } & Record<string, any>)[],
    newValues: MultiValue<{
      label: string;
      value: string;
    }>
  ) => {
    // finds the whole client object to put into mplog -> excess will be parsed away server-side
    const matchedOptions = options.filter((option) =>
      newValues.map((value) => value.value).includes(option.id)
    );
    setFormData((prev) => updateNestedValue(field, matchedOptions, prev));
  };

  const handleCancel = () => {
    navigate("/mag-logs");
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit MAG Log" : "Create New MAG Log"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Log Information
              </h3>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date *
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="total"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Attendees *
                </label>
                <Input
                  id="total"
                  name="total"
                  type="number"
                  min="0"
                  value={formData.details.total || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 8"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Attendees</h3>

              <div>
                <label
                  htmlFor="attendees"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registered Attendees
                </label>
                <Select
                  options={clientOptions}
                  value={
                    clientOptions.filter(
                      (option: { value: string; label: string }) =>
                        formData.clients
                          ?.map((client) => client.id)
                          .includes(option.value)
                    ) || null
                  }
                  onChange={(newValues) =>
                    handleMultiSelectChange(
                      "clients",
                      clientsQuery.data ?? [],
                      newValues
                    )
                  }
                  placeholder="Search and select attendees..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No clients found"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Search by client name to add registered attendees
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="details.notes"
                  value={formData.details.notes || ""}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the MAG log session..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update MAG Log" : "Create MAG Log"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
