import { useEffect, useRef, useState } from "react";

export default function useProctoring({
  enabled = true,
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

  // Prevent duplicate violations during one grace window
  const violationLocked = useRef(false);

  // Fullscreen lifecycle tracking
  const hasEnteredFullscreen = useRef(false);
  const wasFullscreen = useRef(false);
  const intentionalExit = useRef(false);

  // ✅ FIX: real grace window tracking (NO race conditions)
  const graceStartedAtRef = useRef(null);

  /* ---------------- HELPER ---------------- */

  const triggerViolation = (type) => {
    if (violationLocked.current) return;

    const nextCount = violations + 1;
    setViolations(nextCount);

    // Check threshold immediately
    if (nextCount >= maxViolations) {
      onAutoSubmit?.();
      return; // Don't show modal if we are submitting
    }

    violationLocked.current = true;
    graceStartedAtRef.current = Date.now();
    setGraceTime(graceSeconds);
    setShowViolationModal(true);

    onViolation?.({ type, count: nextCount, timestamp: new Date().toISOString() });
  };

  /* ---------------- ENTER FULLSCREEN ---------------- */

  useEffect(() => {
    if (!enabled) return;
    if (showViolationModal || violationLocked.current) return;
    if (document.fullscreenElement) return;

    document.documentElement.requestFullscreen().catch(() => { });
  }, [enabled, showViolationModal]);

  /* ---------------- FULLSCREEN CHANGE ---------------- */

  const handleFullscreenChange = () => {
    if (!enabled) return;

    const isFullscreenNow = !!document.fullscreenElement;

    // First valid fullscreen entry
    if (!hasEnteredFullscreen.current && isFullscreenNow) {
      hasEnteredFullscreen.current = true;
      wasFullscreen.current = true;
      return;
    }

    // Real fullscreen exit → violation
    if (
      wasFullscreen.current &&
      !isFullscreenNow &&
      !intentionalExit.current
    ) {
      triggerViolation("FULLSCREEN_EXIT");
    }

    wasFullscreen.current = isFullscreenNow;
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [enabled, violations]);

  /* ---------------- TAB SWITCH ---------------- */

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        hasEnteredFullscreen.current &&
        !showViolationModal
      ) {
        triggerViolation("TAB_SWITCH");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, showViolationModal, violations]);

  /* ---------------- WINDOW MINIMIZE ---------------- */

  const handleWindowBlur = () => {
    if (!hasEnteredFullscreen.current || showViolationModal) return;
    triggerViolation("WINDOW_MINIMIZE");
  };

  useEffect(() => {
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [showViolationModal, violations]);

  /* ---------------- GRACE TIMER (FIXED) ---------------- */

  useEffect(() => {
    if (!showViolationModal) return;
    if (!graceStartedAtRef.current) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - graceStartedAtRef.current) / 1000
      );
      const remaining = graceSeconds - elapsed;

      if (remaining <= 0) {
        setShowViolationModal(false);
        violationLocked.current = false;
        graceStartedAtRef.current = null;

        // ❗ Grace expired & user did NOT comply
        if (autoSubmitOnGraceExpire && !document.fullscreenElement) {
          onAutoSubmit?.();
        }

        clearInterval(timer);
        return;
      }

      setGraceTime(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [showViolationModal, autoSubmitOnGraceExpire]);

  /* ---------------- RE-ENTER FULLSCREEN ---------------- */

  /* ---------------- RE-ENTER FULLSCREEN ---------------- */

  const reEnterFullscreen = async () => {
    try {
      // 1. Tell the listener this is a known change
      intentionalExit.current = true;

      // 2. Request Fullscreen (Must happen before state changes for browser permission)
      await document.documentElement.requestFullscreen();

      // 3. Reset all locks so a SECOND violation can happen immediately if they exit again
      setShowViolationModal(false);
      violationLocked.current = false; // <--- CRITICAL FIX
      graceStartedAtRef.current = null;
      intentionalExit.current = false;

    } catch (err) {
      console.error("Fullscreen restoration failed:", err);
      // If it fails, keep the modal open so they try again
      intentionalExit.current = false;
    }
  };

  /* ---------------- PUBLIC API ---------------- */

  return {
    violations,
    showViolationModal,
    graceTime,
    reEnterFullscreen,
  };
}
