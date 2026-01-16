import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";

export default function TestPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false); // 🔒 guard
  const [answers, setAnswers] = useState({});

  // Guard against refresh / direct access
  useEffect(() => {
    // 1️⃣ Try from navigation state
    if (location.state?.attemptId) {
      setAttemptId(location.state.attemptId);
      localStorage.setItem("attemptId", location.state.attemptId);
      return;
    }

    // 2️⃣ Try from localStorage (refresh case)
    const savedAttemptId = localStorage.getItem("attemptId");
    if (savedAttemptId) {
      setAttemptId(Number(savedAttemptId));
      return;
    }

    // 3️⃣ No session found
    setError("Invalid test session. Please start test again.");
  }, [location.state]);


  // Fetch questions + duration
  useEffect(() => {
    if (!attemptId) return;

    apiGet(`/candidate/test/${attemptId}`)
      .then((data) => {
        setQuestions(data.questions);

        const startedAt = new Date(data.startedAt).getTime();
        const now = Date.now();

        const totalSeconds = data.duration * 60;
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        const remaining = totalSeconds - elapsedSeconds;

        setTimeLeft(remaining > 0 ? remaining : 0);

        const savedAnswers = {};
        data.answers.forEach(a => {
          savedAnswers[a.questionId] = a.selectedOption;
        });
        setAnswers(savedAnswers);


      })
      .catch((err) => setError(err.message));
  }, [attemptId]);

  // Submit test (used by auto-submit)
  const submitTest = async (auto = false) => {
    if (submitted) return;
    setSubmitted(true);

    try {
      const res = await apiPost("/answers/submit", { attemptId });

      localStorage.removeItem("attemptId"); // ✅ clear session

      navigate("/result", {
        state: {
          result: res,
          autoSubmitted: auto,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Failed to submit test");
    }
  };

  // Timer + AUTO-SUBMIT
  useEffect(() => {
    if (submitted) return;

    //  Do nothing until timeLeft is loaded
    if (timeLeft === null) return;

    //  Auto-submit only when countdown finishes
    if (timeLeft <= 0 && attemptId) {
      submitTest(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId, submitted]);

  // Auto-save answer
  const handleSelect = async (questionId, option) => {
    if (submitted) return;

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

      <button
        onClick={() => {
          const confirmSubmit = window.confirm(
            "Are you sure you want to submit the test?"
          );
          if (confirmSubmit) {
            submitTest(false);
          }
        }}
        disabled={submitted}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Submit Test
      </button>


      {questions.map((q, index) => (
        <div key={q.id} style={{ marginBottom: "20px" }}>
          <p><b>Q{index + 1}. {q.text}</b></p>

          {["A", "B", "C", "D"].map((opt) => (
            <label key={opt} style={{ display: "block" }}>
              <input
                type="radio"
                checked={answers[q.id] === opt}
                onChange={() => {
                  setAnswers(prev => ({ ...prev, [q.id]: opt }));
                  handleSelect(q.id, opt);
                }}
              />

              {q[`option${opt}`]}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
