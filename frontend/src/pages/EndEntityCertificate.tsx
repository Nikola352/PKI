import { useState, useEffect, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as yup from "yup";
import * as lucideReact from "lucide-react";
import api from "@/api/axios-config";
import { UserContext } from "@/context/UserContext";
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
  get: async (userId: string) => {
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
  download: async (certId: string) => {
    const response = await api.get(
      `${VITE_API_BASE_URL}/api/certificates/${certId}/download`,
      {
        responseType: "blob",
      }
    );
    const blob = new Blob([response.data], { type: "application/x-pem-file" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `certificate-${certId}.pem`; // customize filename if needed
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
}

interface FormErrors {
  [key: string]: string;
}

export const EndEntityCertificateForm: React.FC = () => {
  const userContext = useContext(UserContext);
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
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [dynamicSchema, setDynamicSchema] = useState<yup.ObjectSchema<any>>(
    yup.object()
  );

  // Fetch available CAs
  const { data: certificateAuthorities, isLoading: loadingCAs } = useQuery({
    queryKey: ["certificate-authorities"],
    queryFn: () => certificateApi.get(userContext?.currentUser?.id ?? ""),
  });

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
      setFormData({
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
      });
      setSelectedCA(null);
      setValidationErrors({});
      await certificateApi.download(data.data.certificateId);
    },
    onError: (error: any) => {
      console.error("Error submitting certificate request:", error);
    },
  });

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
        if (key === "caId" || key === "validityDays") {
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
              Generate a personal digital certificate for secure communications
            </p>
          </div>

          {createCertificateRequestMutation.isSuccess && (
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
          )}

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
                          <p className={errorClasses}>{validationErrors.cn}</p>
                        )}
                      </div>
                    )}

                    {/* Email */}
                    {isFieldVisible("emailAddress") && (
                      <div>
                        <label htmlFor="emailAddress" className={labelClasses}>
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
                          <p className={errorClasses}>{validationErrors.o}</p>
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
                          <p className={errorClasses}>{validationErrors.ou}</p>
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
                        Failed to submit certificate request. Please try again.
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
                      Your certificate will be generated instantly and available
                      for download
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
