import { UserContext, type UserContextType } from "@/context/UserContext";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import api from "@/api/axios-config";
import type { ErrorResponse } from "@/model/error.response";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router";

export const Home = () => {
  const navigate = useNavigate();
  const { currentUser, logOut } = useContext(UserContext) as UserContextType;

  const { mutate: test } = useMutation<any, AxiosError>({
    mutationFn: async () => {
      const response = await api.get("/api/test");
      return response.data;
    },
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (err) => {
      const error = err.response?.data as ErrorResponse | undefined;
      console.error(error?.message ?? "Connection error");
    },
  });

  return (
    <div>
      <h1>Hello, {currentUser?.fullName}</h1>
      <h2>You are {currentUser?.role}</h2>
      <button onClick={() => test()}>test</button>
      <br />
      <button onClick={() => logOut()}>log out</button>
      {currentUser?.role == "CA_USER" && (
        <button
          onClick={() => navigate("/issue-certificate")}
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Default
        </button>
      )}
    </div>
  );
};
