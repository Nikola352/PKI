import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
interface CertificateFormData {
  subjectId: string;
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
  generationQualifier: string; // Generation Qualifier (Jr., Sr., III, etc.)
  validFrom: string; // Certificate valid from date
  validTo: string; // Certificate valid to date
}

interface FormErrors {
  [key: string]: string;
}

const certificateSchema = yup.object().shape({
  cn: yup
    .string()
    .required("Common Name (CN) is required")
    .min(1, "Common Name cannot be empty")
    .max(64, "Common Name cannot exceed 64 characters"),
  o: yup.string().max(64, "Organization cannot exceed 64 characters"),
  ou: yup.string().max(64, "Organizational Unit cannot exceed 64 characters"),
  c: yup
    .string()
    .length(2, "Country code must be exactly 2 characters")
    .matches(/^[A-Z]{2}$/, "Country code must contain only uppercase letters"),
  st: yup.string().max(128, "State/Province cannot exceed 128 characters"),
  l: yup.string().max(128, "Locality cannot exceed 128 characters"),
  street: yup.string().max(255, "Street Address cannot exceed 255 characters"),
  emailAddress: yup
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  serialNumber: yup
    .string()
    .matches(/^[0-9]*$/, "Serial Number must contain only digits")
    .max(20, "Serial Number cannot exceed 20 digits"),
  title: yup.string().max(64, "Title cannot exceed 64 characters"),
  givenName: yup.string().max(64, "Given Name cannot exceed 64 characters"),
  surname: yup.string().max(64, "Surname cannot exceed 64 characters"),
  initials: yup.string().max(5, "Initials cannot exceed 5 characters"),
  pseudonym: yup.string().max(64, "Pseudonym cannot exceed 64 characters"),
  generationQualifier: yup
    .string()
    .max(10, "Generation Qualifier cannot exceed 10 characters"),
  validFrom: yup
    .string()
    .required("Valid From date is required")
    .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid date format"),
  validTo: yup
    .string()
    .required("Valid To date is required")
    .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid date format")
    .test(
      "is-after-valid-from",
      "Valid To must be after Valid From",
      function (value) {
        const { validFrom } = this.parent;
        if (!validFrom || !value) return true;
        return new Date(value) > new Date(validFrom);
      }
    ),
});

const createCertificate = async (
  data: Partial<CertificateFormData>
): Promise<any> => {
  const response = await api.post<string>(
    `${VITE_API_BASE_URL}/api/certificates/self-signed`,
    data
  );
  return response.data;
};

// Helper function to get current date in local datetime-local format
const getCurrentDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to get date one year from now
const getOneYearFromNow = (): string => {
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  const year = oneYear.getFullYear();
  const month = String(oneYear.getMonth() + 1).padStart(2, "0");
  const day = String(oneYear.getDate()).padStart(2, "0");
  const hours = String(oneYear.getHours()).padStart(2, "0");
  const minutes = String(oneYear.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
interface CAUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
}
export const IssueSelfSigned: React.FC = () => {
  const { caId } = useParams();
  const [caUser, setCaUser] = useState<CAUser | null>(null);
  const [formData, setFormData] = useState<CertificateFormData>({
    subjectId: caId ?? "",
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
    validFrom: getCurrentDateTime(),
    validTo: getOneYearFromNow(),
  });
  const navigate = useNavigate();
  useEffect(() => {
    if (!caId) return;
    api
      .get<{ rootExists: boolean; isRegularUser: boolean }>(
        `/api/certificates/check-root/${caId}`
      )
      .then((res) => {
        if (res.data.rootExists || !res.data.isRegularUser)
          api
            .get<CAUser>(`${VITE_API_BASE_URL}/api/users/${caId}`)
            .then((res) => {
              setCaUser(res.data);
              // Update the organization field with the CA user's organization
              setFormData((prev) => ({
                ...prev,
                o: res.data.organization,
              }));
            });
        else navigate("/view-users");
      });
  }, [caId]);

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const createCertificateMutation = useMutation({
    mutationFn: createCertificate,
    onSuccess: (data) => {
      console.log("Certificate created successfully:", data);
      setFormData({
        subjectId: caId ?? "",
        cn: "",
        o: caUser?.organization || "", // Keep the organization value from caUser
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
        validFrom: getCurrentDateTime(),
        validTo: getOneYearFromNow(),
      });
      setValidationErrors({});
      navigate("/view-users");
    },
    onError: (error) => {
      console.error("Error creating certificate:", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    // Prevent changes to the organization field
    if (name === "o") {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      await certificateSchema.validate(formData, { abortEarly: false });
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    const certificateData: Partial<CertificateFormData> = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => {
        // Always include validity dates even if they're empty strings
        if (key === "validFrom" || key === "validTo") {
          return true;
        }
        return value.trim() !== "";
      })
    );

    createCertificateMutation.mutate(certificateData);
  };

  const inputClasses = (fieldName: string): string =>
    `w-full px-4 py-2 bg-slate-700 border ${
      validationErrors[fieldName] ? "border-red-500" : "border-slate-600"
    } rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`;

  const disabledInputClasses = (fieldName: string): string =>
    `w-full px-4 py-2 bg-slate-800 border ${
      validationErrors[fieldName] ? "border-red-500" : "border-slate-600"
    } rounded-lg text-slate-400 placeholder-slate-500 cursor-not-allowed opacity-75`;

  const labelClasses: string = "block text-sm font-medium text-slate-300 mb-2";
  const errorClasses: string = "text-red-400 text-sm mt-1";

  const isLoading = createCertificateMutation.isPending;
  const submitError = createCertificateMutation.error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Issue Self Signed Certificate
          </h1>
          <p className="text-slate-400 mb-8">
            Create a self-signed certificate with X.500 Name attributes
          </p>

          <div onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {createCertificateMutation.isSuccess && (
              <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg">
                <p className="text-green-300">
                  Certificate created successfully!
                </p>
              </div>
            )}

            {/* Required Fields */}
            <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">
                Required Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="cn" className={labelClasses}>
                    Common Name (CN) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="cn"
                    name="cn"
                    value={formData.cn}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe or example.com"
                    className={inputClasses("cn")}
                    required
                  />
                  {validationErrors.cn && (
                    <p className={errorClasses}>{validationErrors.cn}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="validFrom" className={labelClasses}>
                      Valid From <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="validFrom"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                      className={inputClasses("validFrom")}
                      required
                    />
                    {validationErrors.validFrom && (
                      <p className={errorClasses}>
                        {validationErrors.validFrom}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="validTo" className={labelClasses}>
                      Valid To <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="validTo"
                      name="validTo"
                      value={formData.validTo}
                      onChange={handleInputChange}
                      className={inputClasses("validTo")}
                      required
                    />
                    {validationErrors.validTo && (
                      <p className={errorClasses}>{validationErrors.validTo}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Information */}
            <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">
                Organization Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="o" className={labelClasses}>
                    Organization (O)
                    <span className="text-slate-400 text-xs ml-2">
                      (Locked to CA Organization)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="o"
                    name="o"
                    value={formData.o}
                    onChange={handleInputChange}
                    placeholder="Loading organization..."
                    className={disabledInputClasses("o")}
                    disabled
                    readOnly
                  />
                  {validationErrors.o && (
                    <p className={errorClasses}>{validationErrors.o}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ou" className={labelClasses}>
                    Organizational Unit (OU)
                  </label>
                  <input
                    type="text"
                    id="ou"
                    name="ou"
                    value={formData.ou}
                    onChange={handleInputChange}
                    placeholder="e.g., IT Department"
                    className={inputClasses("ou")}
                  />
                  {validationErrors.ou && (
                    <p className={errorClasses}>{validationErrors.ou}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">
                Location Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="c" className={labelClasses}>
                    Country (C)
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
                  />
                  {validationErrors.c && (
                    <p className={errorClasses}>{validationErrors.c}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="st" className={labelClasses}>
                    State/Province (ST)
                  </label>
                  <input
                    type="text"
                    id="st"
                    name="st"
                    value={formData.st}
                    onChange={handleInputChange}
                    placeholder="e.g., California"
                    className={inputClasses("st")}
                  />
                  {validationErrors.st && (
                    <p className={errorClasses}>{validationErrors.st}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="l" className={labelClasses}>
                    Locality/City (L)
                  </label>
                  <input
                    type="text"
                    id="l"
                    name="l"
                    value={formData.l}
                    onChange={handleInputChange}
                    placeholder="e.g., San Francisco"
                    className={inputClasses("l")}
                  />
                  {validationErrors.l && (
                    <p className={errorClasses}>{validationErrors.l}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="street" className={labelClasses}>
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
                    <p className={errorClasses}>{validationErrors.street}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="givenName" className={labelClasses}>
                    Given Name
                  </label>
                  <input
                    type="text"
                    id="givenName"
                    name="givenName"
                    value={formData.givenName}
                    onChange={handleInputChange}
                    placeholder="e.g., John"
                    className={inputClasses("givenName")}
                  />
                  {validationErrors.givenName && (
                    <p className={errorClasses}>{validationErrors.givenName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="surname" className={labelClasses}>
                    Surname
                  </label>
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    placeholder="e.g., Doe"
                    className={inputClasses("surname")}
                  />
                  {validationErrors.surname && (
                    <p className={errorClasses}>{validationErrors.surname}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="initials" className={labelClasses}>
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
                    <p className={errorClasses}>{validationErrors.initials}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="title" className={labelClasses}>
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                    className={inputClasses("title")}
                  />
                  {validationErrors.title && (
                    <p className={errorClasses}>{validationErrors.title}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-slate-750 p-6 rounded-lg border border-slate-600">
              <h2 className="text-lg font-semibold text-white mb-4">
                Additional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emailAddress" className={labelClasses}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    placeholder="e.g., john.doe@example.com"
                    className={inputClasses("emailAddress")}
                  />
                  {validationErrors.emailAddress && (
                    <p className={errorClasses}>
                      {validationErrors.emailAddress}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="serialNumber" className={labelClasses}>
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

                <div>
                  <label htmlFor="pseudonym" className={labelClasses}>
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
                    <p className={errorClasses}>{validationErrors.pseudonym}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="generationQualifier" className={labelClasses}>
                    Generation Qualifier
                  </label>
                  <input
                    type="text"
                    id="generationQualifier"
                    name="generationQualifier"
                    value={formData.generationQualifier}
                    onChange={handleInputChange}
                    placeholder="e.g., Jr., Sr., III"
                    className={inputClasses("generationQualifier")}
                  />
                  {validationErrors.generationQualifier && (
                    <p className={errorClasses}>
                      {validationErrors.generationQualifier}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button and Errors */}
            <div className="pt-6">
              {submitError && (
                <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg">
                  <p className="text-red-300">
                    Failed to create certificate:{" "}
                    {submitError.message || "Please try again."}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Certificate...
                  </div>
                ) : (
                  "Create Self-Signed Certificate"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
