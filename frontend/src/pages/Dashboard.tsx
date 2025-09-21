import React, { useContext, useState } from "react";
import {
  Shield,
  Key,
  Lock,
  User,
  FileCheck,
  Plus,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Users,
  Crown,
  FileText,
  Network,
  LogOut,
  Trash2,
  AlertCircle,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import api from "@/api/axios-config";
import { UserContext, type UserContextType } from "@/context/UserContext";
import { CertificateDownloadModal } from "@/components/CertificateDownloadModal";
import { RevokeCertificateModal } from "@/components/RevokeCertificateModal";

interface UserCertificate {
  id: string;
  serialNumber: string;
  commonName: string;
  validFrom: string;
  validTo: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  type: "ROOT" | "INTERMEDIATE" | "END_ENTITY";
  issuerName: string;
}

interface CertificateNode {
  certificate: UserCertificate;
  children?: CertificateNode[];
}

interface DownloadCheckResponse {
  isAvailable: boolean;
}

const Dashboard: React.FC = () => {
  const { userRole, loggedIn, userDataLoaded, currentUser, logOut } =
    useContext(UserContext) as UserContextType;
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [certificateToDownload, setCertificateToDownload] = useState<
    string | null
  >(null);

  const { data: userCertificates, isLoading: userCertsLoading } = useQuery({
    queryKey: ["user-certificates", currentUser?.id],
    queryFn: () =>
      api
        .get<UserCertificate[]>(`/api/certificates/user/${currentUser?.id}`)
        .then((res) => res.data),
    enabled: loggedIn && userRole === "REGULAR_USER",
  });

  const { data: caCertificateTree, isLoading: caTreeLoading } = useQuery({
    queryKey: ["ca-certificate-tree", currentUser?.id],
    queryFn: () =>
      api
        .get<CertificateNode[]>(`/api/certificates/tree/ca/${currentUser?.id}`)
        .then((res) => res.data),
    enabled: loggedIn && userRole === "CA_USER",
  });

  const { data: allCertificatesTree, isLoading: allTreeLoading } = useQuery({
    queryKey: ["all-certificates-tree"],
    queryFn: () =>
      api
        .get<CertificateNode[]>("/api/certificates/tree")
        .then((res) => res.data),
    enabled: loggedIn && userRole === "ADMINISTRATOR",
  });

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const checkFirstDownloadAvailability = async (
    certId: string
  ): Promise<boolean> => {
    try {
      const response = await api.get<DownloadCheckResponse>(
        `/api/certificates/${certId}/download/check`
      );
      return response.data.isAvailable;
    } catch (error) {
      console.error("Error checking download availability:", error);
      return false;
    }
  };

  const downloadPem = async (certId: string) => {
    try {
      const response = await api.get(
        `/api/certificates/${certId}/download/pem`,
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], {
        type: "application/x-pem-file",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certId}.pem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PEM certificate:", error);
    }
  };

  const handleDownloadCertificate = async (
    certificateId: string,
    type: "ROOT" | "INTERMEDIATE" | "END_ENTITY"
  ) => {
    // For regular users with end-entity certificates, check first download availability
    if (userRole === "REGULAR_USER" && type === "END_ENTITY") {
      const isFirstDownloadAvailable = await checkFirstDownloadAvailability(
        certificateId
      );
      if (isFirstDownloadAvailable) {
        setCertificateToDownload(certificateId);
      } else {
        downloadPem(certificateId);
      }
    } else if (type === "END_ENTITY") {
      // Other users (CA_USER, ADMINISTRATOR) always download PEM for end-entity certificates
      downloadPem(certificateId);
    } else {
      // ROOT and INTERMEDIATE certificates use modal for all users
      setCertificateToDownload(certificateId);
    }
  };

  const [selectedCertificate, setSelectedCertificate] =
    useState<UserCertificate | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleRevokeCertificate = async (certificate: UserCertificate) => {
    setSelectedCertificate(certificate);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-400 bg-green-400/20 border-green-400/30";
      case "EXPIRED":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "REVOKED":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      default:
        return "text-slate-400 bg-slate-400/20 border-slate-400/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "EXPIRED":
        return <AlertTriangle className="w-4 h-4" />;
      case "REVOKED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: "ROOT" | "INTERMEDIATE" | "END_ENTITY") => {
    switch (type) {
      case "ROOT":
        return <Crown className="w-6 h-6 text-amber-400" />;
      case "INTERMEDIATE":
        return <Network className="w-6 h-6 text-blue-400" />;
      case "END_ENTITY":
        return <User className="w-6 h-6 text-green-400" />;
      default:
        return <FileText className="w-6 h-6 text-slate-400" />;
    }
  };

  const getTypeText = (type: "ROOT" | "INTERMEDIATE" | "END_ENTITY") => {
    switch (type) {
      case "ROOT":
        return "Root Certificate Authority";
      case "INTERMEDIATE":
        return "Intermediate Certificate Authority";
      case "END_ENTITY":
        return "End-Entity Certificate";
      default:
        return "";
    }
  };

  const getRoleDisplayName = (role?: string) => {
    if (!role) return "";
    switch (role) {
      case "REGULAR_USER":
        return "Regular User";
      case "CA_USER":
        return "Certificate Authority User";
      case "ADMINISTRATOR":
        return "System Administrator";
      default:
        return role?.replace("_", " ");
    }
  };

  const getDownloadTooltip = (type: "ROOT" | "INTERMEDIATE" | "END_ENTITY") => {
    if (userRole === "REGULAR_USER" && type === "END_ENTITY") {
      return "Download Certificate (PKCS12 if first download, PEM otherwise)";
    }
    return type === "END_ENTITY" ? "Download PEM" : "Download PKCS12";
  };

  const renderCertificateNode = (node: CertificateNode, level: number = 0) => {
    const cert = node.certificate;
    const isExpanded = expandedNodes.has(cert.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={cert.id} className="mb-4">
        <div
          className="bg-gradient-to-r from-slate-800/80 to-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 hover:from-slate-800/90 hover:to-slate-800/80 hover:border-slate-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
          style={{ marginLeft: `${level * 32}px` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(cert.id)}
                  className="mr-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-9 mr-4" />}

              <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 p-3 rounded-xl mr-4">
                {getTypeIcon(cert.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-1">
                      {cert.commonName}
                    </h4>
                    <p className="text-slate-400 text-sm font-mono bg-slate-700/30 px-2 py-1 rounded">
                      {cert.serialNumber}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center border ${getStatusColor(
                        cert.status
                      )}`}
                    >
                      {getStatusIcon(cert.status)}
                      <span className="ml-2 capitalize">{cert.status}</span>
                    </div>

                    <button
                      onClick={() =>
                        handleDownloadCertificate(cert.id, cert.type)
                      }
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title={getDownloadTooltip(cert.type)}
                    >
                      <Download className="w-5 h-5" />
                    </button>

                    {cert.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevokeCertificate(cert)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Revoke Certificate"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="inline-flex items-center text-sm text-slate-300 bg-slate-700/40 px-3 py-1.5 rounded-lg">
                    <FileCheck className="w-4 h-4 mr-2" />
                    {getTypeText(cert.type)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 mr-2 text-green-400" />
                    <span className="text-slate-400 mr-2">Issued:</span>
                    <span className="font-medium">
                      {formatDate(cert.validFrom)}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 mr-2 text-red-400" />
                    <span className="text-slate-400 mr-2">Expires:</span>
                    <span className="font-medium">
                      {formatDate(cert.validTo)}
                    </span>
                  </div>
                  {cert.issuerName && (
                    <div className="md:col-span-2 flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                      <Shield className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="text-slate-400 mr-2">Issuer:</span>
                      <span className="font-medium">{cert.issuerName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-4">
            {node.children!.map((child) =>
              renderCertificateNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRegularUserView = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-3">
            My Certificates
          </h2>
          <p className="text-slate-400 text-lg">
            View and manage your issued certificates
          </p>
        </div>
        <Link
          to="/end-entity"
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Request New Certificate</span>
        </Link>
      </div>

      <div className="space-y-6">
        {userCertsLoading ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">Loading certificates...</p>
          </div>
        ) : userCertificates && userCertificates.length > 0 ? (
          userCertificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-gradient-to-r from-slate-800/80 to-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 hover:from-slate-800/90 hover:to-slate-800/80 hover:border-slate-500/50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 p-3 rounded-xl mr-4">
                    {getTypeIcon(cert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-1">
                          {cert.commonName}
                        </h4>
                        <p className="text-slate-400 text-sm font-mono bg-slate-700/30 px-2 py-1 rounded">
                          {cert.serialNumber}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center border ${getStatusColor(
                            cert.status
                          )}`}
                        >
                          {getStatusIcon(cert.status)}
                          <span className="ml-2 capitalize">{cert.status}</span>
                        </div>

                        <button
                          onClick={() =>
                            handleDownloadCertificate(cert.id, cert.type)
                          }
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title={getDownloadTooltip(cert.type)}
                        >
                          <Download className="w-5 h-5" />
                        </button>

                        {cert.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevokeCertificate(cert)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Revoke Certificate"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="inline-flex items-center text-sm text-slate-300 bg-slate-700/40 px-3 py-1.5 rounded-lg">
                        <FileCheck className="w-4 h-4 mr-2" />
                        {getTypeText(cert.type)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                        <Shield className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-slate-400 mr-2">Issuer:</span>
                        <span className="font-medium">{cert.issuerName}</span>
                      </div>
                      <div className="flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                        <FileCheck className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="text-slate-400 mr-2">Type:</span>
                        <span className="font-medium">
                          {getTypeText(cert.type)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                        <Calendar className="w-4 h-4 mr-2 text-green-400" />
                        <span className="text-slate-400 mr-2">Issued:</span>
                        <span className="font-medium">
                          {formatDate(cert.validFrom)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-300 bg-slate-700/20 px-3 py-2 rounded-lg">
                        <Calendar className="w-4 h-4 mr-2 text-red-400" />
                        <span className="text-slate-400 mr-2">Expires:</span>
                        <span className="font-medium">
                          {formatDate(cert.validTo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl">
            <FileText className="w-16 h-16 text-slate-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No certificates found
            </h3>
            <p className="text-slate-500">
              Request your first certificate to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCAUserView = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Certificate Chain Management
          </h2>
          <p className="text-slate-400 text-lg">
            Manage your certificate hierarchy and issue new certificates
          </p>
        </div>
        <Link
          to="/issue-certificate"
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Issue New Certificate</span>
        </Link>
      </div>

      <div className="space-y-6">
        {caTreeLoading ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">
              Loading certificate tree...
            </p>
          </div>
        ) : caCertificateTree && caCertificateTree.length > 0 ? (
          caCertificateTree.map((node) => renderCertificateNode(node))
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl">
            <Network className="w-16 h-16 text-slate-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No certificates in your chain
            </h3>
            <p className="text-slate-500">
              Your certificate chain will appear here once issued
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-3">
            PKI System Overview
          </h2>
          <p className="text-slate-400 text-lg">
            Complete certificate hierarchy and user management
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/view-users"
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Users className="w-5 h-5" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {allTreeLoading ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">
              Loading complete certificate tree...
            </p>
          </div>
        ) : allCertificatesTree && allCertificatesTree.length > 0 ? (
          allCertificatesTree.map((node) => renderCertificateNode(node))
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl">
            <Shield className="w-16 h-16 text-slate-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No certificates in the system
            </h3>
            <p className="text-slate-500">
              The complete PKI hierarchy will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (!userDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-6"></div>
          <p className="text-slate-400 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

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
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600/30 to-blue-500/30 p-4 rounded-2xl mr-6 border border-blue-500/20">
                <Shield className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-2">
                  Public Key Infrastructure
                </h1>
                <p className="text-slate-400 text-xl">
                  {userRole === "REGULAR_USER" &&
                    "Manage your certificates and requests"}
                  {userRole === "CA_USER" && "Certificate Authority Dashboard"}
                  {userRole === "ADMINISTRATOR" &&
                    "System Administration Dashboard"}
                </p>
              </div>
            </div>

            {/* User info and logout */}
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-6 py-3">
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {currentUser?.fullName || "User"}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {getRoleDisplayName(userRole)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => logOut()}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-600/30 hover:border-red-600/50 p-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="bg-gradient-to-r from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center bg-slate-700/30 rounded-xl p-4">
                <User className="w-6 h-6 text-blue-400 mr-3" />
                <div>
                  <div className="text-slate-300 font-medium">Role</div>
                  <div className="text-white text-sm">
                    {getRoleDisplayName(userRole)}
                  </div>
                </div>
              </div>
              <div className="flex items-center bg-slate-700/30 rounded-xl p-4">
                <Shield className="w-6 h-6 text-green-400 mr-3" />
                <div>
                  <div className="text-slate-300 font-medium">PKI Status</div>
                  <div className="text-white text-sm">Active</div>
                </div>
              </div>
              <div className="flex items-center bg-slate-700/30 rounded-xl p-4">
                <Lock className="w-6 h-6 text-amber-400 mr-3" />
                <div>
                  <div className="text-slate-300 font-medium">Security</div>
                  <div className="text-white text-sm">High</div>
                </div>
              </div>
              <div className="flex items-center bg-slate-700/30 rounded-xl p-4">
                <FileCheck className="w-6 h-6 text-blue-400 mr-3" />
                <div>
                  <div className="text-slate-300 font-medium">System</div>
                  <div className="text-white text-sm">Online</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role-based content */}
        {userRole === "REGULAR_USER" && renderRegularUserView()}
        {userRole === "CA_USER" && renderCAUserView()}
        {userRole === "ADMINISTRATOR" && renderAdminView()}
      </div>

      {/* Animated security particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <CertificateDownloadModal
        isOpen={certificateToDownload != null}
        onClose={() => setCertificateToDownload(null)}
        certificateId={certificateToDownload ?? ""}
        certificateName={`certificate-${certificateToDownload}`}
      />
      {selectedCertificate && (
        <RevokeCertificateModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          certificate={selectedCertificate}
        />
      )}
    </div>
  );
};

export default Dashboard;
