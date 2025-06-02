import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { mockMps } from "../data/mockData";
import type { Mp } from "../types";

export function MpForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<Mp>>({
    name: "",
    dob: "",
    address: "",
    postCode: "",
    phone: "",
    email: "",
    nextOfKin: "",
    dbsNumber: "",
    dbsExpiry: "",
    servicesOffered: [],
    specialisms: [],
    transport: "",
    capacity: "",
    trainingRecords: [],
  });

  const [servicesInput, setServicesInput] = useState("");
  const [specialismsInput, setSpecialismsInput] = useState("");
  const [trainingInput, setTrainingInput] = useState({
    training: "",
    expiry: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      const mp = mockMps.find((m) => m.id === id);
      if (mp) {
        setFormData(mp);
        setServicesInput(mp.servicesOffered.join(", "));
        setSpecialismsInput(mp.specialisms.join(", "));
      }
    }
  }, [isEditing, id]);

  const handleInputChange = (field: keyof Mp, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (
    field: "servicesOffered" | "specialisms",
    value: string
  ) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setFormData((prev) => ({ ...prev, [field]: array }));
  };

  const addTrainingRecord = () => {
    if (trainingInput.training && trainingInput.expiry) {
      setFormData((prev) => ({
        ...prev,
        trainingRecords: [...(prev.trainingRecords || []), trainingInput],
      }));
      setTrainingInput({ training: "", expiry: "" });
    }
  };

  const removeTrainingRecord = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      trainingRecords:
        prev.trainingRecords?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      console.log("Updating MP:", formData);
    } else {
      console.log("Creating MP:", formData);
    }
    navigate("/mps");
  };

  const handleCancel = () => {
    navigate("/mps");
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {isEditing ? "Edit MP" : "Create New MP"}
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
                  htmlFor="dbsNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  DBS Number
                </label>
                <Input
                  id="dbsNumber"
                  value={formData.dbsNumber || ""}
                  onChange={(e) =>
                    handleInputChange("dbsNumber", e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="dbsExpiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  DBS Expiry
                </label>
                <Input
                  id="dbsExpiry"
                  type="date"
                  value={formData.dbsExpiry || ""}
                  onChange={(e) =>
                    handleInputChange("dbsExpiry", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Services & Capacity
              </h3>

              <div>
                <label
                  htmlFor="servicesOffered"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Services Offered (comma-separated)
                </label>
                <Input
                  id="servicesOffered"
                  value={servicesInput}
                  onChange={(e) => {
                    setServicesInput(e.target.value);
                    handleArrayInputChange("servicesOffered", e.target.value);
                  }}
                  placeholder="e.g., Personal Care, Domestic Support"
                />
              </div>

              <div>
                <label
                  htmlFor="specialisms"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Specialisms (comma-separated)
                </label>
                <Input
                  id="specialisms"
                  value={specialismsInput}
                  onChange={(e) => {
                    setSpecialismsInput(e.target.value);
                    handleArrayInputChange("specialisms", e.target.value);
                  }}
                  placeholder="e.g., Dementia Care, Mobility Support"
                />
              </div>

              <div>
                <label
                  htmlFor="transport"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transport
                </label>
                <Input
                  id="transport"
                  value={formData.transport || ""}
                  onChange={(e) =>
                    handleInputChange("transport", e.target.value)
                  }
                  placeholder="e.g., Own Car, Public Transport"
                />
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Capacity
                </label>
                <Input
                  id="capacity"
                  value={formData.capacity || ""}
                  onChange={(e) =>
                    handleInputChange("capacity", e.target.value)
                  }
                  placeholder="e.g., Full Time, Part Time"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">
                  Training Records
                </h4>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Training name"
                    value={trainingInput.training}
                    onChange={(e) =>
                      setTrainingInput((prev) => ({
                        ...prev,
                        training: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="date"
                    placeholder="Expiry date"
                    value={trainingInput.expiry}
                    onChange={(e) =>
                      setTrainingInput((prev) => ({
                        ...prev,
                        expiry: e.target.value,
                      }))
                    }
                  />
                  <Button type="button" onClick={addTrainingRecord} size="sm">
                    Add
                  </Button>
                </div>

                {formData.trainingRecords &&
                  formData.trainingRecords.length > 0 && (
                    <div className="space-y-2">
                      {formData.trainingRecords.map((record, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm">
                            {record.training} - {record.expiry}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrainingRecord(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update MP" : "Create MP"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
