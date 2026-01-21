import { Navigate } from "react-router-dom";

export default function AdminGuard({ children }) {
  const token = localStorage.getItem("skillray_token");
  const user = JSON.parse(localStorage.getItem("skillray_user"));

  if (!token || !user || user.role !== "COMPANY") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
