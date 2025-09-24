import { Route, Routes, useLocation } from "react-router";
import "./App.css";
import { UserProvider } from "@/context/UserContext";
import { Login } from "@/pages/Login.tsx";
import RequireAuth from "./components/RequireAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotFound } from "@/pages/NotFound";
import { Register } from "@/pages/Register";
import { ActivateAccount } from "@/pages/ActivateAccount";
import { IssueSelfSigned } from "./pages/IssueSelfSigned";
import { RequestCACertificate } from "./pages/RequestCertificate";
import { EndEntityCertificateForm } from "./pages/EndEntityCertificate";
import Invite from "./pages/Invite";
import ActivateCaAccount from "./pages/ActivateCaAccount";
import CAIssuing from "./pages/CaIssuing";
import Dashboard from "./pages/Dashboard";
import UserManagementPage from "./pages/ViewUsers";
import Navbar from "./components/Navbar";

function App() {
  const client = new QueryClient();
  const location = useLocation();

  // Define public routes where navbar should be hidden
  const publicRoutes = ['/login', '/register', '/user/activate', '/user/activate/ca'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <QueryClientProvider client={client}>
      <UserProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {!isPublicRoute && <Navbar />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/user/activate" element={<ActivateAccount />} />
            <Route path="/user/activate/ca" element={<ActivateCaAccount />} />

            <Route element={<RequireAuth />}>
              <Route path="/" element={<Dashboard />} />
            </Route>
            <Route element={<RequireAuth role="CA_USER" />}>
              <Route path="/issue-certificate" element={<CAIssuing />} />
            </Route>

            <Route element={<RequireAuth role="REGULAR_USER" />}>
              <Route path="/end-entity" element={<EndEntityCertificateForm />} />
            </Route>

            <Route element={<RequireAuth role="ADMINISTRATOR" />}>
              <Route path="/view-users" element={<UserManagementPage />} />

              <Route
                path="/issue-self-signed/:caId"
                element={<IssueSelfSigned />}
              />
              <Route path="/issue/:caId" element={<RequestCACertificate />} />
              <Route path="/invite" element={<Invite />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;