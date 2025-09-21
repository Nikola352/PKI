import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from "formik";
import * as Yup from "yup";
import {
  Mail,
  Shield,
  AlertCircle,
  User,
  Building,
  CheckCircle,
} from "lucide-react";
import api from "@/api/axios-config";
import type { AxiosError } from "axios";
import type { ErrorResponse } from "@/model/error.response";

interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
}

interface InviteResponse {
  message: string;
  userId: string;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email")
    .required("Email is required"),
  firstName: Yup.string().required("First name is required").trim(),
  lastName: Yup.string().required("Last name is required").trim(),
  organization: Yup.string().required("Organization is required").trim(),
});

export const Invite: React.FC = () => {
  const [invitationSuccess, setInvitationSuccess] = useState(false);

  const inviteMutation = useMutation<
    InviteResponse,
    AxiosError,
    InviteFormData
  >({
    mutationFn: async (data: InviteFormData) => {
      return (await api.post("/api/auth/invite", data)).data;
    },
    onSuccess: () => {
      setInvitationSuccess(true);
    },
    onError: (err) => {
      const error = err.response?.data as ErrorResponse | undefined;
      console.error(error?.message ?? "Connection error");
    },
  });

  const initialValues: InviteFormData = {
    email: "",
    firstName: "",
    lastName: "",
    organization: "",
  };

  const handleSubmit = (
    values: InviteFormData,
    { resetForm }: FormikHelpers<InviteFormData>
  ) => {
    inviteMutation.mutate(values, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  return (
    <>
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
            <p className="text-slate-400">Invite CA User</p>
          </div>

          {/* Invite Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched }) => (
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

                  {/* Invite Error */}
                  {inviteMutation.isError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-center text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Invitation failed. Please check your information and try
                        again.
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                  >
                    {inviteMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending invitation...
                      </div>
                    ) : (
                      "Invite"
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {invitationSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Invitation Sent!
              </h3>
              <p className="text-slate-400 mb-6">
                The invitation has been sent successfully. The user will receive
                an email with instructions to join.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setInvitationSuccess(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  Close
                </button>
                <button
                  onClick={() => setInvitationSuccess(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Invite Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Invite;
