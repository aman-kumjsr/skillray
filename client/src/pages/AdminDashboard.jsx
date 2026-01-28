import { useEffect, useState } from "react";
import { authHeader } from "../api/authHeader";
import AdminHeader from "../components/AdminHeader";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTests: 0,
    activeAttempts: 0,
    flaggedAttempts: 0,
    autoSubmitted: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Later: replace with real API
    fetch("http://localhost:5000/api/admin/dashboard", {
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      })
      .catch(() => {
        // fallback for now
      });
  }, []);

  return (
    <div style={styles.page}>
      <AdminHeader />
      <h1>Admin Dashboard</h1>

      {/* -------- STATS CARDS -------- */}
      <div style={styles.cards}>
        <Card title="Total Tests" value={stats.totalTests} />
        <Card title="Active Attempts" value={stats.activeAttempts} />
        <Card title="Flagged Attempts" value={stats.flaggedAttempts} />
        <Card title="Auto-Submitted" value={stats.autoSubmitted} />
      </div>

      {/* -------- QUICK ACTIONS -------- */}
      <div style={styles.section}>
        <h2>Quick Actions</h2>
        <div style={styles.actions}>
          <button>Create Test</button>
          <button>View Tests</button>
          <button>View Attempts</button>
          <button>View Violations</button>
        </div>
      </div>

      {/* -------- RECENT ACTIVITY -------- */}
      <div style={styles.section}>
        <h2>Recent Activity</h2>

        {recentActivity.length === 0 ? (
          <p>No recent activity</p>
        ) : (
          <ul>
            {recentActivity.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* -------- SMALL COMPONENT -------- */

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={{ color: "#64748b" }}>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* -------- STYLES -------- */

const styles = {
  page: {
    padding: "2px 24px",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  section: {
    marginBottom: "32px",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
};
