import {
  Shield,
  Key,
  Lock,
  AlertTriangle,
  Home,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router";

export const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
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
        <div className="absolute bottom-20 left-1/3 animate-pulse delay-700">
          <Key className="w-28 h-28 text-blue-400 -rotate-45" />
        </div>
      </div>

      <div className="w-full max-w-2xl text-center relative z-10">
        {/* Main 404 Section */}
        <div className="mb-8">
          {/* Large 404 with security theme */}
          <div className="relative mb-6">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 select-none">
              4
            </h1>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <Shield className="w-24 h-24 text-blue-500 animate-pulse" />
                <Lock className="w-8 h-8 text-slate-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 select-none inline ml-4">
              4
            </h1>
          </div>

          {/* Error message with PKI theme */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-amber-500/20 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Access Certificate Not Found
            </h2>

            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              The requested resource could not be authenticated. The page you're
              looking for may have been moved, deleted, or the certificate
              authority could not validate your request.
            </p>

            {/* PKI-themed status info */}
            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-slate-300">Connection: Secure</span>
                </div>
                <div className="flex items-center justify-center">
                  <Key className="w-4 h-4 text-red-400 mr-2" />
                  <span className="text-slate-300">Certificate: Invalid</span>
                </div>
                <div className="flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-400 mr-2" />
                  <span className="text-slate-300">Status: 404 Not Found</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                <Home className="w-5 h-5 mr-2" />
                Return to Dashboard
              </button>

              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-slate-500 text-sm">
            <p className="mb-2">Public Key Infrastructure Management System</p>
            <p>Error Code: PKI_CERT_NOT_FOUND_404</p>
          </div>
        </div>
      </div>

      {/* Animated security particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NotFound;
