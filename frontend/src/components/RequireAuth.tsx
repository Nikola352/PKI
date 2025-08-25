import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { UserContext, type UserContextType } from "@/context/UserContext";
import { Error } from "@/pages/Error.tsx";
import type { UserRole } from "@/model/user";

type AuthState = "loading" | "authorized" | "unauthorized";

const RequireAuth = ({ role }: { role?: UserRole }) => {
  const { userRole, loggedIn } = useContext(UserContext) as UserContextType;
  const [authState, setAuthState] = useState<AuthState>("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (!loggedIn) {
        navigate("/login", { replace: true });
      } else if (role && userRole !== role) {
        setAuthState("unauthorized");
      } else {
        setAuthState("authorized");
      }
    };

    checkAuth();
  }, [loggedIn, userRole, navigate]);

  if (authState === "loading") {
    return null;
  }

  return authState === "authorized" ? <Outlet /> : <Error />;
};

export default RequireAuth;
