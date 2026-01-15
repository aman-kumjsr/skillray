import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api/api";

export default function PublicTest() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [test, setTest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet(`/public/test/${token}`)
      .then((data) => {
        setTest(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <h2>Loading test...</h2>;
  if (error) return <h2 style={{ color: "red" }}>{error}</h2>;

  return (
  <div>
    <h1>{test.title}</h1>
    <p>Duration: {test.duration} minutes</p>

    {test.requiresAccessCode && (
      <p style={{ color: "orange" }}>
        🔒 Access code required to start this test
      </p>
    )}

    <button
      onClick={() =>
        navigate("/start", {
          state: {
            token,
            requiresAccessCode: test.requiresAccessCode,
          },
        })
      }
    >
      Start Test
    </button>
  </div>
);

}
