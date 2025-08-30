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
import CAManagementPage from "./pages/CAManagementPage";
import { EndEntityCertificateForm } from "./pages/EndEntityCertificate";
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
              <Route path="/view-ca-users" element={<CAManagementPage />} />
              <Route
                path="/issue-self-signed/:caId"
                element={<IssueSelfSigned />}
              />
              <Route path="/issue/:caId" element={<RequestCACertificate />} />
            </Route>
            <Route element={<RequireAuth role="REGULAR_USER" />}>
              <Route
                path="/end-entity"
                element={<EndEntityCertificateForm />}
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
