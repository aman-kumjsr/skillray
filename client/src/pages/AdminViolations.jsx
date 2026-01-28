import { useEffect, useState } from "react";
import { authHeader } from "../api/authHeader";

export default function AdminViolations() {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchViolations = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/violations", {
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeader(),
                    },
                });

                if (!res.ok) {
                    throw new Error("Failed to load violations");
                }

                const data = await res.json();
                setViolations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }

        };

        fetchViolations();
    }, []);

    if (loading) return <p>Loading violations...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <h2>Violations</h2>

            {violations.length === 0 ? (
                <p>No violations found</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th>Attempt ID</th>
                            <th>Candidate</th>
                            <th>Violation Type</th>
                            <th>Count</th>
                            <th>Timestamp</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {violations.map((v) => (
                            <tr key={v.violationId}>
                                <td>{v.attemptId}</td>
                                <td>{v.candidateName || "-"}</td>
                                <td>{v.type}</td>
                                <td>{v.count}</td>
                                <td>{new Date(v.timestamp).toLocaleString()}</td>
                                <td>
                                    {v.autoSubmitted ? "Auto-Submitted" : "Flagged"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const styles = {
    table: {
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "16px",
    },
};
