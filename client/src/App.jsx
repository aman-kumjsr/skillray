import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PublicTest from "./pages/PublicTest";
import StartTest from "./pages/StartTest";
import TestPage from "./pages/TestPage";
import Result from "./pages/Result";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminGuard from "./components/AdminGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test/:token" element={<PublicTest />} />
        <Route path="/start" element={<StartTest />} />
        <Route path="/test-run" element={<TestPage />} />
        <Route path="/result" element={<Result />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
