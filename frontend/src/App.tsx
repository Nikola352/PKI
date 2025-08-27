import { Route, Routes } from "react-router";
import "./App.css";
import { UserProvider } from "@/context/UserContext";
import { Login } from "@/pages/Login.tsx";
import RequireAuth from "./components/RequireAuth";
import { Home } from "./pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotFound } from "@/pages/NotFound";
import { Register } from "@/pages/Register";
import { ActivateAccount } from "@/pages/ActivateAccount";
import { IssueSelfSigned } from "./pages/IssueSelfSigned";
import { RequestCACertificate } from "./pages/RequestCertificate";

function App() {
  const client = new QueryClient();

  return (
    <QueryClientProvider client={client}>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/activate" element={<ActivateAccount />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<Home />} />
            <Route element={<RequireAuth role="ADMINISTRATOR" />}>
              <Route path="/issue-self-signed" element={<IssueSelfSigned />} />
              <Route path="/issue" element={<RequestCACertificate />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
