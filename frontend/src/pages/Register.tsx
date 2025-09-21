import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  User,
  Building,
  CheckCircle,
  Clock,
} from "lucide-react";
import api from "@/api/axios-config";
import { useNavigate } from "react-router";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/model/error.response";
import usePasswordStrength from "@/hooks/usePasswordStrength";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization: string;
}

interface RegisterResponse {
  message: string;
  userId: string;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  firstName: Yup.string().required("First name is required").trim(),
  lastName: Yup.string().required("Last name is required").trim(),
  organization: Yup.string().required("Organization is required").trim(),
});

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const {
    shouldShow: showPwStrengthIndicator,
    setPassword,
    text: pwStrengthText,
    textColor: pwStrengthTextColor,
    backgroundColor: pwStrengthBgColor,
    percentage: pwStrengthPercent,
  } = usePasswordStrength();

  const registerMutation = useMutation<
    RegisterResponse,
    AxiosError,
    RegisterFormData
  >({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      return (await api.post("/api/auth/register", registerData)).data;
    },
    onSuccess: () => {
      setRegistrationSuccess(true);
    },
    onError: (err) => {
      const error = err.response?.data as ErrorResponse | undefined;
      console.error(error?.message ?? "Connection error");
    },
  });

  const initialValues: RegisterFormData = {
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    organization: "",
  };

  const handleSubmit = (values: RegisterFormData) => {
    registerMutation.mutate(values);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Registration Successful!
            </h1>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center text-green-400 text-sm mb-2">
                <Mail className="w-4 h-4 mr-2" />
                Activation link sent to your email
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                Link expires in 24 hours
              </div>
            </div>
            <p className="text-slate-400 mb-6">
              Please check your email and click the activation link to complete
              your registration.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Public Key Infrastructure
          </h1>
          <p className="text-slate-400">Create your account</p>
        </div>

        {/* Register Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form className="space-y-6">
                {/* First Name & Last Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name Field */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <Field
                        id="firstName"
                        name="firstName"
                        type="text"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.firstName && touched.firstName
                            ? "border-red-500"
                            : "border-slate-600"
                        }`}
                        placeholder="First name"
                        autoComplete="given-name"
                      />
                    </div>
                    <ErrorMessage name="firstName">
                      {(msg) => (
                        <div className="flex items-center mt-2 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {msg}
                        </div>
                      )}
                    </ErrorMessage>
                  </div>

                  {/* Last Name Field */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <Field
                        id="lastName"
                        name="lastName"
                        type="text"
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.lastName && touched.lastName
                            ? "border-red-500"
                            : "border-slate-600"
                        }`}
                        placeholder="Last name"
                        autoComplete="family-name"
                      />
                    </div>
                    <ErrorMessage name="lastName">
                      {(msg) => (
                        <div className="flex items-center mt-2 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {msg}
                        </div>
                      )}
                    </ErrorMessage>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.email && touched.email
                          ? "border-red-500"
                          : "border-slate-600"
                      }`}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                  <ErrorMessage name="email">
                    {(msg) => (
                      <div className="flex items-center mt-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {msg}
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Organization Field */}
                <div>
                  <label
                    htmlFor="organization"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Organization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-slate-400" />
                    </div>
                    <Field
                      id="organization"
                      name="organization"
                      type="text"
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.organization && touched.organization
                          ? "border-red-500"
                          : "border-slate-600"
                      }`}
                      placeholder="Enter your organization"
                      autoComplete="organization"
                    />
                  </div>
                  <ErrorMessage name="organization">
                    {(msg) => (
                      <div className="flex items-center mt-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {msg}
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-slate-600"
                      }`}
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFieldValue("password", e.target.value);
                        setPassword(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {showPwStrengthIndicator && values.password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">
                          Password strength:
                        </span>
                        <span className={`text-xs ${pwStrengthTextColor}`}>
                          {pwStrengthText}
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${pwStrengthBgColor}`}
                          style={{
                            width: `${pwStrengthPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <ErrorMessage name="password">
                    {(msg) => (
                      <div className="flex items-center mt-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {msg}
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-500"
                          : "border-slate-600"
                      }`}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword">
                    {(msg) => (
                      <div className="flex items-center mt-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {msg}
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Register Error */}
                {registerMutation.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Registration failed. Please check your information and try
                      again.
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-slate-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default Register;
