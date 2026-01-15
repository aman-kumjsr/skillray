import { useLocation } from "react-router-dom";

export default function Result() {
  const location = useLocation();
  const { result, autoSubmitted } = location.state || {};

  if (!result) return <h2>Invalid result</h2>;

  return (
    <div>
      <h1>Test Submitted</h1>

      {autoSubmitted && (
        <p style={{ color: "orange" }}>
          ⏱️ Auto-submitted due to time expiry
        </p>
      )}

      <p>
        Score: <b>{result.score}</b> / {result.total}
      </p>

      {result.timeTakenMinutes && (
        <p>Time Taken: {result.timeTakenMinutes} minutes</p>
      )}
    </div>
  );
}
