import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Select, { MultiValue } from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { ClientMetadata, VolunteerLog, VolunteerMetadata } from "../types";
import { updateNestedValue } from "@/utils/helpers";

export function VolunteerLogForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<VolunteerLog, "id">>({
    date: "",
    clients: [],
    volunteers: [],
    details: { services: [], hoursLogged: 1, notes: "" },
  });

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());
  const volunteerLogQuery = useQuery({
    ...trpc.volunteerLogs.getById.queryOptions({ id }),
    enabled: isEditing && !!id,
  });
  const volunteerLogQueryKey = trpc.volunteerLogs.getAll.queryKey();

  const createVolunteerLogMutation = useMutation(
    trpc.volunteerLogs.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteerLogQueryKey });
        navigate("/volunteer-logs");
      },
    })
  );

  const updateVolunteerLogMutation = useMutation(
    trpc.volunteerLogs.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: volunteerLogQueryKey });
        navigate("/volunteer-logs");
      },
    })
  );

  // Load existing data when editing
  useEffect(() => {
    if (volunteerLogQuery.data) {
      setFormData(volunteerLogQuery.data);
    }
  }, [volunteerLogQuery.data]);

  const clientOptions = (clientsQuery.data || []).map(
    (client: ClientMetadata) => ({
      value: client.id,
      label: client.details.name,
    })
  );

  const volunteerOptions = (volunteersQuery.data || []).map(
    (volunteer: VolunteerMetadata) => ({
      value: volunteer.id,
      label: volunteer.details.name,
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

  const handleCSVInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as
      | "details.services"
      | "details.needs"
      | "details.specialisms";
    let value = e.target.value.split(",");
    setFormData((prev) => updateNestedValue(field, value, prev));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateVolunteerLogMutation.mutate({ ...formData, id } as VolunteerLog & {
        id: number;
      });
    } else {
      createVolunteerLogMutation.mutate(formData as Omit<VolunteerLog, "id">);
    }
  };

  const handleCancel = () => {
    navigate("/volunteer-logs");
  };

  if (isEditing && volunteerLogQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && volunteerLogQuery.error)
    return <div>Error loading volunteer log</div>;
  if (clientsQuery.isLoading || volunteersQuery.isLoading)
    return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Volunteer Log" : "Create New Volunteer Log"}
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
                  htmlFor="client"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client
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
                  placeholder="Select a client..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                />
              </div>

              <div>
                <label
                  htmlFor="volunteer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Volunteer *
                </label>
                <Select
                  options={volunteerOptions}
                  value={
                    volunteerOptions.filter(
                      (option: { value: string; label: string }) =>
                        formData.volunteers
                          ?.map((volunteer) => volunteer.id)
                          .includes(option.value)
                    ) || null
                  }
                  onChange={(newValues) =>
                    handleMultiSelectChange(
                      "volunteers",
                      volunteersQuery.data ?? [],
                      newValues
                    )
                  }
                  placeholder="Select a volunteer..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services (comma-separated) *
                </label>
                <Input
                  id="services"
                  name="details.services"
                  value={formData.details.services}
                  onChange={handleCSVInputChange}
                  placeholder="e.g., Consultation, Document Review"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="hoursLogged"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hours Logged *
                </label>
                <Input
                  id="hoursLogged"
                  name="details.hoursLogged"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.details.hoursLogged || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.5"
                  required
                />
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
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about the service provided..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Volunteer Log" : "Create Volunteer Log"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
