import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiPost } from "../api/api";

export default function StartTest() {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [requiresAccessCode, setRequiresAccessCode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ SAFETY CHECK
  useEffect(() => {
    if (!location.state) {
      setError("Invalid navigation. Please open test from link.");
      return;
    }

    setToken(location.state.token);
    setRequiresAccessCode(location.state.requiresAccessCode);
  }, [location.state]);

  const handleStart = async () => {
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const payload = { token, name, email };
      if (requiresAccessCode) payload.accessCode = accessCode;

      const res = await apiPost("/candidate/start", payload);

      navigate("/test-run", {
        state: { attemptId: res.attemptId },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Start Test</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />

      <input
        placeholder="Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      {requiresAccessCode && (
        <>
          <input
            placeholder="6-digit Access Code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />
          <br />
        </>
      )}

      <button onClick={handleStart} disabled={loading}>
        {loading ? "Starting..." : "Start Test"}
      </button>
    </div>
  );
}
