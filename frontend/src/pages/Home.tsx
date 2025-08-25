import { UserContext, type UserContextType } from "@/context/UserContext";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import api from "@/api/axios-config";
import type { ErrorResponse } from "@/model/error.response";
import type { AxiosError } from "axios";

export const Home = () => {
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
    </div>
  );
};
