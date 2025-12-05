import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { trpc } from "../utils/trpc";
import type { ClientFull, VolunteerMetadata, InfoDetails } from "../types";
import { infoDetailsSchema } from "../types";
import { validateOrToast } from "@/utils/validation";
import { associatedClientRoutes } from "../routes/ClientsRoutes";
import { notesSource, serviceOptions } from "shared/const";
import { updateNestedValue } from "@/utils/helpers";
import { MultiValue } from "react-select";
import { useTodaysDate } from "@/hooks/useTodaysDate";

type VolunteerOption = { label: string; value: string };

export function InfoForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const encodedClientId = searchParams.get("clientId") || "";
  const clientId = decodeURIComponent(encodedClientId);

  const [formData, setFormData] = useState<InfoDetails>({
    date: "",
    completedBy: {
      id: "",
      name: "",
    },
    minutesTaken: 0,
    source: "Phone",
    note: "",
    services: [],
  });

  const queryClient = useQueryClient();

  // Fetch client and volunteers
  const clientQuery = useQuery(
    trpc.clients.getById.queryOptions({ id: clientId })
  );
  const volunteersQuery = useQuery(
    trpc.volunteers.getAllNotEndedYet.queryOptions()
  );

  const client = clientQuery.data as ClientFull | undefined;
  const volunteers = (volunteersQuery.data || []) as VolunteerMetadata[];

  // Build select options and find Coordinator default
  const volunteerOptions: VolunteerOption[] = useMemo(
    () =>
      volunteers.map((v) => ({
        value: v.id,
        label: v.details.name,
      })),
    [volunteers]
  );

  const coordinatorDefault = useMemo(() => {
    const coordinator = volunteers.find(
      (v) => v.details.role === "Coordinator"
    );
    return coordinator
      ? { value: coordinator.id, label: coordinator.details.name }
      : null;
  }, [volunteers]);

  const selectedVolunteer = useMemo(() => {
    return formData.completedBy.id
      ? volunteerOptions.find((v) => v.value === formData.completedBy.id) ||
          null
      : null;
  }, [formData.completedBy.id, volunteerOptions]);

  useTodaysDate({
    enabled: !formData.date,
    setDate: (value) => setFormData((prev) => ({ ...prev, date: value })),
  });

  // Seed default volunteer once data loads
  useEffect(() => {
    if (!formData.completedBy.id && coordinatorDefault) {
      setFormData((prev) => ({
        ...prev,
        completedBy: {
          id: coordinatorDefault.value,
          name: coordinatorDefault.label,
        },
      }));
    }
  }, [coordinatorDefault, formData.completedBy.id]);

  const createInfoMutation = useMutation(
    trpc.clients.createInfoEntry.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/clients");
      },
    })
  );

  const handleMultiSelectChange = (
    field: string,
    newValues: MultiValue<{
      label: string;
      value: string;
    }> | null
  ) => {
    const selectedValues = newValues
      ? newValues.map((option) => option.value)
      : [];
    setFormData((prev) => updateNestedValue(field, selectedValues, prev));
  };

  const serviceSelectOptions = serviceOptions.map((service) => ({
    value: service,
    label: service,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !formData.completedBy.id) return;
    const validated = validateOrToast<InfoDetails>(
      infoDetailsSchema,
      formData,
      { toastPrefix: "Form Validation Error", logPrefix: "Info form" }
    );
    if (!validated) return;
    createInfoMutation.mutate({ client, infoDetails: validated });
  };

  const handleCancel = () => navigate("/clients");

  if (clientQuery.isLoading || volunteersQuery.isLoading)
    return <div>Loading...</div>;
  if (clientQuery.error || volunteersQuery.error)
    return <div>Error loading data</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Record Information Support
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Context</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <Input
                  value={`${client.details.customId || ""} ${
                    client.details.name
                  }`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volunteer
                </label>
                <Select
                  options={volunteerOptions}
                  value={selectedVolunteer}
                  onChange={(selectedOption) =>
                    setFormData(
                      (p): InfoDetails => ({
                        ...p,
                        completedBy: {
                          id: (selectedOption as VolunteerOption)?.value || "",
                          name:
                            (selectedOption as VolunteerOption)?.label || "",
                        },
                      })
                    )
                  }
                  isSearchable
                  placeholder="Select a volunteer..."
                  noOptionsMessage={() => "No volunteers found"}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Information Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, date: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source *
                </label>
                <Select
                  value={{ label: formData.source, value: formData.source }}
                  onChange={(selected) =>
                    setFormData((p) => ({
                      ...p,
                      source: ((selected?.value as InfoDetails["source"]) ||
                        "Phone") as InfoDetails["source"],
                    }))
                  }
                  options={notesSource.map((s) => ({ label: s, value: s }))}
                  placeholder="Select source..."
                />
              </div>

              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Enquired
                </label>
                <Select
                  options={serviceSelectOptions}
                  value={
                    serviceSelectOptions.filter((option) =>
                      formData.services?.includes(option.value)
                    ) || null
                  }
                  onChange={(newValues) =>
                    handleMultiSelectChange("services", newValues)
                  }
                  placeholder="Search and select services..."
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No services found"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minutes Taken *
                </label>
                <Input
                  type="number"
                  name="minutesTaken"
                  min={0}
                  step={1}
                  value={formData.minutesTaken ?? ""}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, note: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional notes (will be attached to client's dated notes)"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedVolunteer || createInfoMutation.isPending}
            >
              {createInfoMutation.isPending ? "Saving..." : "Create Info Entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
