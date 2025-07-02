import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { ClientMetadata } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function ClientForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<ClientMetadata, "id">>({
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
  });

  const queryClient = useQueryClient();

  const clientQuery = useQuery({
    ...trpc.clients.getById.queryOptions({ id }),
    enabled: isEditing,
  });
  const clientQueryKey = trpc.clients.getAll.queryKey();

  const createClientMutation = useMutation(
    trpc.clients.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientQueryKey });
        navigate("/clients");
      },
    })
  );

  const updateClientMutation = useMutation(
    trpc.clients.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: clientQueryKey });
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

    // Special case for attendance allowance checkbox
    if (
      field === "details.attendanceAllowance" &&
      e.target.type === "checkbox"
    ) {
      value = e.target.checked ? "approved" : "pending";
    }

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name;
    const value = e.target.value;
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: array,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: array }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateClientMutation.mutate({ ...formData, id } as ClientMetadata & {
        id: number;
      });
    } else {
      createClientMutation.mutate(formData as Omit<ClientMetadata, "id">);
    }
  };

  const handleCancel = () => {
    navigate("/clients");
  };

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
                <Input
                  id="name"
                  name="details.name"
                  value={formData.details.name || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>{" "}
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
                  Post Code
                </label>
                <Input
                  id="postCode"
                  name="postCode"
                  value={formData.postCode || ""}
                  onChange={handleInputChange}
                />
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
                  onChange={handleArrayInputChange}
                  placeholder="e.g., Personal Care, Domestic Support"
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Provided (comma-separated)
                </label>
                <Input
                  id="services"
                  name="details.services"
                  value={formData.details.services?.join(", ") || ""}
                  onChange={handleArrayInputChange}
                  placeholder="e.g., Home Care, Meal Preparation"
                />
              </div>{" "}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="hasMp"
                    checked={formData.mpRequests?.length > 0 || false}
                    onChange={(e) => {
                      // This needs custom handling for the array
                      if (
                        e.target.checked &&
                        formData.mpRequests?.length === 0
                      ) {
                        setFormData((prev) => ({
                          ...prev,
                          mpRequests: [{ requestType: "mp" } as any],
                        }));
                      } else if (!e.target.checked) {
                        setFormData((prev) => ({
                          ...prev,
                          mpRequests: [],
                        }));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Has MP?
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="details.attendanceAllowance"
                    checked={
                      formData.details.attendanceAllowance === "approved"
                    }
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Has Attendance Allowance?
                  </span>
                </label>
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
