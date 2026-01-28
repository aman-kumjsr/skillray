import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PublicTest from "./pages/PublicTest";
import StartTest from "./pages/StartTest";
import TestPage from "./pages/TestPage";
import Result from "./pages/Result";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import AdminGuard from "./components/AdminGuard";
import AdminLayout from "./components/AdminLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/test/:token" element={<PublicTest />} />
        <Route path="/start" element={<StartTest />} />
        <Route path="/test-run" element={<TestPage />} />
        <Route path="/result" element={<Result />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected layout */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tests" element={<div>Tests Page</div>} />
          <Route path="attempts" element={<div>Attempts Page</div>} />
          <Route path="violations" element={<div>Violations Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
