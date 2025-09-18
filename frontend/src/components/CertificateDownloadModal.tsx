import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/api/axios-config";
import {
  X,
  Download,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Key,
} from "lucide-react";

interface CertificateDownloadRequestResponseDto {
  id: string;
  password: string;
}

interface CertificateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
  certificateName?: string;
}

export const CertificateDownloadModal: React.FC<
  CertificateDownloadModalProps
> = ({ isOpen, onClose, certificateId, certificateName = "Certificate" }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [downloadResponse, setDownloadResponse] =
    useState<CertificateDownloadRequestResponseDto | null>(null);

  const requestDownloadMutation = useMutation<
    CertificateDownloadRequestResponseDto,
    Error,
    void
  >({
    mutationFn: async () => {
      const response = await api.get(
        `/api/certificates/${certificateId}/download/request`
      );
      return response.data;
    },
    onSuccess: (data) => {
      setDownloadResponse(data);
    },
    onError: (err) => {
      console.error(err.message ?? "Failed to request certificate download");
    },
  });

  const downloadFileMutation = useMutation<void, Error, string>({
    mutationFn: async (requestId: string) => {
      const response = await api.get(
        `/api/certificates/${certificateId}/download/${requestId}`,
        { responseType: "blob" }
      );

      // Create download link
      const blob = new Blob([response.data], { type: "application/x-pkcs12" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${certificateName}.p12`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (err) => {
      console.error(err.message ?? "Failed to download certificate file");
    },
  });

  // Auto-request download when modal opens
  useEffect(() => {
    if (
      isOpen &&
      !downloadResponse &&
      !requestDownloadMutation.isPending &&
      !requestDownloadMutation.isError
    ) {
      requestDownloadMutation.mutate();
    }
  }, [isOpen]);

  const handleClose = () => {
    setDownloadResponse(null);
    setShowPassword(false);
    setPasswordCopied(false);
    requestDownloadMutation.reset();
    downloadFileMutation.reset();
    onClose();
  };

  const handleRequestDownload = () => {
    requestDownloadMutation.mutate();
  };

  const handleDownloadFile = () => {
    if (downloadResponse) {
      downloadFileMutation.mutate(downloadResponse.id);
    }
  };

  const copyPasswordToClipboard = async () => {
    if (downloadResponse?.password) {
      try {
        await navigator.clipboard.writeText(downloadResponse.password);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy password to clipboard:", err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg">
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Download Certificate
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading state */}
            {requestDownloadMutation.isPending && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Preparing Download
                </h3>
                <p className="text-slate-400">
                  Please wait while we prepare your certificate...
                </p>
              </div>
            )}

            {/* Error state */}
            {requestDownloadMutation.isError && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Download Failed
                </h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-300 text-sm">
                    {requestDownloadMutation.error?.message ||
                      "An error occurred while preparing your certificate download."}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleRequestDownload}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success state with password */}
            {downloadResponse && (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Download Ready
                  </h3>
                  <p className="text-slate-400">
                    Your certificate is ready. Save the password below - it will
                    only be shown once!
                  </p>
                </div>

                {/* Password Display */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-yellow-400 text-sm mb-3">
                    <Key className="w-4 h-4 mr-2" />
                    <span className="font-medium">Certificate Password</span>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <code className="text-white font-mono text-sm break-all">
                        {showPassword
                          ? downloadResponse.password
                          : "••••••••••••••••"}
                      </code>
                      <div className="flex items-center space-x-2 ml-3">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-white transition-colors"
                          title={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={copyPasswordToClipboard}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          {passwordCopied ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-yellow-300 text-xs">
                    ⚠️ This password will not be shown again. Make sure to save
                    it securely!
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadFile}
                  disabled={downloadFileMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center"
                >
                  {downloadFileMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Certificate (.p12)
                    </>
                  )}
                </button>

                {/* Download error */}
                {downloadFileMutation.isError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
                    <p className="text-red-300 text-sm">
                      {downloadFileMutation.error?.message ||
                        "Failed to download certificate file. Please try again."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
