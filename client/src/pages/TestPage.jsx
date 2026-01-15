import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";

export default function TestPage() {
  const location = useLocation();

  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Guard against refresh / direct access
  useEffect(() => {
    if (!location.state || !location.state.attemptId) {
      setError("Invalid test session. Please start test again.");
      return;
    }

    setAttemptId(location.state.attemptId);
  }, [location.state]);

  // Fetch questions & duration
  useEffect(() => {
    if (!attemptId) return;

    apiGet(`/candidate/test/${attemptId}`)
      .then((data) => {
        setQuestions(data.questions);
        setTimeLeft(data.duration * 60); // minutes → seconds
      })
      .catch((err) => setError(err.message));
  }, [attemptId]);

  // Simple timer ONLY (no auto-submit)
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelect = async (questionId, option) => {
    try {
      await apiPost("/answers/save", {
        attemptId,
        questionId,
        selectedOption: option,
      });
    } catch {
      console.error("Auto-save failed");
    }
  };

  if (error) return <h2 style={{ color: "red" }}>{error}</h2>;
  if (!questions.length) return <h2>Loading test...</h2>;

  return (
    <div>
      <h2>
        Time Left: {Math.floor(timeLeft / 60)}:
        {String(timeLeft % 60).padStart(2, "0")}
      </h2>

      {questions.map((q, index) => (
        <div key={q.id} style={{ marginBottom: "20px" }}>
          <p>
            <b>
              Q{index + 1}. {q.text}
            </b>
          </p>

          {["A", "B", "C", "D"].map((opt) => (
            <label key={opt} style={{ display: "block" }}>
              <input
                type="radio"
                name={`q-${q.id}`}
                onChange={() => handleSelect(q.id, opt)}
              />
              {q[`option${opt}`]}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
