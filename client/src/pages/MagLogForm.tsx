import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select, { MultiValue } from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type {
  MagLog,
  ClientMetadata,
  MpMetadata,
  VolunteerMetadata,
} from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateNestedValue } from "@/utils/helpers";
import { associatedMagLogRoutes } from "../routes/MagLogRoutes";

export function MagLogForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<MagLog, "id">>({
    date: "",
    archived: "N",
    clients: [],
    mps: [],
    volunteers: [],
    details: {
      totalClients: 0,
      totalFamily: 0,
      totalVolunteers: 0,
      totalMps: 0,
      otherAttendees: 0,
      notes: "",
    },
  });

  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAllWithMagService.queryOptions());
  const mpsQuery = useQuery(trpc.mps.getAll.queryOptions());
  const volunteersQuery = useQuery(trpc.volunteers.getAll.queryOptions());

  const magLogQuery = useQuery({
    ...trpc.mag.getById.queryOptions({ id }),
    enabled: isEditing && !!id,
  });

  const createMagLogMutation = useMutation(
    trpc.mag.create.mutationOptions({
      onSuccess: () => {
        associatedMagLogRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/mag");
      },
    })
  );

  const updateMagLogMutation = useMutation(
    trpc.mag.update.mutationOptions({
      onSuccess: () => {
        associatedMagLogRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/mag");
      },
    })
  );

  // Load existing data when editing
  useEffect(() => {
    if (magLogQuery.data) {
      const { id: _, ...dataWithoutId } = magLogQuery.data as MagLog;
      setFormData(dataWithoutId);
    }
  }, [magLogQuery.data]);

  const clientOptions = (clientsQuery.data || []).map(
    (client: ClientMetadata) => ({
      value: client.id,
      label: client.details.name,
    })
  );

  const mpOptions = (mpsQuery.data || []).map((mp: MpMetadata) => ({
    value: mp.id,
    label: mp.details.name,
  }));

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
    let value: string | number | boolean =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox"
        ? e.target.checked
        : e.target instanceof HTMLInputElement && e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;
    setFormData((prev) => updateNestedValue(field, value, prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMagLogMutation.mutate({ ...formData, id } as MagLog);
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
    navigate("/mag");
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
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Basic Information
              </h3>

              <div className="max-w-md">
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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Attendance Numbers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="totalClients"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Total Clients *
                  </label>
                  <Input
                    id="totalClients"
                    name="details.totalClients"
                    type="number"
                    min="0"
                    value={formData.details.totalClients || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalFamily"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Total Family Members
                  </label>
                  <Input
                    id="totalFamily"
                    name="details.totalFamily"
                    type="number"
                    min="0"
                    value={formData.details.totalFamily || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalVolunteers"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Total Volunteers
                  </label>
                  <Input
                    id="totalVolunteers"
                    name="details.totalVolunteers"
                    type="number"
                    min="0"
                    value={formData.details.totalVolunteers || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalMps"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Total MPs
                  </label>
                  <Input
                    id="totalMps"
                    name="details.totalMps"
                    type="number"
                    min="0"
                    value={formData.details.totalMps || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="otherAttendees"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Other Attendees
                  </label>
                  <Input
                    id="otherAttendees"
                    name="details.otherAttendees"
                    type="number"
                    min="0"
                    value={formData.details.otherAttendees || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Attendees</h3>

              <div>
                <label
                  htmlFor="attendees"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registered Attendees (Clients)
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
                  placeholder="Search and select clients..."
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
                  htmlFor="mps"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  MPs
                </label>
                <Select
                  options={mpOptions}
                  value={
                    mpOptions.filter(
                      (option: { value: string; label: string }) =>
                        formData.mps?.map((mp) => mp.id).includes(option.value)
                    ) || null
                  }
                  onChange={(newValues) =>
                    handleMultiSelectChange(
                      "mps",
                      mpsQuery.data ?? [],
                      newValues
                    )
                  }
                  placeholder="Search and select MPs..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No MPs found"}
                />
                <p className="text-xs text-gray-500 mt-1">Search by MP name</p>
              </div>

              <div>
                <label
                  htmlFor="volunteers"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Volunteers
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
                  placeholder="Search and select volunteers..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No volunteers found"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Search by volunteer name to add volunteers
                </p>
              </div>
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
              <textarea
                id="notes"
                name="details.notes"
                value={formData.details.notes || ""}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes about the MAG log session..."
              />
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
