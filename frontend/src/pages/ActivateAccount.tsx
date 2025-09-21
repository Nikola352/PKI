import React, { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LogIn,
} from "lucide-react";
import api from "@/api/axios-config";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/model/error.response";

interface ActivateRequest {
  verificationCode: string;
}

export const ActivateAccount: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  const activateMutation = useMutation<void, AxiosError, ActivateRequest>({
    mutationFn: async (data: ActivateRequest) => {
      await api.post("/api/auth/activate", data);
    },
    onError: (err) => {
      const error = err.response?.data as ErrorResponse | undefined;
      console.error(error?.message ?? "Activation failed");
    },
  });

  useEffect(() => {
    if (code) {
      activateMutation.mutate({ verificationCode: code });
    }
  }, [code]);

  // No code in URL
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

  // Loading state
  if (activateMutation.isPending) {
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
            <p className="text-slate-400">Activating your account</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">
              Activating Account
            </h2>
            <p className="text-slate-400">
              Please wait while we verify your activation code...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (activateMutation.isSuccess) {
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
            <p className="text-slate-400">Account activation</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Account Activated!
            </h2>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm">
                Your account has been successfully activated. You can now sign
                in to access your certificates.
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

  // Error state
  if (activateMutation.isError) {
    const error = activateMutation.error?.response?.data as
      | ErrorResponse
      | undefined;
    const isExpired = activateMutation.error?.response?.status === 404;

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
            <p className="text-slate-400">Account activation</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Activation Failed
            </h2>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center text-red-400 text-sm mb-2">
                <AlertCircle className="w-4 h-4 mr-2" />
                {isExpired
                  ? "Activation Link Invalid or Expired"
                  : "Activation Error"}
              </div>
              <p className="text-red-300 text-sm">
                {error?.message ||
                  "An unexpected error occurred during activation."}
              </p>
            </div>

            {isExpired && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
                <p className="text-slate-300 text-sm">
                  Your activation link may have expired (links are valid for 24
                  hours). Please try registering again or contact support if you
                  continue to have issues.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate("/register")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Register Again
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't happen, but just in case
  return null;
};

export default ActivateAccount;
