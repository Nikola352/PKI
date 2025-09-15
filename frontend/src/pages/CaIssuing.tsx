import React, { useState, useEffect } from "react";
import {
  Check,
  User,
  Award,
  ChevronRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import * as yup from "yup";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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

const CAIssuing: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Certificate form state (from your original form)
  const [selectedCA, setSelectedCA] = useState<CertificateAuthority | null>(
    null
  );
  const [formData, setFormData] = useState<CertificateRequestData>({
    subjectId: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Mock user data
  const users: User[] = [
    {
      id: 1,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      role: "Senior Developer",
      organization: "OrgA",
    },
    {
      id: 2,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      role: "Senior Developer",
      organization: "OrgA",
    },
    {
      id: 3,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      role: "Senior Developer",
      organization: "OrgA",
    },
    {
      id: 4,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      role: "Senior Developer",
      organization: "OrgA",
    },
  ];

  // Mock certificate authorities data
  const certificateAuthorities: CertificateAuthority[] = [
    {
      id: "1",
      name: "Employee Certificate CA",
      description: "Standard employee certificates for internal use",
      maxValidityDays: 365,
      minValidityDays: 30,
      defaultValidityDays: 90,
      requiredFields: ["cn", "emailAddress"],
      optionalFields: ["o", "ou", "title"],
    },
    {
      id: "2",
      name: "Server Certificate CA",
      description: "SSL/TLS certificates for servers and applications",
      maxValidityDays: 730,
      minValidityDays: 30,
      defaultValidityDays: 365,
      requiredFields: ["cn", "o"],
      optionalFields: ["ou", "c", "st", "l"],
    },
    {
      id: "3",
      name: "Code Signing CA",
      description: "Code signing certificates for software distribution",
      maxValidityDays: 1095,
      minValidityDays: 365,
      defaultValidityDays: 730,
      requiredFields: ["cn", "emailAddress", "o"],
      optionalFields: ["ou", "c", "st", "l", "title"],
    },
  ];

  const steps = [
    { number: 1, title: "Select User", icon: User },
    { number: 2, title: "Certificate Details", icon: Award },
  ];

  // Update form when user is selected
  useEffect(() => {
    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        subjectId: selectedUser.id.toString(),
        cn: "",
        emailAddress: selectedUser.email,
        o: "Company Name", // Default organization
        ou: selectedUser.organization,
        title: selectedUser.role,
      }));
    }
  }, [selectedUser]);

  // Update form when CA is selected (from your original logic)
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

  const handleUserSelect = (user: User): void => {
    setSelectedUser(user);
  };

  const handleNextStep = (): void => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCAChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const caId = e.target.value;
    const ca = certificateAuthorities.find((ca) => ca.id === caId) || null;
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

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Issuing certificate:", {
        user: selectedUser,
        certificate: formData,
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Reset after success
      setTimeout(() => {
        setSubmitSuccess(false);
        setCurrentStep(1);
        setSelectedUser(null);
        setSelectedCA(null);
        setFormData({
          subjectId: "",
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
        setValidationErrors({});
      }, 3000);
    }, 2000);
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
        ? "border-red-500"
        : "border-slate-600 hover:border-slate-500"
    }`;

  const labelClasses: string = "block text-sm font-medium text-white mb-2";
  const errorClasses: string = "text-red-400 text-sm mt-1";

  const getUserInitials = (user: User) => {
    return user.firstName.charAt(0) + " " + user.lastName.charAt(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center bg-blue-600 border-blue-600 border-2 w-16 h-16 rounded-full mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            PKI Certificate Management
          </h1>
          <p className="text-slate-300">
            Issue digital certificates to users in your organization
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                  ${
                    currentStep > step.number
                      ? "bg-green-500 border-green-500 text-white"
                      : currentStep === step.number
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-400"
                  }
                `}
                >
                  {currentStep > step.number ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`
                  mt-2 text-sm font-medium
                  ${
                    currentStep >= step.number ? "text-white" : "text-slate-400"
                  }
                `}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  w-24 h-0.5 mx-4 transition-all
                  ${currentStep > step.number ? "bg-green-500" : "bg-slate-600"}
                `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="backdrop-blur-sm bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-lg">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-2" />
                <p className="text-green-300 font-medium">
                  Certificate request submitted successfully!
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">
                Select a User
              </h2>
              <div className="grid grid-cols-1 gap-4 h-128 overflow-y-scroll">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`
                      bg-slate-700 rounded-lg p-6 border-2 cursor-pointer transition-all hover:shadow-lg hover:bg-slate-600
                      ${
                        selectedUser?.id === user.id
                          ? "border-blue-400 shadow-lg ring-2 ring-blue-500/30 bg-slate-600"
                          : "border-slate-600 hover:border-slate-500"
                      }
                    `}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {getUserInitials(user)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {`${user.firstName} ${user.lastName}`}
                        </h3>
                        <p className="text-sm text-slate-300 mb-1">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="bg-slate-600 px-2 py-1 rounded text-slate-200">
                            {user.organization}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">{user.role}</span>
                        </div>
                      </div>
                      {selectedUser?.id === user.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && selectedUser && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">
                Generate Certificate
              </h2>

              {/* Selected User Summary */}
              <div className="bg-slate-700 rounded-lg p-4 mb-8 border border-slate-600">
                <h3 className="font-medium text-white mb-2">
                  Issuing certificate to:
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getUserInitials(selectedUser)}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {`${selectedUser.firstName} ${selectedUser.lastName}`}
                    </p>
                    <p className="text-sm text-slate-300">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* CA Selection */}
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
                  >
                    <option value="">Choose certificate type</option>
                    {certificateAuthorities.map((ca) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.name} - {ca.description}
                      </option>
                    ))}
                  </select>
                  {validationErrors.caId && (
                    <p className={errorClasses}>{validationErrors.caId}</p>
                  )}
                </div>

                {selectedCA && (
                  <>
                    {/* Certificate Info */}
                    <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-start">
                        <Info className="text-blue-400 me-2 w-6 h-6" />
                        <div>
                          <h3 className="font-medium text-white">
                            {selectedCA.name}
                          </h3>
                          <p className="text-slate-300 text-sm mt-1">
                            {selectedCA.description}
                          </p>
                          <p className="text-slate-300 text-sm mt-1">
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
                        Certificate Information
                      </h2>
                      <div className="space-y-4">
                        {/* Common Name */}
                        {isFieldVisible("cn") && (
                          <div>
                            <label htmlFor="cn" className={labelClasses}>
                              Full Name{" "}
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
                                <span className="text-red-400">*</span>
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
                                <span className="text-red-400">*</span>
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

                        {/* Job Title */}
                        {isFieldVisible("title") && (
                          <div>
                            <label htmlFor="title" className={labelClasses}>
                              Job Title{" "}
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
                            <h3 className="text-md font-medium text-slate-300 mb-3">
                              Location (Optional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {isFieldVisible("c") && (
                                <div>
                                  <label htmlFor="c" className={labelClasses}>
                                    Country Code{" "}
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
                                      <span className="text-red-400">*</span>
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
                                      <span className="text-red-400">*</span>
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
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${
                currentStep === 1
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600"
                  : "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600 hover:border-slate-500"
              }
            `}
          >
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNextStep}
              disabled={currentStep === 1 && !selectedUser}
              className={`
                px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all
                ${
                  selectedUser
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                    : "bg-slate-600 text-slate-400 cursor-not-allowed border border-slate-600"
                }
              `}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCA}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Certificate...
                </div>
              ) : (
                "Generate Certificate"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CAIssuing;
