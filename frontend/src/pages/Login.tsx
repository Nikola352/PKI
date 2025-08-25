import React, { useState, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import type { User } from "@/model/user";
import api from "@/api/axios-config";
import { UserContext, type UserContextType } from "@/context/UserContext";
import { useNavigate } from "react-router";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/model/error.response";

interface LoginFormData {
  email: string;
  password: string;
}

export type LoginResponse = User & {
  accessToken: string;
};

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { logIn } = useContext(UserContext) as UserContextType;
  const [showPassword, setShowPassword] = useState(false);

  // Login mutation using TanStack Query
  const loginMutation = useMutation<LoginResponse, AxiosError, LoginFormData>({
    mutationFn: async (data: LoginFormData) => {
      return (await api.post("/api/auth/login", data)).data;
    },
    onSuccess: async (data) => {
      await logIn(data);
      navigate("/");
    },
    onError: (err) => {
      const error = err.response?.data as ErrorResponse | undefined;
      console.error(error?.message ?? "Connection error");
    },
  });

  const initialValues: LoginFormData = {
    email: "",
    password: "",
  };

  const handleSubmit = (values: LoginFormData) => {
    loginMutation.mutate(values);
  };

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
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
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
                      autoComplete="current-password"
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
                  <ErrorMessage name="password">
                    {(msg) => (
                      <div className="flex items-center mt-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {msg}
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Login Error */}
                {loginMutation.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Login failed. Please check your credentials and try again.
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-slate-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Sign up
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

export default Login;
