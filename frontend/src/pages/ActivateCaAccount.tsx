import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LogIn,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Building,
} from "lucide-react";
import api from "@/api/axios-config";
import usePasswordStrength from "@/hooks/usePasswordStrength";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/model/error.response";

interface VerificationCheckResponse {
  email: string;
  fullName: string;
  organization: string;
}

interface CaVerificationRequest {
  verificationCode: string;
  password: string;
}

interface ActivateFormData {
  password: string;
  confirmPassword: string;
}

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export const ActivateCaAccount: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  const {
    shouldShow: showPwStrengthIndicator,
    setPassword,
    text: pwStrengthText,
    textColor: pwStrengthTextColor,
    backgroundColor: pwStrengthBgColor,
    percentage: pwStrengthPercent,
  } = usePasswordStrength();

  const verificationQuery = useQuery<VerificationCheckResponse, AxiosError>({
    queryKey: ["verification-subject", code],
    queryFn: async () => {
      const response = await api.get("/api/auth/verification-subject", {
        params: { verificationCode: code },
      });
      return response.data;
    },
    enabled: !!code,
  });

  const activateMutation = useMutation<void, AxiosError, CaVerificationRequest>(
    {
      mutationFn: async (data: CaVerificationRequest) => {
        await api.post("/api/auth/activate/ca", data);
      },
      onSuccess: () => {
        setActivationSuccess(true);
      },
      onError: (err) => {
        const error = err.response?.data as ErrorResponse | undefined;
        console.error(error?.message ?? "CA activation failed");
      },
    }
  );

  const initialValues: ActivateFormData = {
    password: "",
    confirmPassword: "",
  };

  const handleSubmit = (values: ActivateFormData) => {
    if (!code) return;
    activateMutation.mutate({
      verificationCode: code,
      password: values.password,
    });
  };

  if (!code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Invalid Activation Link
            </h1>
            <p className="text-slate-400 mb-6">
              The activation link is missing or malformed. Please check your
              email for the correct activation link.
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

  if (verificationQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Public Key Infrastructure
            </h1>
            <p className="text-slate-400">Loading account information</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">
              Loading Account Details
            </h2>
            <p className="text-slate-400">
              Please wait while we verify your invitation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationQuery.isError) {
    const error = verificationQuery.error?.response?.data as
      | ErrorResponse
      | undefined;
    const isExpired = verificationQuery.error?.response?.status === 404;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Public Key Infrastructure
            </h1>
            <p className="text-slate-400">CA account activation</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Invitation Invalid
            </h2>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center text-red-400 text-sm mb-2">
                <AlertCircle className="w-4 h-4 mr-2" />
                {isExpired
                  ? "Invitation Link Invalid or Expired"
                  : "Verification Error"}
              </div>
              <p className="text-red-300 text-sm">
                {error?.message ||
                  "An unexpected error occurred while verifying your invitation."}
              </p>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Public Key Infrastructure
            </h1>
            <p className="text-slate-400">CA account activation</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              CA Account Activated!
            </h2>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm">
                Your Certificate Authority account has been successfully
                activated. You can now sign in to manage certificates and users.
              </p>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In to Your Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form - show verification info and password form
  const verificationData = verificationQuery.data;

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
          <p className="text-slate-400">Activate your CA account</p>
        </div>

        {/* Account Information Display */}
        {verificationData && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-5 h-5 text-slate-400 mr-3" />
                <span className="text-slate-300">
                  {verificationData.fullName}
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-slate-400 mr-3" />
                <span className="text-slate-300">{verificationData.email}</span>
              </div>
              <div className="flex items-center">
                <Building className="w-5 h-5 text-slate-400 mr-3" />
                <span className="text-slate-300">
                  {verificationData.organization}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Password Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">
            Set Your Password
          </h3>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form className="space-y-6">
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

                {/* Activation Error */}
                {activateMutation.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Account activation failed. Please try again or contact
                      support.
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={activateMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  {activateMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Activating Account...
                    </div>
                  ) : (
                    "Activate CA Account"
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-slate-400">
                    Already have an activated account?{" "}
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

export default ActivateCaAccount;
