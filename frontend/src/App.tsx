import { Route, Routes } from "react-router";
import "./App.css";
import { UserProvider } from "@/context/UserContext";
import { Login } from "@/pages/Login.tsx";
import RequireAuth from "./components/RequireAuth";
import { Home } from "./pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const client = new QueryClient();

  return (
    <QueryClientProvider client={client}>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
