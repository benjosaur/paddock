import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { ClientRequest, Client } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function ClientRequestForm() {
  const navigate = useNavigate();
  const id = Number(useParams<{ id: string }>().id);
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<ClientRequest>>({
    clientId: undefined,
    requestType: "volunteer",
    startDate: "",
    schedule: "",
    status: "pending",
  });

  // tRPC queries
  const queryClient = useQueryClient();

  const clientsQuery = useQuery(trpc.clients.getAll.queryOptions());
  const clientRequestQuery = useQuery({
    ...trpc.clientRequests.getById.queryOptions({ id }),
    enabled: isEditing && !!id,
  });
  const clientRequestQueryKey = trpc.clientRequests.getAll.queryKey();

  const clients = clientsQuery.data || [];
  const clientRequest = clientRequestQuery.data;
  const clientsLoading = clientsQuery.isLoading;
  const requestLoading = clientRequestQuery.isLoading;

  // tRPC mutations
  const createMutation = useMutation(
    trpc.clientRequests.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientRequestQueryKey });
        navigate("/new-requests");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.clientRequests.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientRequestQueryKey });
        navigate("/new-requests");
      },
    })
  );

  const clientOptions = clients.map((client: Client) => ({
    value: client.id,
    label: client.name,
  }));

  const requestTypeOptions = [
    { value: "volunteer", label: "Volunteer" },
    { value: "paid", label: "Paid" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  useEffect(() => {
    if (isEditing && clientRequest) {
      setFormData(clientRequest);
    }
  }, [isEditing, clientRequest]);

  const handleInputChange = (
    field: keyof ClientRequest,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requestData = formData as ClientRequest;

    if (isEditing) {
      updateMutation.mutate({ ...requestData, id });
    } else {
      createMutation.mutate(requestData);
    }
  };

  const handleCancel = () => {
    navigate("/new-requests");
  };

  // Show loading state
  if (isEditing && (requestLoading || clientsLoading)) {
    return (
      <div className="space-y-6 animate-in">
        <div className="flex justify-center items-center py-12">
          <div className="text-lg text-gray-600">Loading client request...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Client Request" : "Create New Client Request"}
        </h1>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Request Information
              </h3>

              <div>
                <label
                  htmlFor="client"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client *
                </label>
                <Select
                  options={clientOptions}
                  value={
                    clientOptions.find(
                      (option: { value: number; label: string }) =>
                        option.value === formData.clientId
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("clientId", selectedOption?.value)
                  }
                  placeholder="Select a client..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isLoading={clientsLoading}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="requestType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Request Type *
                </label>
                <Select
                  options={requestTypeOptions}
                  value={
                    requestTypeOptions.find(
                      (option) => option.value === formData.requestType
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange(
                      "requestType",
                      selectedOption?.value || ""
                    )
                  }
                  placeholder="Select request type..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date *
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Service Details
              </h3>

              <div>
                <label
                  htmlFor="schedule"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Schedule *
                </label>
                <Input
                  id="schedule"
                  value={formData.schedule || ""}
                  onChange={(e) =>
                    handleInputChange("schedule", e.target.value)
                  }
                  placeholder="e.g., Mon, Wed, Fri at 10:00 AM"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={
                    statusOptions.find(
                      (option) => option.value === formData.status
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleInputChange("status", selectedOption?.value || "")
                  }
                  placeholder="Select status..."
                  className="react-select-container"
                  classNamePrefix="react-select"
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
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditing
                ? "Update Request"
                : "Create Client Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
