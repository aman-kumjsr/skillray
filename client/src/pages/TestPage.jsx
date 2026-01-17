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
  const [violations, setViolations] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [graceTime, setGraceTime] = useState(30); // seconds
  const MAX_VIOLATIONS = 3;


  // Enter full screen mode when test starts
  useEffect(() => {
  if (!questions.length || showViolationModal || submitted) return;
  if (document.fullscreenElement) return;

  document.documentElement.requestFullscreen().catch(() => {});
}, [questions, showViolationModal, submitted]);


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
        replace: true, // 🔒 removes test page from history - helps to lock nav after submission of test
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

  const handleFullscreenExit = () => {
    if (!document.fullscreenElement && !submitted && !showViolationModal) {
      const next = violations + 1;
      setViolations(next);

      if (next > MAX_VIOLATIONS) {
        submitTest(true);
        return;
      }

      setShowViolationModal(true);
      setGraceTime(30);
    }
  };



  useEffect(() => {
    if (!showViolationModal) return;

    if (graceTime <= 0) {
      setShowViolationModal(false);
      return;
    }

    const timer = setInterval(() => {
      setGraceTime(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showViolationModal, graceTime]);


  const reEnterFullscreen = () => {
    document.documentElement.requestFullscreen().then(() => {
      setShowViolationModal(false);
    });
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenExit);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenExit);
    };
  }, [violations, submitted, showViolationModal]);




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

      {showViolationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)",
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
            Violations: <b>{violations}</b> / {MAX_VIOLATIONS}
          </p>

          <p>
            Please return to fullscreen within <b>{graceTime}s</b>
          </p>

          <button
            onClick={reEnterFullscreen}
            style={{
              padding: "10px 16px",
              marginTop: "20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Return to Fullscreen
          </button>
        </div>
      )}

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
