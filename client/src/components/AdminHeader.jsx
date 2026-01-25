import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("skillray_token");
    localStorage.removeItem("skillray_user");
    navigate("/admin/login");
  };

  return (
    <div style={styles.header}>
      <h2 style={{ margin: 0 }}>Skillray Admin</h2>

      <button onClick={handleLogout} style={styles.logout}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "#0f172a",
    color: "#fff",
  },
  logout: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "4px",
  },
};
