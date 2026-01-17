import { useEffect, useRef, useState } from "react";

export default function useProctoring({
    enabled,
    maxViolations = 3,
    graceSeconds = 30,
    autoSubmitOnGraceExpire = false,
    onAutoSubmit,
}) {
    /* ---------------- STATE ---------------- */

    const [violations, setViolations] = useState(0);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [graceTime, setGraceTime] = useState(graceSeconds);

    /* ---------------- REFS ---------------- */

    // Has fullscreen ever been entered successfully?
    const hasEnteredFullscreen = useRef(false);

    // Was fullscreen active BEFORE the last event?
    const wasFullscreen = useRef(false);

    /* ---------------- ENTER FULLSCREEN ---------------- */

    useEffect(() => {
        if (!enabled) return;
        if (showViolationModal) return;
        if (document.fullscreenElement) return;

        document.documentElement.requestFullscreen().catch(() => { });
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

        // Ignore noise before test really starts
        if (!hasEnteredFullscreen.current || showViolationModal) return;

        // REAL fullscreen exit → violation
        if (wasFullscreen.current && !isFullscreenNow) {
            const next = violations + 1;
            setViolations(next);

            if (next > maxViolations) {
                onAutoSubmit?.();
                return;
            }

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

    /* ---------------- TAB SWITCH / VISIBILITY ---------------- */

    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (
                document.visibilityState === "hidden" &&
                hasEnteredFullscreen.current &&
                !showViolationModal
            ) {
                const next = violations + 1;
                setViolations(next);

                if (next > maxViolations) {
                    onAutoSubmit?.();
                    return;
                }

                setShowViolationModal(true);
                setGraceTime(graceSeconds);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [violations, enabled, showViolationModal]);

    /* ---------------- GRACE TIMER ---------------- */

    useEffect(() => {
        if (!showViolationModal) return;

        if (graceTime <= 0) {
            setShowViolationModal(false);

            if (autoSubmitOnGraceExpire) {
                onAutoSubmit?.();
            }

            return;
        }

        const timer = setInterval(() => {
            setGraceTime((t) => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [showViolationModal, graceTime, onAutoSubmit]);

    /* ---------------- RE-ENTER FULLSCREEN ---------------- */

    const reEnterFullscreen = () => {
        document.documentElement.requestFullscreen().then(() => {
            setShowViolationModal(false);
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
