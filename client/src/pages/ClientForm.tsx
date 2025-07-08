import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import { ClientFull } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalise, updateNestedValue } from "@/utils/helpers";
import Select from "react-select";
import { attendanceAllowanceStatus } from "shared/const";
import { FieldEditModal } from "../components/FieldEditModal";

export function ClientForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<ClientFull, "id">>({
    dateOfBirth: "",
    postCode: "",
    details: {
      name: "",
      address: "",
      phone: "",
      email: "",
      nextOfKin: "",
      referredBy: "",
      clientAgreementDate: "",
      clientAgreementComments: "",
      riskAssessmentDate: "",
      riskAssessmentComments: "",
      needs: [],
      services: [],
      attendanceAllowance: "pending",
      attendsMag: false,
      notes: "",
    },
    mpRequests: [],
    volunteerRequests: [],
    // below not edited here.
    mpLogs: [],
    volunteerLogs: [],
    magLogs: [],
  });

  const queryClient = useQueryClient();

  const clientQuery = useQuery({
    ...trpc.clients.getById.queryOptions({ id }),
    enabled: isEditing,
  });

  const thisClientQueryKey = trpc.clients.getById.queryKey();
  const allClientsQueryKey = trpc.clients.getAll.queryKey();

  const createClientMutation = useMutation(
    trpc.clients.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: allClientsQueryKey });
        navigate("/clients");
      },
    })
  );

  const updateClientMutation = useMutation(
    trpc.clients.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: allClientsQueryKey });
        navigate("/clients");
      },
    })
  );

  useEffect(() => {
    if (clientQuery.data) {
      setFormData(clientQuery.data);
    }
  }, [clientQuery.data]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateClientMutation.mutate({ ...formData, id } as ClientFull & {
        id: number;
      });
    } else {
      createClientMutation.mutate(formData as Omit<ClientFull, "id">);
    }
  };

  const handleCancel = () => {
    navigate("/clients");
  };

  const handleFieldChangeSubmit = (field: string, newValue: string) => {
    if (!isEditing) return;

    const updateNameMutation = useMutation(
      trpc.clients.updateName.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: thisClientQueryKey });
        },
      })
    );
    updateNameMutation.mutate({
      id,
      ...updateNestedValue(field, newValue, formData),
    });
  };

  const attendanceAllowanceOptions = attendanceAllowanceStatus.map(
    (option) => ({
      value: option,
      label: capitalise(option),
    })
  );

  if (isEditing && clientQuery.isLoading) return <div>Loading...</div>;
  if (isEditing && clientQuery.error) return <div>Error loading client</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit Client" : "Create New Client"}
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
                  {isEditing && !clientQuery.isLoading && (
                    <FieldEditModal
                      field="details.name"
                      currentValue={formData.details.name}
                      onSubmit={handleFieldChangeSubmit}
                    />
                  )}
                </div>
              </div>{" "}
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
              </div>{" "}
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
              </div>{" "}
              <div>
                <label
                  htmlFor="postCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Post Code *
                </label>
                <div className="flex gap-2">
                  <Input
                    id="postCode"
                    name="postCode"
                    value={formData.postCode || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isEditing}
                    className="flex-1"
                  />
                  {isEditing && !clientQuery.isLoading && clientQuery.data && (
                    <FieldEditModal
                      field="postCode"
                      currentValue={formData.postCode}
                      onSubmit={handleFieldChangeSubmit}
                    />
                  )}
                </div>
              </div>{" "}
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
              </div>{" "}
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
              </div>{" "}
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
              </div>{" "}
              <div>
                <label
                  htmlFor="referredBy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Referred By/On
                </label>
                <Input
                  id="referredBy"
                  name="details.referredBy"
                  value={formData.details.referredBy || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Services & Assessments
              </h3>{" "}
              <div>
                <label
                  htmlFor="clientAgreementDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Agreement Date
                </label>
                <Input
                  id="clientAgreementDate"
                  name="details.clientAgreementDate"
                  type="date"
                  value={formData.details.clientAgreementDate || ""}
                  onChange={handleInputChange}
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="clientAgreementComments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Agreement Comments
                </label>
                <Input
                  id="clientAgreementComments"
                  name="details.clientAgreementComments"
                  value={formData.details.clientAgreementComments || ""}
                  onChange={handleInputChange}
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="riskAssessmentDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Risk Assessment Date
                </label>
                <Input
                  id="riskAssessmentDate"
                  name="details.riskAssessmentDate"
                  type="date"
                  value={formData.details.riskAssessmentDate || ""}
                  onChange={handleInputChange}
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="riskAssessmentComments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Risk Assessment Comments
                </label>
                <Input
                  id="riskAssessmentComments"
                  name="details.riskAssessmentComments"
                  value={formData.details.riskAssessmentComments || ""}
                  onChange={handleInputChange}
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="needs"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Needs (comma-separated)
                </label>
                <Input
                  id="needs"
                  name="details.needs"
                  value={formData.details.needs?.join(", ") || ""}
                  onChange={handleCSVInputChange}
                  placeholder="e.g., Personal Care, Domestic Support"
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Requested (comma-separated)
                </label>
                <Input
                  id="services"
                  name="details.services"
                  value={formData.details.services?.join(", ") || ""}
                  onChange={handleCSVInputChange}
                  placeholder="e.g., Home Care, Meal Preparation"
                />{" "}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Allowance?
                </label>
                <Select
                  options={attendanceAllowanceOptions}
                  value={
                    attendanceAllowanceOptions.find(
                      (option) =>
                        option.value === formData.details.attendanceAllowance
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    handleSelectChange(
                      "details.attendanceAllowance",
                      selectedOption
                    )
                  }
                  placeholder="Select request type..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Client" : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
