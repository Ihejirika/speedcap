import { useState } from "react";
import { AREAS, getPosition } from "../api.js";

export default function LocationPicker({ onPick, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const useMine = async () => {
    setBusy(true);
    setError("");
    try {
      const p = await getPosition();
      onPick({ ...p, source: "gps" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={"picker" + (compact ? " picker-compact" : "")}>
      <button className="btn btn-primary btn-lg" onClick={useMine} disabled={busy}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {busy ? "Finding you…" : "Use my location"}
      </button>

      <label className="area-select">
        <span className="sr-only">Or pick an area in Port Harcourt</span>
        <select
          defaultValue=""
          onChange={(e) => {
            const a = AREAS.find((x) => x.id === e.target.value);
            if (a) onPick({ lat: a.lat, lng: a.lng, label: `${a.name}, Port Harcourt`, source: "area" });
          }}
        >
          <option value="" disabled>
            Or pick an area in Port Harcourt
          </option>
          {AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="picker-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
