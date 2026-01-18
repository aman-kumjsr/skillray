import { useEffect, useRef, useState } from "react";

export default function useProctoring({
  enabled,
  maxViolations = 3,
  graceSeconds = 30,
  autoSubmitOnGraceExpire = false,
  onViolation,
  onAutoSubmit,
}) {
  /* ---------------- STATE ---------------- */

  const [violations, setViolations] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [graceTime, setGraceTime] = useState(graceSeconds);

  /* ---------------- REFS ---------------- */

  // Prevent duplicate violations during same grace window
  const violationLocked = useRef(false);

  // Has fullscreen ever been entered successfully?
  const hasEnteredFullscreen = useRef(false);

  // Was fullscreen active before the last event?
  const wasFullscreen = useRef(false);

  // Used to ignore fullscreen exits triggered by our own actions
  const intentionalExit = useRef(false);

  /* ---------------- ENTER FULLSCREEN ---------------- */

  useEffect(() => {
    if (!enabled) return;
    if (showViolationModal || violationLocked.current) return;
    if (document.fullscreenElement) return;

    document.documentElement.requestFullscreen().catch(() => {});
  }, [enabled, showViolationModal]);

  /* ---------------- FULLSCREEN CHANGE ---------------- */

  const handleFullscreenChange = () => {
    if (!enabled) return;

    const isFullscreenNow = !!document.fullscreenElement;

    // First successful fullscreen entry → mark & ignore
    if (!hasEnteredFullscreen.current && isFullscreenNow) {
      hasEnteredFullscreen.current = true;
      wasFullscreen.current = true;
      return;
    }

    // REAL fullscreen exit → violation
    if (
      wasFullscreen.current &&
      !isFullscreenNow &&
      !intentionalExit.current
    ) {
      if (violationLocked.current) return;

      violationLocked.current = true;

      const next = violations + 1;
      setViolations(next);

      onViolation?.({
        type: "FULLSCREEN_EXIT",
        count: next,
        timestamp: new Date().toISOString(),
      });

      setShowViolationModal(true);
      setGraceTime(graceSeconds);
    }

    wasFullscreen.current = isFullscreenNow;
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [violations, enabled, showViolationModal]);

  /* ---------------- TAB SWITCH ---------------- */

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        hasEnteredFullscreen.current &&
        !showViolationModal
      ) {
        if (violationLocked.current) return;

        violationLocked.current = true;

        const next = violations + 1;
        setViolations(next);

        onViolation?.({
          type: "TAB_SWITCH",
          count: next,
          timestamp: new Date().toISOString(),
        });

        setShowViolationModal(true);
        setGraceTime(graceSeconds);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [violations, enabled, showViolationModal]);

  /* ---------------- WINDOW MINIMIZE / APP SWITCH ---------------- */

  const handleWindowBlur = () => {
    if (!hasEnteredFullscreen.current || showViolationModal) return;

    if (violationLocked.current) return;

    violationLocked.current = true;

    const next = violations + 1;
    setViolations(next);

    onViolation?.({
      type: "WINDOW_MINIMIZE",
      count: next,
      timestamp: new Date().toISOString(),
    });

    setShowViolationModal(true);
    setGraceTime(graceSeconds);
  };

  useEffect(() => {
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [violations, showViolationModal]);

  /* ---------------- GRACE TIMER ---------------- */

  useEffect(() => {
    if (!showViolationModal) return;

    if (graceTime <= 0) {
      setShowViolationModal(false);

      // Unlock future violations
      violationLocked.current = false;

      if (autoSubmitOnGraceExpire) {
        onAutoSubmit?.();
      }

      return;
    }

    const timer = setInterval(() => {
      setGraceTime((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showViolationModal, graceTime, autoSubmitOnGraceExpire]);

  /* ---------------- RE-ENTER FULLSCREEN ---------------- */

  const reEnterFullscreen = () => {
    intentionalExit.current = true;

    document.documentElement.requestFullscreen().then(() => {
      setShowViolationModal(false);
      intentionalExit.current = false;
    });
  };

  /* ---------------- PUBLIC API ---------------- */

  return {
    violations,
    showViolationModal,
    graceTime,
    reEnterFullscreen,
  };
}
