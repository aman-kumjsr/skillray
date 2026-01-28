import { Outlet, useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div style={styles.root}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>Skillray</h2>

        <NavItem label="Dashboard" onClick={() => navigate("/admin/dashboard")} />
        <NavItem label="Tests" onClick={() => navigate("/admin/tests")} />
        <NavItem label="Attempts" onClick={() => navigate("/admin/attempts")} />
        <NavItem label="Violations" onClick={() => navigate("/admin/violations")} />
      </aside>

      {/* MAIN AREA */}
      <div style={styles.main}>
        {/* <AdminHeader /> */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ label, onClick }) {
  return (
    <div onClick={onClick} style={styles.navItem}>
      {label}
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    height: "100vh",          // 🔑 important
    width: "100vw",
    overflow: "hidden",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#020617",
    color: "#fff",
    padding: "20px",
    boxSizing: "border-box",
    flexShrink: 0,            // 🔑 prevents collapsing
  },
  logo: {
    marginBottom: "24px",
  },
  navItem: {
    padding: "10px 12px",
    marginBottom: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#020617",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
  },
  content: {
    flex: 1,
    padding: "24px",
    backgroundColor: "#f8fafc",
    overflowY: "auto",        // 🔑 prevents page breaking
  },
};
