import React, { useEffect, useState } from "react";
import {
  Shield,
  Key,
  Lock,
  User,
  FileCheck,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Building,
  Mail,
} from "lucide-react";

import api from "@/api/axios-config";
import { useNavigate } from "react-router";

const { VITE_API_BASE_URL } = import.meta.env;
interface Certificate {
  id: string;
  serialNumber: string;
  issuedDate: string;
  expiryDate: string;
  status: "active" | "expired" | "revoked";
  type: string;
}

interface CAUser {
  id: number;
  name: string;
  email: string;
  organization: string;
  role: string;
  issuedCertificates: number;
  activeCertificates: number;
  certificates: Certificate[];
}

const CAManagementPage: React.FC = () => {
  // Mock data for CA users and their certificates
  const navigate = useNavigate();
  const [caUsers, setCaUsers] = useState<CAUser[]>([]);

  const [selectedUser, setSelectedUser] = useState<CAUser | null>(null);
  const [showCertificates, setShowCertificates] = useState(false);

  const handleUserClick = (user: CAUser | null) => {
    setSelectedUser(user);
    setShowCertificates(true);
  };

  const handleCloseCertificates = () => {
    setShowCertificates(false);
    setSelectedUser(null);
  };

  const handleRemoveCertificate = (userId: number, certificateId: string) => {
    setCaUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              certificates: user.certificates.filter(
                (cert) => cert.id !== certificateId
              ),
              issuedCertificates: user.issuedCertificates - 1,
              activeCertificates: user.certificates.filter(
                (cert) => cert.id !== certificateId && cert.status === "active"
              ).length,
            }
          : user
      )
    );

    // // Update selected user if it's currently displayed
    // if (selectedUser && selectedUser.id === userId) {
    //   setSelectedUser((prevUser) => ({
    //     ...prevUser,
    //     certificates: prevUser.certificates.filter(
    //       (cert: { id: string }) => cert.id !== certificateId
    //     ),
    //     issuedCertificates: prevUser.issuedCertificates - 1,
    //     activeCertificates: prevUser.certificates.filter(
    //       (cert) => cert.id !== certificateId && cert.status === "active"
    //     ).length,
    //   }));
    // }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/20";
      case "expired":
        return "text-yellow-400 bg-yellow-400/20";
      case "revoked":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-slate-400 bg-slate-400/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "expired":
        return <AlertTriangle className="w-4 h-4" />;
      case "revoked":
        return <X className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };
  const handleIssueCertifcate = () => navigate("/issue/" + selectedUser?.id);
  useEffect(() => {
    api.get<CAUser[]>(`${VITE_API_BASE_URL}/api/ca-users`).then((res) => {
      console.log(res.data);
      setCaUsers(res.data);
    });
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 animate-pulse">
          <Key className="w-32 h-32 text-blue-400 rotate-12" />
        </div>
        <div className="absolute bottom-32 right-16 animate-pulse delay-1000">
          <Shield className="w-40 h-40 text-blue-300 -rotate-12" />
        </div>
        <div className="absolute top-1/2 left-16 animate-pulse delay-500">
          <Lock className="w-24 h-24 text-blue-500 rotate-45" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600/20 p-3 rounded-full mr-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Certificate Authority Management
              </h1>
              <p className="text-slate-400 text-lg">
                Manage user certificates and CA permissions
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <User className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-slate-300">
                  Total Users: {caUsers.length}
                </span>
              </div>
              <div className="flex items-center">
                <FileCheck className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-slate-300">
                  Active Certificates:{" "}
                  {caUsers.reduce(
                    (sum, user) => sum + user.activeCertificates,
                    0
                  )}
                </span>
              </div>
              <div className="flex items-center">
                <Key className="w-4 h-4 text-amber-400 mr-2" />
                <span className="text-slate-300">
                  Total Issued:{" "}
                  {caUsers.reduce(
                    (sum, user) => sum + user.issuedCertificates,
                    0
                  )}
                </span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-slate-300">PKI Status: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl hover:bg-slate-800/70 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
            >
              {/* User Avatar and Basic Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {user.name}
                    </h3>
                    <p className="text-slate-400 text-sm">{user.role}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-slate-300 text-sm">
                  <Building className="w-4 h-4 mr-2 text-slate-400" />
                  {user.organization}
                </div>
                <div className="flex items-center text-slate-300 text-sm">
                  <Mail className="w-4 h-4 mr-2 text-slate-400" />
                  {user.email}
                </div>
              </div>

              {/* Certificate Stats */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {user.activeCertificates}
                    </div>
                    <div className="text-xs text-slate-400">Active Certs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {user.issuedCertificates}
                    </div>
                    <div className="text-xs text-slate-400">Total Issued</div>
                  </div>
                </div>
              </div>

              {/* Click indicator */}
              <div className="mt-4 text-center">
                <span className="text-slate-500 text-xs">
                  Click to view certificates
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Details Panel */}
      {showCertificates && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 border-b border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4"></div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedUser.name}
                    </h2>
                    <p className="text-blue-400">
                      {selectedUser.organization} • {selectedUser.role}
                    </p>
                    <button
                      type="button"
                      onClick={handleIssueCertifcate}
                      className="py-2 px-3 me-2 my-2 ms-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 rounded-lg p-4 text-white"
                    >
                      Issue Certificate
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCloseCertificates}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Certificates List */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Issued Certificates
                </h3>
                <p className="text-slate-400 text-sm">
                  Manage all certificates issued to this user
                </p>
              </div>

              <div className="space-y-4">
                {selectedUser.certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FileCheck className="w-5 h-5 text-blue-400 mr-2" />

                          <div
                            className={`ml-3 px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(
                              certificate.status
                            )}`}
                          >
                            {getStatusIcon(certificate.status)}
                            <span className="ml-1 capitalize">
                              {certificate.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">
                              Serial Number:
                            </span>
                            <div className="text-slate-200 font-mono">
                              {certificate.serialNumber}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">
                              Certificate Type:
                            </span>
                            <div className="text-slate-200">
                              {certificate.type}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-1" />
                            <span className="text-slate-400">Issued:</span>
                            <div className="text-slate-200 ml-2">
                              {certificate.issuedDate}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-1" />
                            <span className="text-slate-400">Expires:</span>
                            <div className="text-slate-200 ml-2">
                              {certificate.expiryDate}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveCertificate(
                            selectedUser.id,
                            certificate.id
                          )
                        }
                        className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Revoke Certificate"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {selectedUser.certificates.length === 0 && (
                  <div className="text-center py-8">
                    <FileCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">
                      No certificates issued to this user
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated security particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CAManagementPage;
