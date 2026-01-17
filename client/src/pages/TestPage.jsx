import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "../api/api";

export default function TestPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [graceTime, setGraceTime] = useState(30);
  const [autoSubmitOnGraceExpire, setAutoSubmitOnGraceExpire] = useState(false);

  const MAX_VIOLATIONS = 3;

  // 🔐 Proctoring refs
  const hasEnteredFullscreen = useRef(false);
  const wasFullscreen = useRef(false);

  /* -------------------------------------------------- */
  /*  SESSION GUARD                                     */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (location.state?.attemptId) {
      setAttemptId(location.state.attemptId);
      localStorage.setItem("attemptId", location.state.attemptId);
      return;
    }

    const saved = localStorage.getItem("attemptId");
    if (saved) {
      setAttemptId(Number(saved));
      return;
    }

    setError("Invalid test session. Please start test again.");
  }, [location.state]);

  /* -------------------------------------------------- */
  /*  FETCH TEST DATA                                   */
  /* -------------------------------------------------- */

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

        setAutoSubmitOnGraceExpire(data.autoSubmitOnGraceExpire);
        setQuestions(data.questions);

        const startedAt = new Date(data.startedAt).getTime();
        const totalSeconds = data.duration * 60;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setTimeLeft(Math.max(totalSeconds - elapsed, 0));

        const savedAnswers = {};
        data.answers.forEach((a) => {
          savedAnswers[a.questionId] = a.selectedOption;
        });
        setAnswers(savedAnswers);
      })
      .catch((err) => setError(err.message));
  }, [attemptId, navigate]);

  /* -------------------------------------------------- */
  /*  ENTER FULLSCREEN ON START                          */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!questions.length || submitted || showViolationModal) return;
    if (document.fullscreenElement) return;

    document.documentElement.requestFullscreen().catch(() => { });
  }, [questions.length, submitted, showViolationModal]);

  /* -------------------------------------------------- */
  /*  FULLSCREEN CHANGE HANDLER (CORE FIX)               */
  /* -------------------------------------------------- */

  const handleFullscreenChange = () => {
    const isFullscreenNow = !!document.fullscreenElement;

    // Ignore before test loads
    if (!questions.length) return;

    // First time fullscreen entry → mark & ignore
    if (!hasEnteredFullscreen.current && isFullscreenNow) {
      hasEnteredFullscreen.current = true;
      wasFullscreen.current = true;
      return;
    }

    // Ignore noise
    if (!hasEnteredFullscreen.current || submitted || showViolationModal) return;

    // REAL exit from fullscreen
    if (wasFullscreen.current && !isFullscreenNow) {
      const next = violations + 1;
      setViolations(next);

      if (next > MAX_VIOLATIONS) {
        submitTest(true);
        return;
      }

      setShowViolationModal(true);
      setGraceTime(30);
    }

    wasFullscreen.current = isFullscreenNow;
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [questions.length, violations, submitted, showViolationModal]);

  /* -------------------------------------------------- */
  /*  TAB SWITCH / VISIBILITY                            */
  /* -------------------------------------------------- */

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        hasEnteredFullscreen.current &&
        !submitted &&
        !showViolationModal
      ) {
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

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [violations, submitted, showViolationModal]);

  /* -------------------------------------------------- */
  /*  GRACE TIMER                                       */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!showViolationModal) return;

    if (graceTime <= 0) {
      setShowViolationModal(false);
      if (autoSubmitOnGraceExpire) submitTest(true);
      return;
    }

    const timer = setInterval(() => {
      setGraceTime((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showViolationModal, graceTime, autoSubmitOnGraceExpire]);

  /* -------------------------------------------------- */
  /*  TIMER + AUTO SUBMIT                                */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (submitted || timeLeft === null) return;

    if (timeLeft <= 0 && attemptId) {
      submitTest(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId, submitted]);

  /* -------------------------------------------------- */
  /*  ANSWER SAVE                                       */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /*  SUBMIT                                            */
  /* -------------------------------------------------- */

  const submitTest = async (auto = false) => {
    if (submitted) return;
    setSubmitted(true);

    try {
      const res = await apiPost("/answers/submit", { attemptId });
      localStorage.removeItem("attemptId");

      navigate("/result", {
        replace: true,
        state: { result: res, autoSubmitted: auto },
      });
    } catch {
      setError("Failed to submit test");
    }
  };

  /* -------------------------------------------------- */
  /*  RE-ENTER FULLSCREEN                               */
  /* ---------------------------------------------------*/

  const reEnterFullscreen = () => {
    document.documentElement.requestFullscreen().then(() => {
      setShowViolationModal(false);
    });
  };

  /* -------------------------------------------------- */
  /*  UI                                                */
  /* -------------------------------------------------- */

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
      >
        Submit Test
      </button>

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
            Violations: <b>{violations}</b> / {MAX_VIOLATIONS}
          </p>
          <p>
            Return to fullscreen within <b>{graceTime}s</b>
          </p>
          <button onClick={reEnterFullscreen}>Return to Fullscreen</button>
        </div>
      )}

      {questions.map((q, i) => (
        <div key={q.id}>
          <p>
            <b>
              Q{i + 1}. {q.text}
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