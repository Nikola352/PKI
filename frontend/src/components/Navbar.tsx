import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Shield,
  FileCheck,
  Plus,
  Users,
  LogOut,
  Menu,
  X,
  Home,
  Award,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { UserContext, type UserContextType } from "@/context/UserContext";

interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

const Navbar: React.FC = () => {
  const { userRole, loggedIn, currentUser, logOut } = useContext(
    UserContext
  ) as UserContextType;
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const getRoleDisplayName = (role?: string): string => {
    if (!role) return "";
    switch (role) {
      case "REGULAR_USER":
        return "Regular User";
      case "CA_USER":
        return "Certificate Authority User";
      case "ADMINISTRATOR":
        return "System Administrator";
      default:
        return role.replace("_", " ");
    }
  };

  // Navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        path: "/",
        label: "Dashboard",
        icon: Home,
        roles: ["REGULAR_USER", "CA_USER", "ADMINISTRATOR"],
      },
    ];

    const roleSpecificItems: NavigationItem[] = [
      // Regular User Routes
      {
        path: "/end-entity",
        label: "Request Certificate",
        icon: FileCheck,
        roles: ["REGULAR_USER"],
      },
      // CA User Routes
      {
        path: "/issue-certificate",
        label: "Issue Certificate",
        icon: Award,
        roles: ["CA_USER"],
      },
      // Administrator Routes
      {
        path: "/view-users",
        label: "Manage Users",
        icon: Users,
        roles: ["ADMINISTRATOR"],
      },
      {
        path: "/invite",
        label: "Invite Users",
        icon: UserCheck,
        roles: ["ADMINISTRATOR"],
      },
    ];

    return [...baseItems, ...roleSpecificItems].filter((item) =>
      item.roles.includes(userRole || "")
    );
  };

  const navigationItems = getNavigationItems();

  const isActivePath = (path: string): boolean => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  if (!loggedIn) {
    return null; // Don't show navbar if not logged in
  }

  return (
    <nav className="bg-gradient-to-r from-slate-800/95 to-slate-800/90 backdrop-blur-md border-b border-slate-600/50 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="bg-gradient-to-r from-blue-600/30 to-blue-500/30 p-2 rounded-lg mr-3 border border-blue-500/20 group-hover:from-blue-600/40 group-hover:to-blue-500/40 transition-all duration-200">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-bold text-lg">PKI System</span>
                <div className="text-slate-400 text-xs">
                  {getRoleDisplayName(userRole)}
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent"
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Info - Desktop */}
            <div className="hidden lg:block bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg px-4 py-2">
              <div className="text-right">
                <div className="text-white font-medium text-sm">
                  {currentUser?.fullName || "User"}
                </div>
                <div className="text-slate-400 text-xs">
                  {getRoleDisplayName(userRole)}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logOut()}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-600/30 hover:border-red-600/50 p-2 rounded-lg transition-all duration-200 flex items-center space-x-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline text-sm font-medium">Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800/95 backdrop-blur-md border-t border-slate-600/50">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {/* User Info - Mobile */}
            <div className="bg-slate-700/30 rounded-lg p-3 mb-3">
              <div className="text-white font-medium">
                {currentUser?.fullName || "User"}
              </div>
              <div className="text-slate-400 text-sm">
                {getRoleDisplayName(userRole)}
              </div>
            </div>

            {/* Navigation Items - Mobile */}
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            {/* Quick Actions - Mobile */}
            <div className="border-t border-slate-600/50 pt-3 mt-3">
              {userRole === "REGULAR_USER" && (
                <Link
                  to="/end-entity"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 space-x-3 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Request New Certificate</span>
                </Link>
              )}

              {userRole === "CA_USER" && (
                <Link
                  to="/issue-certificate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 space-x-3 shadow-lg"
                >
                  <Award className="w-5 h-5" />
                  <span>Issue New Certificate</span>
                </Link>
              )}

              {userRole === "ADMINISTRATOR" && (
                <div className="space-y-2">
                  <Link
                    to="/view-users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 space-x-3 shadow-lg"
                  >
                    <Users className="w-5 h-5" />
                    <span>Manage Users</span>
                  </Link>
                  <Link
                    to="/invite"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 space-x-3 shadow-lg"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>Invite Users</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animated security particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </nav>
  );
};

export default Navbar;