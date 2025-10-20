import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { trpc } from "../utils/trpc";
import { ClientFull } from "../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capitalise, updateNestedValue } from "@/utils/helpers";
import { MultiValue } from "react-select";
import { Select } from "../components/ui/select";
import {
  attendanceAllowanceLevels,
  attendanceAllowanceStatuses,
  serviceOptions,
  localities,
} from "shared/const";
import { FieldEditModal } from "../components/FieldEditModal";
import toast from "react-hot-toast";
import { associatedClientRoutes } from "../routes/ClientsRoutes";

const deprivationToastLogic = (
  deprivationData: { matched: boolean; income: boolean; health: boolean },
  postcode: string
) => {
  if (!deprivationData.matched) {
    toast.error(
      `Postcode ${postcode} not live in database. Please double check entry.`
    );
  } else if (deprivationData.income && deprivationData.health) {
    toast(
      `🚩 Postcode ${postcode} indicates both income and health deprivation.`,
      { duration: 6000 }
    );
  } else if (deprivationData.income) {
    toast(`🚩 Postcode ${postcode} indicates income deprivation.`, {
      duration: 6000,
    });
  } else if (deprivationData.health) {
    toast(`🚩 Postcode ${postcode} indicates health deprivation.`, {
      duration: 6000,
    });
  } else {
    toast(`Postcode ${postcode} shows no deprivation indicators.`);
  }
};

export function ClientForm() {
  const navigate = useNavigate();
  const id = useParams<{ id: string }>().id || "";
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<ClientFull, "id">>({
    endDate: "open",
    dateOfBirth: "",
    details: {
      customId: "",
      name: "",
      address: {
        streetAddress: "",
        locality: "Wiveliscombe",
        county: "Somerset",
        postCode: "",
        deprivation: {
          income: false,
          health: false,
        },
      },
      phone: "",
      email: "",
      nextOfKin: "",
      referredBy: "",
      clientAgreementDate: "",
      clientAgreementComments: "",
      riskAssessmentDate: "",
      riskAssessmentComments: "",
      services: [],
      attendanceAllowance: {
        requestedLevel: "None",
        requestedDate: "",
        status: "None",
        confirmationDate: "",
      },
      attendsMag: false,
      donationScheme: false,
      donationAmount: 0,
      notes: [],
    },
    requests: [],
    magLogs: [],
  });

  const queryClient = useQueryClient();

  const clientQuery = useQuery({
    ...trpc.clients.getById.queryOptions({ id }),
    enabled: isEditing,
  });

  const createClientMutation = useMutation(
    trpc.clients.create.mutationOptions({
      onSuccess: (data) => {
        // Second toast: Deprivation information
        const { deprivationData, postcode } = data;
        if (postcode) deprivationToastLogic(deprivationData, postcode);
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/clients");
      },
    })
  );

  const updateClientMutation = useMutation(
    trpc.clients.update.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
        navigate("/clients");
      },
    })
  );

  const updateNameMutation = useMutation(
    trpc.clients.updateName.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const updateCustomIdMutation = useMutation(
    trpc.clients.updateCustomId.mutationOptions({
      onSuccess: () => {
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  const updatePostCodeMutation = useMutation(
    trpc.clients.updatePostCode.mutationOptions({
      onSuccess: (data) => {
        const { deprivationData, postcode } = data;
        deprivationToastLogic(deprivationData, postcode);
        associatedClientRoutes.forEach((route) => {
          queryClient.invalidateQueries({ queryKey: route.queryKey() });
        });
      },
    })
  );

  useEffect(() => {
    if (clientQuery.data) {
      setFormData(clientQuery.data);
    }
  }, [clientQuery.data]);

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

  const handleMultiSelectChange = (
    field: string,
    newValues: MultiValue<{
      label: string;
      value: string;
    }>
  ) => {
    const selectedValues = newValues.map((option) => option.value);
    setFormData((prev) => updateNestedValue(field, selectedValues, prev));
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

    if (field == "details.name") {
      updateNameMutation.mutate({
        clientId: id,
        newName: newValue,
      });
    } else if (field == "details.customId") {
      updateCustomIdMutation.mutate({
        clientId: id,
        newCustomId: newValue,
      });
    } else if (field == "details.address.postCode") {
      updatePostCodeMutation.mutate({
        clientId: id,
        newPostcode: newValue,
      });
    } else throw new Error(`${field} not a recognised field`);
  };

  const attendanceAllowanceLevelOptions = attendanceAllowanceLevels.map(
    (option) => ({
      value: option,
      label: capitalise(option),
    })
  );

  const attendanceAllowanceStatusOptions = attendanceAllowanceStatuses.map(
    (option) => ({
      value: option,
      label: capitalise(option),
    })
  );

  const serviceSelectOptions = serviceOptions
    .filter((service) => service !== "Information")
    .map((service) => ({
      value: service,
      label: service,
    }));

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
                General Information
              </h3>
              <div>
                <label
                  htmlFor="customId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Custom ID *
                </label>
                <div className="flex gap-2">
                  <Input
                    id="customId"
                    name="details.customId"
                    value={formData.details.customId || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isEditing}
                    className="flex-1"
                    placeholder="Custom identifier"
                  />
                  {isEditing && !clientQuery.isLoading && (
                    <FieldEditModal
                      field="details.customId"
                      currentValue={formData.details.customId}
                      onSubmit={handleFieldChangeSubmit}
                    />
                  )}
                </div>
              </div>
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
              </div>
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
                  Street Address
                </label>
                <Input
                  id="address"
                  name="details.address.streetAddress"
                  value={formData.details.address.streetAddress || ""}
                  onChange={handleInputChange}
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="locality"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Locality *
                </label>
                <Select
                  id="locality"
                  value={
                    formData.details.address.locality
                      ? {
                          label: formData.details.address.locality,
                          value: formData.details.address.locality,
                        }
                      : null
                  }
                  options={localities.map((locality) => ({
                    label: locality,
                    value: locality,
                  }))}
                  onChange={(selectedOption) =>
                    handleSelectChange(
                      "details.address.locality",
                      selectedOption
                    )
                  }
                  placeholder="Select locality..."
                  required
                />
              </div>{" "}
              <div>
                <label
                  htmlFor="county"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  County
                </label>
                <Input
                  id="county"
                  name="details.address.county"
                  value={formData.details.address.county || ""}
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
                <div className="flex gap-2">
                  <Input
                    id="postCode"
                    name="details.address.postCode"
                    value={formData.details.address.postCode || ""}
                    onChange={handleInputChange}
                    className="flex-1"
                    // below if we have a trigger flag for postcode
                    disabled={isEditing}
                  />
                  {isEditing && !clientQuery.isLoading && (
                    <FieldEditModal
                      field="details.address.postCode"
                      currentValue={formData.details.address.postCode}
                      onSubmit={handleFieldChangeSubmit}
                      customDescription="This will not update postcodes attached to this client's existing requests."
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
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
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
                  htmlFor="services"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Requested
                </label>
                <Select
                  options={serviceSelectOptions}
                  value={
                    serviceSelectOptions.filter((option) =>
                      formData.details.services?.includes(option.value)
                    ) || null
                  }
                  onChange={(newValues) =>
                    handleMultiSelectChange("details.services", newValues)
                  }
                  placeholder="Search and select services..."
                  isSearchable
                  isMulti
                  noOptionsMessage={() => "No services found"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Search by service name to add requested services
                </p>
              </div>
              {/* Attendance Allowance Section */}
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">
                  Attendance Allowance
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Level
                  </label>
                  <Select
                    options={attendanceAllowanceLevelOptions}
                    value={
                      attendanceAllowanceLevelOptions.find(
                        (option) =>
                          option.value ===
                          formData.details.attendanceAllowance.requestedLevel
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleSelectChange(
                        "details.attendanceAllowance.requestedLevel",
                        selectedOption
                      )
                    }
                    placeholder="Select level..."
                  />
                </div>

                <div
                  className={
                    formData.details.attendanceAllowance.requestedLevel ===
                    "None"
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }
                >
                  <label
                    htmlFor="attendanceAllowanceRequestedDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Requested Date
                  </label>
                  <Input
                    id="attendanceAllowanceRequestedDate"
                    name="details.attendanceAllowance.requestedDate"
                    type="date"
                    value={
                      formData.details.attendanceAllowance.requestedDate || ""
                    }
                    onChange={handleInputChange}
                    disabled={
                      formData.details.attendanceAllowance.requestedLevel ===
                      "None"
                    }
                  />
                </div>

                <div
                  className={
                    formData.details.attendanceAllowance.requestedLevel ===
                    "None"
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    options={attendanceAllowanceStatusOptions}
                    value={
                      attendanceAllowanceStatusOptions.find(
                        (option) =>
                          option.value ===
                          formData.details.attendanceAllowance.status
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleSelectChange(
                        "details.attendanceAllowance.status",
                        selectedOption
                      )
                    }
                    placeholder="Select status..."
                    isDisabled={
                      formData.details.attendanceAllowance.requestedLevel ===
                      "None"
                    }
                  />
                </div>

                <div
                  className={
                    formData.details.attendanceAllowance.requestedLevel ===
                      "None" ||
                    (formData.details.attendanceAllowance.status !== "Low" &&
                      formData.details.attendanceAllowance.status !== "High")
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }
                >
                  <label
                    htmlFor="attendanceAllowanceConfirmationDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirmation Date
                  </label>
                  <Input
                    id="attendanceAllowanceConfirmationDate"
                    name="details.attendanceAllowance.confirmationDate"
                    type="date"
                    value={
                      formData.details.attendanceAllowance.confirmationDate ||
                      ""
                    }
                    onChange={handleInputChange}
                    disabled={
                      formData.details.attendanceAllowance.requestedLevel ===
                        "None" ||
                      (formData.details.attendanceAllowance.status !== "Low" &&
                        formData.details.attendanceAllowance.status !== "High")
                    }
                  />
                </div>
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
