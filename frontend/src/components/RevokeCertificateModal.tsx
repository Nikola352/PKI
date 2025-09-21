import { useState } from "react";
import { X, AlertTriangle, Shield, Clock, FileX, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios-config";
const { VITE_API_BASE_URL } = import.meta.env;

const REVOCATION_REASONS = [
  {
    value: 0,
    label: "Unspecified",
    description: "No specific reason provided",
  },
  {
    value: 1,
    label: "Key Compromise",
    description: "Private key has been compromised",
  },
  {
    value: 2,
    label: "CA Compromise",
    description: "Certificate Authority has been compromised",
  },
  {
    value: 3,
    label: "Affiliation Changed",
    description: "Subject's affiliation has changed",
  },
  {
    value: 4,
    label: "Superseded",
    description: "Certificate has been replaced",
  },
  {
    value: 5,
    label: "Cessation of Operation",
    description: "Entity has ceased operations",
  },
  {
    value: 6,
    label: "Certificate Hold",
    description: "Temporarily suspended (reversible)",
  },
  {
    value: 8,
    label: "Remove from CRL",
    description: "Remove from Certificate Revocation List",
  },
  {
    value: 9,
    label: "Privilege Withdrawn",
    description: "Certificate privileges revoked",
  },
  {
    value: 10,
    label: "AA Compromise",
    description: "Attribute Authority compromised",
  },
];

// interface UserCertificate {
//   id: string;
//   serialNumber: string;
//   commonName: string;
//   validFrom: string;
//   validTo: string;
//   status: "ACTIVE" | "EXPIRED" | "REVOKED";
//   type: "ROOT" | "INTERMEDIATE" | "END_ENTITY";
//   issuerName: string;
// }

export const RevokeCertificateModal = ({
  isOpen = true,
  onClose = () => {},
  certificate = {
    id: "",
    serialNumber: "",
    commonName: "",
    validFrom: "",
    validTo: "",
    status: "ACTIVE",
    type: "END_ENTITY",
    issuerName: "",
  },
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const [showReasonDetails, setShowReasonDetails] = useState(false);
  const queryClient = useQueryClient();

  const revokeCertMutation = useMutation({
    mutationFn: async () => {
      setIsRevoking(true);
      const response = await api.put(
        `${VITE_API_BASE_URL}/api/certificates/revoke/${certificate.id}`,
        {
          reason: selectedReason,
        }
      );
      console.log(response.data);
      return response.data;
    },

    onSuccess: () => {
      setIsRevoking(false);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["user-certificates"] });
      console.log("Revoked");
    },
    onError: () => {
      setIsRevoking(false);
      console.log("Failed");
    },
  });

  const handleRevoke = async () => {
    if (!selectedReason) {
      alert("Please select a revocation reason");
      return;
    }

    revokeCertMutation.mutate();
  };

  const selectedReasonData = REVOCATION_REASONS.find(
    (r) => r.value === parseInt(selectedReason)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-800/80 bg-opacity-20 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/60 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">
                Revoke Certificate
              </h2>
              <p className="text-sm text-gray-300">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isRevoking}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Certificate Info */}
          <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Certificate Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">
                  Serial Number:
                </span>
                <p className="text-gray-800 font-mono bg-white px-2 py-1 rounded mt-1">
                  {certificate.serialNumber}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Valid Until:</span>
                <p className="text-gray-800 mt-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {certificate.validTo}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-600">Subject:</span>
                <p className="text-gray-800 font-mono text-xs bg-white px-2 py-1 rounded mt-1 break-all">
                  {certificate.commonName}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-600">Issuer:</span>
                <p className="text-gray-800 font-mono text-xs bg-white px-2 py-1 rounded mt-1 break-all">
                  {certificate.issuerName}
                </p>
              </div>
            </div>
          </div>

          {/* Revocation Reason */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-200">
                Revocation Reason *
              </label>
              <button
                onClick={() => setShowReasonDetails(!showReasonDetails)}
                className="flex items-center text-sm text-blue-300 hover:text-blue-400 transition-colors"
              >
                <Info className="h-4 w-4 mr-1" />
                {showReasonDetails ? "Hide" : "Show"} Details
              </button>
            </div>

            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 text-gray-200 bg-black rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              disabled={isRevoking}
            >
              <option value="">Select a revocation reason...</option>
              {REVOCATION_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label} (Code {reason.value})
                </option>
              ))}
            </select>

            {/* Reason Details */}
            {showReasonDetails && selectedReasonData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {selectedReasonData.label} (RFC 5280 Code:{" "}
                  {selectedReasonData.value})
                </h4>
                <p className="text-sm text-blue-800">
                  {selectedReasonData.description}
                </p>
              </div>
            )}
          </div>

          {/* Additional Information
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Additional Information (Optional)
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Provide any additional context or details about the revocation..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
              rows={3}
              disabled={isRevoking}
            />
          </div> */}

          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">
                  Important Warning
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>
                    • Certificate revocation is{" "}
                    <strong>permanent and irreversible</strong>
                  </li>
                  <li>
                    • All services using this certificate will immediately lose
                    trust
                  </li>
                  <li>
                    • The certificate will be added to the Certificate
                    Revocation List (CRL)
                  </li>
                  <li>• This action will be logged and audited</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isRevoking}
            className="px-6 py-2.5 border border-gray-300 text-gray-100 rounded-xl font-medium hover:bg-blue-300 hover:text-black transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRevoke}
            disabled={isRevoking || !selectedReason}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isRevoking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Revoking...</span>
              </>
            ) : (
              <>
                <FileX className="h-4 w-4" />
                <span>Revoke Certificate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
