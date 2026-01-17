import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";
import useProctoring from "../hooks/useProctoring";

export default function TestPage() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */

  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- SESSION GUARD ---------------- */

  useEffect(() => {
    if (location.state?.attemptId) {
      setAttemptId(location.state.attemptId);
      localStorage.setItem("attemptId", location.state.attemptId);
      return;
    }

    const savedAttemptId = localStorage.getItem("attemptId");
    if (savedAttemptId) {
      setAttemptId(Number(savedAttemptId));
      return;
    }

    setError("Invalid test session. Please start the test again.");
  }, [location.state]);

  /* ---------------- FETCH TEST ---------------- */

  useEffect(() => {
    if (!attemptId) return;

    apiGet(`/candidate/test/${attemptId}`)
      .then((data) => {
        if (data.submittedAt) {
          navigate("/result", {
            replace: true,
            state: {
              result: { message: "Test already submitted" },
              autoSubmitted: false,
            },
          });
          return;
        }

        setQuestions(data.questions);

        // Restore answers
        const restored = {};
        data.answers.forEach((a) => {
          restored[a.questionId] = a.selectedOption;
        });
        setAnswers(restored);

        // Calculate remaining time
        const startedAt = new Date(data.startedAt).getTime();
        const totalSeconds = data.duration * 60;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setTimeLeft(Math.max(totalSeconds - elapsed, 0));
      })
      .catch((err) => setError(err.message));
  }, [attemptId, navigate]);

  /* ---------------- SUBMIT ---------------- */

  const submitTest = async (auto = false) => {
    if (submitted) return;
    setSubmitted(true);

    try {
      const res = await apiPost("/answers/submit", { attemptId });
      localStorage.removeItem("attemptId");

      navigate("/result", {
        replace: true,
        state: {
          result: res,
          autoSubmitted: auto,
        },
      });
    } catch {
      setError("Failed to submit test");
    }
  };

  /* ---------------- PROCTORING (HOOK) ---------------- */

  const {
    showViolationModal,
    violations,
    graceTime,
    reEnterFullscreen,
  } = useProctoring({
    enabled: questions.length > 0 && !submitted,
    maxViolations: 3,
    graceSeconds: 30,
    onAutoSubmit: () => submitTest(true),
  });

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (submitted || timeLeft === null) return;

    if (timeLeft <= 0) {
      submitTest(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  /* ---------------- ANSWER SAVE ---------------- */

  const handleSelect = async (questionId, option) => {
    if (submitted) return;

    setAnswers((prev) => ({ ...prev, [questionId]: option }));

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

  /* ---------------- UI ---------------- */

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
          if (window.confirm("Are you sure you want to submit the test?")) {
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

      {/* ----------- VIOLATION MODAL ----------- */}
      {showViolationModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <h2>⚠️ Fullscreen Required</h2>
          <p>
            Violations: <b>{violations}</b> / 3
          </p>
          <p>
            Please return to fullscreen within <b>{graceTime}s</b>
          </p>
          <button
            onClick={reEnterFullscreen}
            style={{ padding: "10px 16px", marginTop: "20px" }}
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {/* ----------- QUESTIONS ----------- */}
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
                checked={answers[q.id] === opt}
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
