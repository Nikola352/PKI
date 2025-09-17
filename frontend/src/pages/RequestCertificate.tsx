import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as yup from "yup";
import api from "@/api/axios-config";
import { useNavigate, useParams } from "react-router";

const { VITE_API_BASE_URL } = import.meta.env;
interface CAUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
}
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
  "street",
  "emailAddress",
  "serialNumber",
  "title",
  "givenName",
  "surname",
  "initials",
  "pseudonym",
  "generationQualifier",
];
interface CertificateRequestData {
  subjectId: string;
  caId: string;
  cn: string; // Common Name (required)
  o: string; // Organization
  ou: string; // Organizational Unit
  c: string; // Country
  st: string; // State/Province
  l: string; // Locality/City
  street: string; // Street Address
  emailAddress: string; // Email Address
  serialNumber: string; // Serial Number
  title: string; // Title
  givenName: string; // Given Name
  surname: string; // Surname
  initials: string; // Initials
  pseudonym: string; // Pseudonym
  generationQualifier: string; // Generation Qualifier
  validityDays: number; // Certificate validity in days
}

interface FormErrors {
  [key: string]: string;
}

const createCertificateRequest = async (
  data: Partial<CertificateRequestData>
): Promise<any> => {
  const response = await api.post<string>(
    `${VITE_API_BASE_URL}/api/certificates/ca-issued`,
    data
  );
  console.log(response.data);
  return response.data;
};

const fetchCertificateAuthorities = async (
  userId: string
): Promise<CertificateAuthority[]> => {
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
};

export const RequestCACertificate: React.FC = () => {
  const navigate = useNavigate();
  const { caId } = useParams();
  const [selectedCA, setSelectedCA] = useState<CertificateAuthority | null>(
    null
  );
  useEffect(() => {
    if (!caId) return;
    api.get<CAUser>(`${VITE_API_BASE_URL}/api/users/${caId}`).then((res) => {
      setCaUser(res.data);
    });
  }, []);
  const [caUser, setCaUser] = useState<CAUser | null>(null);
  const [formData, setFormData] = useState<CertificateRequestData>({
    subjectId: caId ?? "",
    caId: "",
    cn: "",
    o: "",
    ou: "",
    c: "",
    st: "",
    l: "",
    street: "",
    emailAddress: "",
    serialNumber: "",
    title: "",
    givenName: "",
    surname: "",
    initials: "",
    pseudonym: "",
    generationQualifier: "",
    validityDays: 365,
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [dynamicSchema, setDynamicSchema] = useState<yup.ObjectSchema<any>>(
    yup.object()
  );

  // Fetch available CAs
  const { data: certificateAuthorities, isLoading: loadingCAs } = useQuery({
    queryKey: ["certificate-authorities", caId],
    queryFn: () => fetchCertificateAuthorities(caId ?? ""),
    enabled: Boolean(caId),
  });
  useEffect(() => {
    if (certificateAuthorities && certificateAuthorities.length === 0)
      navigate("/issue-self-signed/" + caId);
  }, [certificateAuthorities, navigate]);
  // Update form when CA is selected
  useEffect(() => {
    console.log(caUser);
    if (selectedCA) {
      setFormData((prev) => ({
        ...prev,
        subjectId: caUser?.id ?? "",
        caId: selectedCA.id,
        o: caUser?.organization ?? "",
        emailAddress: caUser?.email ?? "",
        validityDays: selectedCA.defaultValidityDays,
      }));

      // Create dynamic validation schema based on CA requirements
      const schemaShape: any = {
        caId: yup.string().required("Certificate Authority is required"),
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

      // Add required fields
      selectedCA.requiredFields.forEach((field) => {
        switch (field) {
          case "cn":
            schemaShape.cn = yup
              .string()
              .required("Common Name (CN) is required")
              .min(1, "Common Name cannot be empty")
              .max(64, "Common Name cannot exceed 64 characters");
            break;
          case "o":
            schemaShape.o = yup
              .string()
              .required("Organization is required")
              .max(64, "Organization cannot exceed 64 characters");
            break;
          case "ou":
            schemaShape.ou = yup
              .string()
              .required("Organizational Unit is required")
              .max(64, "Organizational Unit cannot exceed 64 characters");
            break;
          case "c":
            schemaShape.c = yup
              .string()
              .required("Country is required")
              .length(2, "Country code must be exactly 2 characters")
              .matches(
                /^[A-Z]{2}$/,
                "Country code must contain only uppercase letters"
              );
            break;
          case "st":
            schemaShape.st = yup
              .string()
              .required("State/Province is required")
              .max(128, "State/Province cannot exceed 128 characters");
            break;
          case "l":
            schemaShape.l = yup
              .string()
              .required("Locality is required")
              .max(128, "Locality cannot exceed 128 characters");
            break;
          case "emailAddress":
            schemaShape.emailAddress = yup
              .string()
              .required("Email Address is required")
              .email("Please enter a valid email address")
              .max(255, "Email cannot exceed 255 characters");
            break;
          case "title":
            schemaShape.title = yup
              .string()
              .required("Title is required")
              .max(64, "Title cannot exceed 64 characters");
            break;
          case "givenName":
            schemaShape.givenName = yup
              .string()
              .required("Given Name is required")
              .max(64, "Given Name cannot exceed 64 characters");
            break;
          case "surname":
            schemaShape.surname = yup
              .string()
              .required("Surname is required")
              .max(64, "Surname cannot exceed 64 characters");
            break;
        }
      });

      // Add optional field validations
      if (
        !selectedCA.requiredFields.includes("o") &&
        selectedCA.optionalFields.includes("o")
      ) {
        schemaShape.o = yup
          .string()
          .max(64, "Organization cannot exceed 64 characters");
      }
      if (
        !selectedCA.requiredFields.includes("ou") &&
        selectedCA.optionalFields.includes("ou")
      ) {
        schemaShape.ou = yup
          .string()
          .max(64, "Organizational Unit cannot exceed 64 characters");
      }
      if (
        !selectedCA.requiredFields.includes("c") &&
        selectedCA.optionalFields.includes("c")
      ) {
        schemaShape.c = yup
          .string()
          .length(2, "Country code must be exactly 2 characters")
          .matches(
            /^[A-Z]{2}$/,
            "Country code must contain only uppercase letters"
          );
      }
      if (
        !selectedCA.requiredFields.includes("st") &&
        selectedCA.optionalFields.includes("st")
      ) {
        schemaShape.st = yup
          .string()
          .max(128, "State/Province cannot exceed 128 characters");
      }
      if (
        !selectedCA.requiredFields.includes("l") &&
        selectedCA.optionalFields.includes("l")
      ) {
        schemaShape.l = yup
          .string()
          .max(128, "Locality cannot exceed 128 characters");
      }
      if (
        !selectedCA.requiredFields.includes("emailAddress") &&
        selectedCA.optionalFields.includes("emailAddress")
      ) {
        schemaShape.emailAddress = yup
          .string()
          .email("Please enter a valid email address")
          .max(255, "Email cannot exceed 255 characters");
      }

      // Add remaining optional validations
      schemaShape.street = yup
        .string()
        .max(255, "Street Address cannot exceed 255 characters");
      schemaShape.serialNumber = yup
        .string()
        .matches(/^[0-9]*$/, "Serial Number must contain only digits")
        .max(20, "Serial Number cannot exceed 20 digits");
      schemaShape.initials = yup
        .string()
        .max(5, "Initials cannot exceed 5 characters");
      schemaShape.pseudonym = yup
        .string()
        .max(64, "Pseudonym cannot exceed 64 characters");
      schemaShape.generationQualifier = yup
        .string()
        .max(10, "Generation Qualifier cannot exceed 10 characters");
      if (
        !selectedCA.requiredFields.includes("title") &&
        selectedCA.optionalFields.includes("title")
      ) {
        schemaShape.title = yup
          .string()
          .max(64, "Title cannot exceed 64 characters");
      }
      if (
        !selectedCA.requiredFields.includes("givenName") &&
        selectedCA.optionalFields.includes("givenName")
      ) {
        schemaShape.givenName = yup
          .string()
          .max(64, "Given Name cannot exceed 64 characters");
      }
      if (
        !selectedCA.requiredFields.includes("surname") &&
        selectedCA.optionalFields.includes("surname")
      ) {
        schemaShape.surname = yup
          .string()
          .max(64, "Surname cannot exceed 64 characters");
      }

      setDynamicSchema(yup.object().shape(schemaShape));
    }
  }, [selectedCA]);

  const createCertificateRequestMutation = useMutation({
    mutationFn: createCertificateRequest,
    onSuccess: (data) => {
      console.log("Certificate request submitted successfully:", data);
      // Reset form
      setFormData({
        subjectId: "",
        caId: "",
        cn: "",
        o: "",
        ou: "",
        c: "",
        st: "",
        l: "",
        street: "",
        emailAddress: "",
        serialNumber: "",
        title: "",
        givenName: "",
        surname: "",
        initials: "",
        pseudonym: "",
        generationQualifier: "",
        validityDays: 365,
      });
      setSelectedCA(null);
      setValidationErrors({});
      navigate("/view-users");
    },
    onError: (error) => {
      console.error("Error submitting certificate request:", error);
    },
  });
  const handleCAChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const caId = e.target.value;
    const ca = certificateAuthorities?.find((ca) => ca.id === caId) || null;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    const requestData: Partial<CertificateRequestData> = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => {
        if (key === "caId" || key === "validityDays" || key === "keyType") {
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

  const inputClasses = (fieldName: string): string =>
    `w-full px-4 py-2 bg-slate-700 border ${
      validationErrors[fieldName] ? "border-red-500" : "border-slate-600"
    } rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`;

  const labelClasses: string = "block text-sm font-medium text-slate-300 mb-2";
  const errorClasses: string = "text-red-400 text-sm mt-1";

  const isLoading = createCertificateRequestMutation.isPending;
  const submitError = createCertificateRequestMutation.error;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {caUser && (
        <div className="w-full max-w-4xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Request CA-Signed Certificate
            </h1>
            <p className="text-slate-400 mb-8">
              Select a Certificate Authority and request a certificate following
              their policies
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {/* {createCertificateRequestMutation.isSuccess && (
              <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg">
                <p className="text-green-300">
                  {selectedCA?.policies.autoIssue
                    ? "Certificate request submitted and approved automatically!"
                    : "Certificate request submitted successfully! It will be reviewed for approval."}
                </p>
              </div>
            )} */}

              {/* CA Selection */}
              <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Select Certificate Authority
                </h2>

                <div>
                  <label htmlFor="caId" className={labelClasses}>
                    Certificate Authority{" "}
                    <span className="text-red-400">*</span>
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
                        ? "Loading CAs..."
                        : "Select a Certificate Authority"}
                    </option>
                    {certificateAuthorities?.map((ca) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.caId && (
                    <p className={errorClasses}>{validationErrors.caId}</p>
                  )}
                </div>

                {/* CA Information Display */}
                {selectedCA && (
                  <div className="mt-6 p-4 bg-slate-600 rounded-lg border border-slate-500">
                    <h3 className="text-white font-semibold mb-2">
                      {selectedCA.name}
                    </h3>
                    <p className="text-slate-300 text-sm mb-3">
                      {selectedCA.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Validity Range:</span>
                        <span className="text-white ml-2">
                          {selectedCA.minValidityDays} -{" "}
                          {selectedCA.maxValidityDays} days
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Approval:</span>
                        {/* <span
                        className={`ml-2 ${
                          selectedCA.policies.requiresApproval
                            ? "text-yellow-300"
                            : "text-green-300"
                        }`}
                      >
                        {selectedCA.policies.requiresApproval
                          ? "Manual Review"
                          : "Auto-Approved"}
                      </span> */}
                      </div>
                      <div>
                        {/* <span className="text-slate-400">Max Certificates:</span>
                      <span className="text-white ml-2">
                        {selectedCA.policies.maxCertificatesPerUser}
                      </span> */}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedCA && (
                <>
                  {/* Certificate Configuration */}
                  <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Certificate Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                  </div>

                  {/* Subject Information */}
                  <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Subject Information
                    </h2>

                    <div className="space-y-6">
                      {/* Common Name - Always show if visible */}
                      {isFieldVisible("cn") && (
                        <div>
                          <label htmlFor="cn" className={labelClasses}>
                            Common Name (CN){" "}
                            {isFieldRequired("cn") && (
                              <span className="text-red-400">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            id="cn"
                            name="cn"
                            value={formData.cn}
                            onChange={handleInputChange}
                            placeholder="e.g., John Doe or example.com"
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

                      {/* Organization Fields */}
                      {(isFieldVisible("o") || isFieldVisible("ou")) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {isFieldVisible("o") && (
                            <div>
                              <label htmlFor="o" className={labelClasses}>
                                Organization (O){" "}
                                {isFieldRequired("o") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="o"
                                name="o"
                                readOnly
                                value={formData.o}
                                onChange={handleInputChange}
                                placeholder="e.g., Acme Corporation"
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

                          {isFieldVisible("ou") && (
                            <div>
                              <label htmlFor="ou" className={labelClasses}>
                                Organizational Unit (OU){" "}
                                {isFieldRequired("ou") && (
                                  <span className="text-red-400">*</span>
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
                        </div>
                      )}

                      {/* Location Fields */}
                      {(isFieldVisible("c") ||
                        isFieldVisible("st") ||
                        isFieldVisible("l")) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {isFieldVisible("c") && (
                            <div>
                              <label htmlFor="c" className={labelClasses}>
                                Country (C){" "}
                                {isFieldRequired("c") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="c"
                                name="c"
                                value={formData.c}
                                onChange={handleInputChange}
                                placeholder="e.g., US"
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
                                State/Province (ST){" "}
                                {isFieldRequired("st") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="st"
                                name="st"
                                value={formData.st}
                                onChange={handleInputChange}
                                placeholder="e.g., California"
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
                                Locality/City (L){" "}
                                {isFieldRequired("l") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="l"
                                name="l"
                                value={formData.l}
                                onChange={handleInputChange}
                                placeholder="e.g., San Francisco"
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
                      )}

                      {/* Personal Information */}
                      {(isFieldVisible("givenName") ||
                        isFieldVisible("surname") ||
                        isFieldVisible("title")) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {isFieldVisible("givenName") && (
                            <div>
                              <label
                                htmlFor="givenName"
                                className={labelClasses}
                              >
                                Given Name{" "}
                                {isFieldRequired("givenName") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="givenName"
                                name="givenName"
                                value={formData.givenName}
                                onChange={handleInputChange}
                                placeholder="e.g., John"
                                className={inputClasses("givenName")}
                                required={isFieldRequired("givenName")}
                              />
                              {validationErrors.givenName && (
                                <p className={errorClasses}>
                                  {validationErrors.givenName}
                                </p>
                              )}
                            </div>
                          )}

                          {isFieldVisible("surname") && (
                            <div>
                              <label htmlFor="surname" className={labelClasses}>
                                Surname{" "}
                                {isFieldRequired("surname") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="surname"
                                name="surname"
                                value={formData.surname}
                                onChange={handleInputChange}
                                placeholder="e.g., Doe"
                                className={inputClasses("surname")}
                                required={isFieldRequired("surname")}
                              />
                              {validationErrors.surname && (
                                <p className={errorClasses}>
                                  {validationErrors.surname}
                                </p>
                              )}
                            </div>
                          )}

                          {isFieldVisible("title") && (
                            <div>
                              <label htmlFor="title" className={labelClasses}>
                                Title{" "}
                                {isFieldRequired("title") && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Software Engineer"
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
                        </div>
                      )}

                      {/* Email Address */}
                      {isFieldVisible("emailAddress") && (
                        <div>
                          <label
                            htmlFor="emailAddress"
                            className={labelClasses}
                          >
                            Email Address{" "}
                            {isFieldRequired("emailAddress") && (
                              <span className="text-red-400">*</span>
                            )}
                          </label>
                          <input
                            type="email"
                            id="emailAddress"
                            name="emailAddress"
                            readOnly
                            value={formData.emailAddress}
                            onChange={handleInputChange}
                            placeholder="e.g., john.doe@example.com"
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

                      {/* Additional Optional Fields */}
                      {(isFieldVisible("street") ||
                        selectedCA.optionalFields.includes("initials") ||
                        selectedCA.optionalFields.includes("pseudonym") ||
                        selectedCA.optionalFields.includes(
                          "generationQualifier"
                        ) ||
                        selectedCA.optionalFields.includes("serialNumber")) && (
                        <div className="border-t border-slate-600 pt-6">
                          <h3 className="text-md font-medium text-slate-200 mb-4">
                            Additional Information
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isFieldVisible("street") && (
                              <div>
                                <label
                                  htmlFor="street"
                                  className={labelClasses}
                                >
                                  Street Address
                                </label>
                                <input
                                  type="text"
                                  id="street"
                                  name="street"
                                  value={formData.street}
                                  onChange={handleInputChange}
                                  placeholder="e.g., 123 Main Street"
                                  className={inputClasses("street")}
                                />
                                {validationErrors.street && (
                                  <p className={errorClasses}>
                                    {validationErrors.street}
                                  </p>
                                )}
                              </div>
                            )}

                            {selectedCA.optionalFields.includes(
                              "serialNumber"
                            ) && (
                              <div>
                                <label
                                  htmlFor="serialNumber"
                                  className={labelClasses}
                                >
                                  Serial Number
                                </label>
                                <input
                                  type="text"
                                  id="serialNumber"
                                  name="serialNumber"
                                  value={formData.serialNumber}
                                  onChange={handleInputChange}
                                  placeholder="e.g., 123456789"
                                  className={inputClasses("serialNumber")}
                                />
                                {validationErrors.serialNumber && (
                                  <p className={errorClasses}>
                                    {validationErrors.serialNumber}
                                  </p>
                                )}
                              </div>
                            )}

                            {selectedCA.optionalFields.includes("initials") && (
                              <div>
                                <label
                                  htmlFor="initials"
                                  className={labelClasses}
                                >
                                  Initials
                                </label>
                                <input
                                  type="text"
                                  id="initials"
                                  name="initials"
                                  value={formData.initials}
                                  onChange={handleInputChange}
                                  placeholder="e.g., J.D."
                                  className={inputClasses("initials")}
                                />
                                {validationErrors.initials && (
                                  <p className={errorClasses}>
                                    {validationErrors.initials}
                                  </p>
                                )}
                              </div>
                            )}

                            {selectedCA.optionalFields.includes(
                              "pseudonym"
                            ) && (
                              <div>
                                <label
                                  htmlFor="pseudonym"
                                  className={labelClasses}
                                >
                                  Pseudonym
                                </label>
                                <input
                                  type="text"
                                  id="pseudonym"
                                  name="pseudonym"
                                  value={formData.pseudonym}
                                  onChange={handleInputChange}
                                  placeholder="e.g., JDoe"
                                  className={inputClasses("pseudonym")}
                                />
                                {validationErrors.pseudonym && (
                                  <p className={errorClasses}>
                                    {validationErrors.pseudonym}
                                  </p>
                                )}
                              </div>
                            )}

                            {selectedCA.optionalFields.includes(
                              "generationQualifier"
                            ) && (
                              <div>
                                <label
                                  htmlFor="generationQualifier"
                                  className={labelClasses}
                                >
                                  Generation Qualifier
                                </label>
                                <input
                                  type="text"
                                  id="generationQualifier"
                                  name="generationQualifier"
                                  value={formData.generationQualifier}
                                  onChange={handleInputChange}
                                  placeholder="e.g., Jr., Sr., III"
                                  className={inputClasses(
                                    "generationQualifier"
                                  )}
                                />
                                {validationErrors.generationQualifier && (
                                  <p className={errorClasses}>
                                    {validationErrors.generationQualifier}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button and Errors */}
                  <div className="pt-6">
                    {submitError && (
                      <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg">
                        <p className="text-red-300">
                          Failed to submit certificate request:{" "}
                          {submitError.message || "Please try again."}
                        </p>
                      </div>
                    )}

                    {/* {selectedCA.policies.requiresApproval && (
                    <div className="mb-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
                      <p className="text-yellow-300">
                        <strong>Note:</strong> This CA requires manual approval.
                        Your request will be reviewed before the certificate is
                        issued.
                      </p>
                    </div>
                  )} */}

                    <button
                      type="submit"
                      disabled={isLoading || !selectedCA}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {/* {selectedCA?.policies.requiresApproval
                          ? "Submitting Request..."
                          : "Creating Certificate..."} */}
                          "Submitting..."
                        </div>
                      ) : (
                        <>
                          {/* {selectedCA?.policies.requiresApproval
                          ? "Submit Certificate Request"
                          : "Request Certificate"}
                        {selectedCA?.policies.autoIssue && " (Auto-Approved)"} */}
                          "Create cert"
                        </>
                      )}
                    </button>

                    {selectedCA && (
                      <div className="mt-4 text-center">
                        {/* <p className="text-slate-400 text-sm">
                        You can request up to{" "}
                        {selectedCA.policies.maxCertificatesPerUser}{" "}
                        certificates from this CA
                      </p> */}
                      </div>
                    )}
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
