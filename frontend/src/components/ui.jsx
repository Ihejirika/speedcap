// Small shared building blocks.

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--cobalt)" />
        <rect x="7" y="18" width="4" height="7" rx="1.5" fill="#fff" />
        <rect x="14" y="13" width="4" height="12" rx="1.5" fill="#fff" />
        <rect x="21" y="7" width="4" height="18" rx="1.5" fill="#fff" />
      </svg>
      speedcap
    </span>
  );
}

// Four signal bars, filled according to a 0-100 score.
export function SignalBars({ score, color = "var(--cobalt)", size = 22 }) {
  const filled = score == null ? 0 : Math.max(1, Math.ceil(score / 25));
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={1 + i * 6}
          y={18 - i * 5}
          width="4"
          height={5 + i * 5}
          rx="1.2"
          fill={i < filled ? color : "var(--line-strong)"}
        />
      ))}
    </svg>
  );
}

export function NetworkMark({ net, size = 12 }) {
  return <span className="net-mark" style={{ background: net.color, width: size, height: size }} aria-hidden="true" />;
}

export function Spinner({ label }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  return (
    <div className="error-note" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-quiet" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export const confidenceText = {
  high: "Many readings",
  medium: "Some readings",
  low: "Few readings",
  none: "No readings yet",
};
