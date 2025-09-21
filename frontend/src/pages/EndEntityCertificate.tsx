import { useState, useEffect, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as yup from "yup";
import * as lucideReact from "lucide-react";
import api from "@/api/axios-config";
import { UserContext } from "@/context/UserContext";
import FileUpload from "@/components/FileUpload";
import { CertificateDownloadModal } from "@/components/CertificateDownloadModal";
import {
  extendedKeyUsageOptions,
  keyUsageOptions,
} from "@/model/end.entity.certificate.extensions";
import { X } from "lucide-react";
const { VITE_API_BASE_URL } = import.meta.env;

interface CertificateAuthority {
  id: string;
  name: string;
  description: string;
  maxValidityDays: number;
  minValidityDays: number;
  defaultValidityDays: number;
  requiredFields: string[];
  optionalFields: string[];
}

const allRdns: Array<keyof CertificateRequestData> = [
  "cn",
  "o",
  "ou",
  "c",
  "st",
  "l",
  "emailAddress",
  "title",
];
const certificateApi = {
  post: async (data: any) => {
    return api.post(`${VITE_API_BASE_URL}/api/certificates/ca-issued`, data);
  },
  getUser: async (userId: string) => {
    return api.get<{
      id: number;
      name: string;
      email: string;
      organization: string;
    }>(`/api/users/${userId}`);
  },
  getCAs: async (userId: string) => {
    const response = await api.get<CertificateAuthority[]>(
      `${VITE_API_BASE_URL}/api/certificates/get-cas/${userId}`
    );
    return response.data.map((r) => ({
      ...r,
      requiredFields: ["cn", "emailAddress"],
      optionalFields: allRdns.filter(
        (field) => field !== "cn" && field !== "emailAddress"
      ),
    }));
  },
  downloadPem: async (certId: string) => {
    const response = await api.get(
      `${VITE_API_BASE_URL}/api/certificates/${certId}/download/pem`,
      {
        responseType: "blob",
      }
    );
    const blob = new Blob([response.data], { type: "application/x-pem-file" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `certificate-${certId}.pem`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  },
};

interface CertificateAuthority {
  id: string;
  name: string;
  description: string;
  maxValidityDays: number;
  minValidityDays: number;
  defaultValidityDays: number;
  requiredFields: string[];
  optionalFields: string[];
}

interface CertificateRequestData {
  subjectId: string;
  caId: string;
  cn: string;
  o: string;
  ou: string;
  c: string;
  st: string;
  l: string;
  emailAddress: string;
  title: string;
  validityDays: number;
  keyUsage: string[];
  extendedKeyUsage: string[];
}

interface FormErrors {
  [key: string]: string;
}

export const EndEntityCertificateForm: React.FC = () => {
  const userContext = useContext(UserContext);
  const [isExternal, setIsExternal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [certificateToDownload, setCertificateToDownload] = useState<
    string | null
  >(null);
  const [isKeyUsageAccordionOpen, setIsKeyUsageAccordionOpen] = useState(false);

  const handleToggle = () => {
    setIsExternal(!isExternal);
  };

  const [selectedCA, setSelectedCA] = useState<CertificateAuthority | null>(
    null
  );
  const [formData, setFormData] = useState<CertificateRequestData>({
    subjectId: userContext?.currentUser?.id ?? "",
    caId: "",
    cn: "",
    o: "",
    ou: "",
    c: "",
    st: "",
    l: "",
    emailAddress: "",
    title: "",
    validityDays: 30,
    keyUsage: [], // Default selections
    extendedKeyUsage: [], // Default selections
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [dynamicSchema, setDynamicSchema] = useState<yup.ObjectSchema<any>>(
    yup.object()
  );
  const [lastStatus, setLastStatus] = useState<"success" | "error" | null>(
    null
  );

  // Fetch available CAs
  const { data: certificateAuthorities, isLoading: loadingCAs } = useQuery({
    queryKey: ["certificate-authorities"],
    queryFn: () => certificateApi.getCAs(userContext?.currentUser?.id ?? ""),
  });

  useEffect(() => {
    certificateApi.getUser(userContext?.currentUser?.id ?? "").then((res) => {
      setFormData((prev) => ({
        ...prev,
        o: res.data.organization,
      }));
    });
  }, []);

  // Handle Key Usage changes
  const handleKeyUsageChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      keyUsage: checked
        ? [...prev.keyUsage, value]
        : prev.keyUsage.filter((usage) => usage !== value),
    }));
  };

  // Handle Extended Key Usage changes
  const handleExtendedKeyUsageChange = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      extendedKeyUsage: checked
        ? [...prev.extendedKeyUsage, value]
        : prev.extendedKeyUsage.filter((usage) => usage !== value),
    }));
  };

  // Update form when CA is selected
  useEffect(() => {
    if (selectedCA) {
      setFormData((prev) => ({
        ...prev,
        caId: selectedCA.id,
        validityDays: selectedCA.defaultValidityDays,
      }));
      // Create dynamic validation schema
      const schemaShape: any = {
        caId: yup.string().required("Please select a Certificate Authority"),
        validityDays: yup
          .number()
          .required("Validity period is required")
          .min(
            selectedCA.minValidityDays,
            `Minimum validity is ${selectedCA.minValidityDays} days`
          )
          .max(
            selectedCA.maxValidityDays,
            `Maximum validity is ${selectedCA.maxValidityDays} days`
          ),
      };

      // Add required field validations
      selectedCA.requiredFields.forEach((field: string) => {
        switch (field) {
          case "cn":
            schemaShape.cn = yup
              .string()
              .required("Common Name is required")
              .min(1, "Common Name cannot be empty")
              .max(64, "Common Name cannot exceed 64 characters");
            break;
          case "emailAddress":
            schemaShape.emailAddress = yup
              .string()
              .required("Email Address is required")
              .email("Please enter a valid email address");
            break;
          case "o":
            schemaShape.o = yup
              .string()
              .required("Organization is required")
              .max(64, "Organization cannot exceed 64 characters");
            break;
        }
      });

      // Add optional field validations
      selectedCA.optionalFields.forEach((field: string) => {
        switch (field) {
          case "ou":
            schemaShape.ou = yup
              .string()
              .max(64, "Department cannot exceed 64 characters");
            break;
          case "c":
            schemaShape.c = yup
              .string()
              .length(2, "Country code must be exactly 2 characters")
              .matches(/^[A-Z]{2}$/, "Country code must be uppercase letters");
            break;
          case "st":
            schemaShape.st = yup
              .string()
              .max(128, "State cannot exceed 128 characters");
            break;
          case "l":
            schemaShape.l = yup
              .string()
              .max(128, "City cannot exceed 128 characters");
            break;
          case "title":
            schemaShape.title = yup
              .string()
              .max(64, "Title cannot exceed 64 characters");
            break;
        }
      });
      setDynamicSchema(yup.object().shape(schemaShape));
    }
  }, [selectedCA]);

  const createCertificateRequestMutation = useMutation({
    mutationFn: (data: Partial<CertificateRequestData>) =>
      certificateApi.post(data),
    onSuccess: async (data: any) => {
      console.log("Certificate request submitted successfully:", data);
      // Reset form
      setFormData((prev) => ({
        ...prev,
        caId: "",
        cn: "",
        ou: "",
        c: "",
        st: "",
        l: "",
        emailAddress: "",
        title: "",
        validityDays: 30,
        keyUsage: ["digitalSignature", "keyEncipherment"],
        extendedKeyUsage: ["clientAuth", "emailProtection"],
      }));
      setSelectedCA(null);
      setValidationErrors({});
      setCertificateToDownload(data.data.certificateId);
    },
    onError: (error: any) => {
      console.error("Error submitting certificate request:", error);
    },
  });

  const createExternalCertificateRequestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log(data);
      const response = await api.post(
        `${VITE_API_BASE_URL}/api/certificates/ca-external-issued`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: async (data: any) => {
      console.log(data);
      // Reset form
      setFormData((prev) => ({
        ...prev,
        caId: "",
        cn: "",
        ou: "",
        c: "",
        st: "",
        l: "",
        emailAddress: "",
        title: "",
        validityDays: 30,
        keyUsage: ["digitalSignature", "keyEncipherment"],
        extendedKeyUsage: ["clientAuth", "emailProtection"],
      }));
      setSelectedCA(null);
      setValidationErrors({});
      await certificateApi.downloadPem(data.certificateId);
    },
    onError: () => {
      console.log("Error");
    },
  });

  useEffect(() => {
    if (
      createCertificateRequestMutation.isSuccess ||
      createExternalCertificateRequestMutation.isSuccess
    ) {
      setLastStatus("success");
    } else if (
      createCertificateRequestMutation.isError ||
      createExternalCertificateRequestMutation.isError
    ) {
      setLastStatus("error");
    }
  }, [
    createCertificateRequestMutation.isSuccess,
    createExternalCertificateRequestMutation.isSuccess,
    createCertificateRequestMutation.isError,
    createExternalCertificateRequestMutation.isError,
  ]);
  const validateExternalForm = () => {
    const errors: FormErrors = {};

    if (!formData.caId) errors.caId = "CA ID is required";
    if (!formData.subjectId) errors.subjectId = "Subject ID is required";
    if (!uploadedFile?.name) errors.uploadedFile = "PEM file is required";
    if (!formData.validityDays || formData.validityDays < 1) {
      errors.validityDays = "Valid days must be at least 1";
    }

    console.log(errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExternalCSRSubmit = () => {
    // validate form
    const valid = validateExternalForm();
    if (!valid) {
      return;
    }
    const requestData = new FormData();
    requestData.append("caId", formData.caId);
    requestData.append("subjectId", formData.subjectId);
    requestData.append("validityDays", formData.validityDays.toString());
    requestData.append("keyUsage", JSON.stringify(formData.keyUsage));
    requestData.append(
      "extendedKeyUsage",
      JSON.stringify(formData.extendedKeyUsage)
    );
    requestData.append("csr", uploadedFile!);

    createExternalCertificateRequestMutation.mutate(requestData);
  };

  const handleCAChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const caId = e.target.value;
    const ca =
      (certificateAuthorities as any)?.find(
        (ca: CertificateAuthority) => ca.id === caId
      ) || null;
    setSelectedCA(ca);
    setValidationErrors({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "validityDays" ? Number(value) : value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    try {
      await dynamicSchema.validate(formData, { abortEarly: false });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    // Filter out empty optional fields
    const requestData: Partial<CertificateRequestData> = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => {
        if (
          key === "caId" ||
          key === "validityDays" ||
          key === "keyUsage" ||
          key === "extendedKeyUsage"
        ) {
          return true;
        }
        if (selectedCA?.requiredFields.includes(key)) {
          return true;
        }
        return typeof value === "string" ? value.trim() !== "" : value !== 0;
      })
    );
    createCertificateRequestMutation.mutate(requestData);
  };

  const isFieldRequired = (fieldName: string): boolean => {
    return selectedCA?.requiredFields.includes(fieldName) || false;
  };

  const isFieldVisible = (fieldName: string): boolean => {
    if (!selectedCA) return false;
    return (
      selectedCA.requiredFields.includes(fieldName) ||
      selectedCA.optionalFields.includes(fieldName)
    );
  };

  const inputClasses = (fieldName: string): string =>
    `w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
      validationErrors[fieldName]
        ? "border-red-500 bg-red-50"
        : "border-gray-300 hover:border-gray-400"
    }`;

  const labelClasses: string = "block text-sm font-medium text-white mb-2";
  const errorClasses: string = "text-red-500 text-sm mt-1";
  const isLoading: boolean = createCertificateRequestMutation.isPending;
  const submitError = createCertificateRequestMutation.error;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full backdrop-blur-sm max-w-2xl bg-slate-800 rounded-xl shadow-xl border border-gray-200">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center bg-blue-600 border-blue-600 border-2  w-16 h-16 rounded-full mb-4">
                <lucideReact.ShieldCheck className="w-10 h-10 text-white"></lucideReact.ShieldCheck>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                Generate Your Certificate
              </h1>
              <p className="text-gray-300">
                Generate a personal digital certificate for secure
                communications
              </p>
            </div>

            {lastStatus === "success" ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-green-700 font-medium">
                    Certificate request submitted successfully!
                  </p>
                </div>
              </div>
            ) : lastStatus === "error" ? (
              <div className="mb-6 p-4 bg-green-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="inline-flex items-center justify-center w-5 h-5 bg-red-600 rounded-full mr-3">
                    <X className="w-4 h-4 text-red-50" />
                  </div>
                  <p className="text-red-700 font-medium">
                    Certificate request creation failed!
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              {/* CA Selection */}
              <div>
                <label htmlFor="caId" className={labelClasses}>
                  Certificate Authority <span className="text-red-500">*</span>
                </label>
                <select
                  id="caId"
                  name="caId"
                  value={formData.caId}
                  onChange={handleCAChange}
                  className={inputClasses("caId")}
                  required
                  disabled={loadingCAs}
                >
                  <option value="">
                    {loadingCAs
                      ? "Loading options..."
                      : "Choose certificate type"}
                  </option>
                  {(certificateAuthorities as any)?.map(
                    (ca: CertificateAuthority) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.name} - {ca.description}
                      </option>
                    )
                  )}
                </select>
                {validationErrors.caId && (
                  <p className={errorClasses}>{validationErrors.caId}</p>
                )}
              </div>

              {selectedCA && (
                <>
                  <div className="relative">
                    <div className="flex items-center justify-center mb-6">
                      <button
                        onClick={handleToggle}
                        className="relative w-80 h-16 bg-slate-100 rounded-xl p-1 transition-all duration-300 ease-in-out hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
                        aria-label="Toggle generation mode"
                      >
                        {/* Background Track */}
                        <div className="absolute inset-1 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg"></div>

                        {/* Sliding Indicator */}
                        <div
                          className={`absolute top-1 w-36 h-14  bg-gradient-to-r ${
                            isExternal
                              ? "from-blue-500 to-blue-600 translate-x-40"
                              : "from-blue-500 to-blue-600 translate-x-1"
                          } rounded-lg shadow-lg transition-all duration-300 ease-out transform`}
                        >
                          {/* Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-lg"></div>
                        </div>

                        {/* Text Labels */}
                        <div className="relative z-10 flex h-full">
                          <div className="flex-1 flex items-center justify-center">
                            <span
                              className={`font-semibold transition-colors duration-300 ${
                                !isExternal ? "text-white" : "text-slate-600"
                              }`}
                            >
                              Autogenerate
                            </span>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <span
                              className={`font-semibold transition-colors duration-300 p-4 ${
                                isExternal ? "text-white" : "text-slate-600"
                              }`}
                            >
                              External Generation
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Status Indicator */}
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                            isExternal ? "bg-blue-800" : "bg-blue-500"
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-slate-700">
                          {isExternal
                            ? "External Generation Active"
                            : "Autogeneration Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="mt-8 p-6 bg-slate-50 rounded-xl border-l-4 border-blue-500">
                    <h3 className="font-semibold text-slate-800 mb-2">
                      {isExternal ? "External Generation" : "Autogeneration"}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {isExternal
                        ? "Import existing keys or use external key generation tools. Provides full control over the key creation process."
                        : "Automatically generate secure cryptographic keys using built-in algorithms. Quick and secure for most use cases."}
                    </p>
                  </div>
                </>
              )}

              {selectedCA &&
                (!isExternal ? (
                  <>
                    {/* Certificate Info */}
                    <div className="bg-slate-700 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <lucideReact.InfoIcon className="text-blue-300 me-2 w-6 h-6" />
                        <div>
                          <h3 className="font-medium text-white">
                            {selectedCA.name}
                          </h3>
                          <p className="text-white text-sm mt-1">
                            {selectedCA.description}
                          </p>
                          <p className="text-white text-sm mt-1">
                            Valid for: {selectedCA.minValidityDays} -{" "}
                            {selectedCA.maxValidityDays} days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Validity Period */}
                    <div>
                      <label htmlFor="validityDays" className={labelClasses}>
                        Validity Period (Days){" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        id="validityDays"
                        name="validityDays"
                        value={formData.validityDays}
                        onChange={handleInputChange}
                        min={selectedCA.minValidityDays}
                        max={selectedCA.maxValidityDays}
                        className={inputClasses("validityDays")}
                        required
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Range: {selectedCA.minValidityDays} -{" "}
                        {selectedCA.maxValidityDays} days
                      </p>
                      {validationErrors.validityDays && (
                        <p className={errorClasses}>
                          {validationErrors.validityDays}
                        </p>
                      )}
                    </div>

                    {/* Key Usage Accordion */}
                    <div className="bg-slate-700 rounded-lg border border-slate-600">
                      <button
                        type="button"
                        onClick={() =>
                          setIsKeyUsageAccordionOpen(!isKeyUsageAccordionOpen)
                        }
                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
                      >
                        <div className="flex items-center">
                          <lucideReact.Key className="w-5 h-5 text-blue-400 mr-3" />
                          <span className="text-white font-medium">
                            Key Usage Settings
                          </span>
                        </div>
                        <lucideReact.ChevronDown
                          className={`w-5 h-5 text-white transition-transform duration-200 ${
                            isKeyUsageAccordionOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isKeyUsageAccordionOpen && (
                        <div className="px-6 pb-6">
                          <div className="border-t border-slate-600 pt-4">
                            {/* Key Usage */}
                            <div className="mb-6">
                              <h4 className="text-white font-medium mb-3 flex items-center">
                                <lucideReact.Shield className="w-4 h-4 mr-2 text-blue-400" />
                                Key Usage{" "}
                                <span className="text-red-400 ml-1">*</span>
                              </h4>
                              <p className="text-slate-400 text-sm mb-4">
                                Select how this certificate key can be used
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {keyUsageOptions.map((option) => (
                                  <label
                                    key={option.value}
                                    className="flex items-start space-x-3 p-3 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.keyUsage.includes(
                                        option.value
                                      )}
                                      onChange={(e) =>
                                        handleKeyUsageChange(
                                          option.value,
                                          e.target.checked
                                        )
                                      }
                                      className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <div className="flex-1">
                                      <span className="text-white text-sm font-medium block">
                                        {option.label}
                                      </span>
                                      <span className="text-slate-300 text-xs">
                                        {option.description}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                              {validationErrors.keyUsage && (
                                <p className={errorClasses}>
                                  {validationErrors.keyUsage}
                                </p>
                              )}
                            </div>

                            {/* Extended Key Usage */}
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center">
                                <lucideReact.ShieldCheck className="w-4 h-4 mr-2 text-blue-400" />
                                Extended Key Usage{" "}
                              </h4>
                              <p className="text-slate-400 text-sm mb-4">
                                Select specific purposes for this certificate
                              </p>
                              <div className="grid grid-cols-1 gap-3">
                                {extendedKeyUsageOptions.map((option) => (
                                  <label
                                    key={option.value}
                                    className="flex items-start space-x-3 p-3 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.extendedKeyUsage.includes(
                                        option.value
                                      )}
                                      onChange={(e) =>
                                        handleExtendedKeyUsageChange(
                                          option.value,
                                          e.target.checked
                                        )
                                      }
                                      className="mt-1 w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <div className="flex-1">
                                      <span className="text-white text-sm font-medium block">
                                        {option.label}
                                      </span>
                                      <span className="text-slate-300 text-xs">
                                        {option.description}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                              {validationErrors.extendedKeyUsage && (
                                <p className={errorClasses}>
                                  {validationErrors.extendedKeyUsage}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Basic Information */}
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-4">
                        Your Information
                      </h2>

                      <div className="space-y-4">
                        {/* Common Name */}
                        {isFieldVisible("cn") && (
                          <div>
                            <label htmlFor="cn" className={labelClasses}>
                              Full Name{" "}
                              {isFieldRequired("cn") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              id="cn"
                              name="cn"
                              value={formData.cn}
                              onChange={handleInputChange}
                              placeholder="e.g., John Smith"
                              className={inputClasses("cn")}
                              required={isFieldRequired("cn")}
                            />
                            {validationErrors.cn && (
                              <p className={errorClasses}>
                                {validationErrors.cn}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Email */}
                        {isFieldVisible("emailAddress") && (
                          <div>
                            <label
                              htmlFor="emailAddress"
                              className={labelClasses}
                            >
                              Email Address{" "}
                              {isFieldRequired("emailAddress") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="email"
                              id="emailAddress"
                              name="emailAddress"
                              value={formData.emailAddress}
                              onChange={handleInputChange}
                              placeholder="e.g., john.smith@company.com"
                              className={inputClasses("emailAddress")}
                              required={isFieldRequired("emailAddress")}
                            />
                            {validationErrors.emailAddress && (
                              <p className={errorClasses}>
                                {validationErrors.emailAddress}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Organization */}
                        {isFieldVisible("o") && (
                          <div>
                            <label htmlFor="o" className={labelClasses}>
                              Organization{" "}
                              {isFieldRequired("o") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              disabled
                              type="text"
                              id="o"
                              name="o"
                              value={formData.o}
                              onChange={handleInputChange}
                              placeholder="e.g., Your Company Name"
                              className={inputClasses("o")}
                              required={isFieldRequired("o")}
                            />
                            {validationErrors.o && (
                              <p className={errorClasses}>
                                {validationErrors.o}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Department */}
                        {isFieldVisible("ou") && (
                          <div>
                            <label htmlFor="ou" className={labelClasses}>
                              Department{" "}
                              {isFieldRequired("ou") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              id="ou"
                              name="ou"
                              value={formData.ou}
                              onChange={handleInputChange}
                              placeholder="e.g., IT Department"
                              className={inputClasses("ou")}
                              required={isFieldRequired("ou")}
                            />
                            {validationErrors.ou && (
                              <p className={errorClasses}>
                                {validationErrors.ou}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Job Title */}
                        {isFieldVisible("title") && (
                          <div>
                            <label htmlFor="title" className={labelClasses}>
                              Job Title{" "}
                              {isFieldRequired("title") && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              id="title"
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              placeholder="e.g., Software Developer"
                              className={inputClasses("title")}
                              required={isFieldRequired("title")}
                            />
                            {validationErrors.title && (
                              <p className={errorClasses}>
                                {validationErrors.title}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Location Fields */}
                        {(isFieldVisible("c") ||
                          isFieldVisible("st") ||
                          isFieldVisible("l")) && (
                          <div>
                            <h3 className="text-md font-medium text-gray-800 mb-3">
                              Location (Optional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {isFieldVisible("c") && (
                                <div>
                                  <label htmlFor="c" className={labelClasses}>
                                    Country Code{" "}
                                    {isFieldRequired("c") && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    id="c"
                                    name="c"
                                    value={formData.c}
                                    onChange={handleInputChange}
                                    placeholder="US"
                                    maxLength={2}
                                    className={inputClasses("c")}
                                    style={{ textTransform: "uppercase" }}
                                    required={isFieldRequired("c")}
                                  />
                                  {validationErrors.c && (
                                    <p className={errorClasses}>
                                      {validationErrors.c}
                                    </p>
                                  )}
                                </div>
                              )}

                              {isFieldVisible("st") && (
                                <div>
                                  <label htmlFor="st" className={labelClasses}>
                                    State/Province{" "}
                                    {isFieldRequired("st") && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    id="st"
                                    name="st"
                                    value={formData.st}
                                    onChange={handleInputChange}
                                    placeholder="California"
                                    className={inputClasses("st")}
                                    required={isFieldRequired("st")}
                                  />
                                  {validationErrors.st && (
                                    <p className={errorClasses}>
                                      {validationErrors.st}
                                    </p>
                                  )}
                                </div>
                              )}

                              {isFieldVisible("l") && (
                                <div>
                                  <label htmlFor="l" className={labelClasses}>
                                    City{" "}
                                    {isFieldRequired("l") && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    id="l"
                                    name="l"
                                    value={formData.l}
                                    onChange={handleInputChange}
                                    placeholder="San Francisco"
                                    className={inputClasses("l")}
                                    required={isFieldRequired("l")}
                                  />
                                  {validationErrors.l && (
                                    <p className={errorClasses}>
                                      {validationErrors.l}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      {submitError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-700">
                            Failed to submit certificate request. Please try
                            again.
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Generating Certificate...
                          </div>
                        ) : (
                          "Generate My Certificate"
                        )}
                      </button>

                      <div className="mt-4 text-center">
                        <p className="text-gray-500 text-sm">
                          Your certificate will be generated instantly and
                          available for download
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-700 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <lucideReact.InfoIcon className="text-blue-300 me-2 w-6 h-6" />
                        <div>
                          <h3 className="font-medium text-white">
                            {selectedCA.name}
                          </h3>
                          <p className="text-white text-sm mt-1">
                            {selectedCA.description}
                          </p>
                          <p className="text-white text-sm mt-1">
                            Valid for: {selectedCA.minValidityDays} -{" "}
                            {selectedCA.maxValidityDays} days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Validity Period */}
                    <div>
                      <label htmlFor="validityDays" className={labelClasses}>
                        Validity Period (Days){" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        id="validityDays"
                        name="validityDays"
                        value={formData.validityDays}
                        onChange={handleInputChange}
                        min={selectedCA.minValidityDays}
                        max={selectedCA.maxValidityDays}
                        className={inputClasses("validityDays")}
                        required
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Range: {selectedCA.minValidityDays} -{" "}
                        {selectedCA.maxValidityDays} days
                      </p>
                      {validationErrors.validityDays && (
                        <p className={errorClasses}>
                          {validationErrors.validityDays}
                        </p>
                      )}
                    </div>

                    <FileUpload
                      uploadedFile={uploadedFile}
                      setUploadedFile={setUploadedFile}
                      error={validationErrors.uploadedFile ?? ""}
                      setValidationError={setValidationErrors}
                    />
                    {/* FILE UPLOAD, CA SELECTOR, DURATION SELECTOR */}
                    {/* Action Button */}
                    <button
                      className={`w-full mt-6 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-95 ${"bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"}`}
                      onClick={handleExternalCSRSubmit}
                      disabled={
                        createExternalCertificateRequestMutation.isPending
                      }
                    >
                      {createExternalCertificateRequestMutation.isPending ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        "Generate Certificate"
                      )}
                    </button>
                  </>
                ))}
            </div>
          </div>
        </div>
      </div>

      <CertificateDownloadModal
        isOpen={certificateToDownload != null}
        onClose={() => setCertificateToDownload(null)}
        certificateId={certificateToDownload ?? ""}
        certificateName={`certificate-${certificateToDownload}`}
      />
    </>
  );
};
