import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import type { Client } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function ClientForm() {
  const navigate = useNavigate();
  const id = Number(useParams<{ id: string }>().id);
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<Client, "id">>({
    name: "",
    dob: "",
    address: "",
    postCode: "",
    phone: "",
    email: "",
    nextOfKin: "",
    referredBy: "",
    clientAgreementDate: "",
    clientAgreementComments: "",
    riskAssessmentDate: "",
    riskAssessmentComments: "",
    needs: [],
    servicesProvided: [],
    hasMp: false,
    hasAttendanceAllowance: false,
  });

  const queryClient = useQueryClient();

  const clientQuery = useQuery({
    ...trpc.clients.getById.queryOptions({ id }),
    enabled: isEditing && !!id,
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

  const handleInputChange = (field: keyof Client, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (
    field: "needs" | "servicesProvided",
    value: string
  ) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setFormData((prev) => ({ ...prev, [field]: array }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateClientMutation.mutate({ ...formData, id } as Client & {
        id: number;
      });
    } else {
      createClientMutation.mutate(formData as Omit<Client, "id">);
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
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                  type="date"
                  value={formData.dob || ""}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
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
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
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
                  value={formData.postCode || ""}
                  onChange={(e) =>
                    handleInputChange("postCode", e.target.value)
                  }
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
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
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
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  value={formData.nextOfKin || ""}
                  onChange={(e) =>
                    handleInputChange("nextOfKin", e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="referredBy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Referred By/On
                </label>
                <Input
                  id="referredBy"
                  value={formData.referredBy || ""}
                  onChange={(e) =>
                    handleInputChange("referredBy", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Services & Assessments
              </h3>

              <div>
                <label
                  htmlFor="clientAgreementDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Agreement Date
                </label>
                <Input
                  id="clientAgreementDate"
                  type="date"
                  value={formData.clientAgreementDate || ""}
                  onChange={(e) =>
                    handleInputChange("clientAgreementDate", e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="clientAgreementComments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Agreement Comments
                </label>
                <Input
                  id="clientAgreementComments"
                  value={formData.clientAgreementComments || ""}
                  onChange={(e) =>
                    handleInputChange("clientAgreementComments", e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="riskAssessmentDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Risk Assessment Date
                </label>
                <Input
                  id="riskAssessmentDate"
                  type="date"
                  value={formData.riskAssessmentDate || ""}
                  onChange={(e) =>
                    handleInputChange("riskAssessmentDate", e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="riskAssessmentComments"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Risk Assessment Comments
                </label>
                <Input
                  id="riskAssessmentComments"
                  value={formData.riskAssessmentComments || ""}
                  onChange={(e) =>
                    handleInputChange("riskAssessmentComments", e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="needs"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Needs (comma-separated)
                </label>
                <Input
                  id="needs"
                  value={formData.needs?.join(", ") || ""}
                  onChange={(e) =>
                    handleArrayInputChange("needs", e.target.value)
                  }
                  placeholder="e.g., Personal Care, Domestic Support"
                />
              </div>

              <div>
                <label
                  htmlFor="servicesProvided"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Provided (comma-separated)
                </label>
                <Input
                  id="servicesProvided"
                  value={formData.servicesProvided?.join(", ") || ""}
                  onChange={(e) =>
                    handleArrayInputChange("servicesProvided", e.target.value)
                  }
                  placeholder="e.g., Home Care, Meal Preparation"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasMp || false}
                    onChange={(e) =>
                      handleInputChange("hasMp", e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Has MP?
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasAttendanceAllowance || false}
                    onChange={(e) =>
                      handleInputChange(
                        "hasAttendanceAllowance",
                        e.target.checked
                      )
                    }
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
