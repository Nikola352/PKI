import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { User, UserRole } from "@/model/user";
import api, { setupAxiosInterceptors } from "@/api/axios-config";
import type { LoginResponse } from "@/pages/Login";
import { useQuery } from "@tanstack/react-query";

export type UserContextType = {
  currentUser: User | null;
  loggedIn: boolean;
  userRole: UserRole | undefined;
  logIn: (data: LoginResponse) => Promise<void>;
  logOut: () => Promise<void>;
  userDataLoaded: boolean;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: any) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [interceptorsSetUp, setInterceptorsSetUp] = useState(false);
  const interceptorsSetUpRef = useRef<boolean>(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  const logIn = async (data: LoginResponse) => {
    setUser(data);
    accessTokenRef.current = data.accessToken;
  };

  const logOut = async () => {
    setIsLoggingOut(true);
    try {
      await api.get("/api/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      accessTokenRef.current = null;
      setIsLoggingOut(false);
    }
  };

  const goToLogin = () => {
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!navigate || interceptorsSetUpRef.current) {
      return;
    }
    interceptorsSetUpRef.current = true;
    setupAxiosInterceptors(
      goToLogin,
      logOut,
      () => accessTokenRef.current,
      (val) => (accessTokenRef.current = val)
    );
    setInterceptorsSetUp(true);
  }, [navigate]);

  const {
    data: userData,
    isError,
    isPending,
  } = useQuery({
    queryKey: ["logged-in-user"],
    queryFn: async () => {
      const response = await api.get("/api/auth/refresh/user");
      return response.data as LoginResponse;
    },
    retry: false,
    enabled: interceptorsSetUp,
  });

  useEffect(() => {
    if (isPending) return;
    if (!isError) {
      logIn(userData);
    }
    setUserDataLoaded(true);
  }, [userData, isError, isPending]);

  if (!userDataLoaded) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        currentUser: user,
        loggedIn: user !== null,
        userRole: user?.role,
        logIn,
        logOut,
        userDataLoaded,
      }}
    >
      {isLoggingOut ? null : children}
    </UserContext.Provider>
  );
};
