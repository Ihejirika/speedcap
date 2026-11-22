import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import MapView from "../components/MapView.jsx";
import Rankings from "../components/Rankings.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import { Spinner, ErrorNote } from "../components/ui.jsx";

export default function Results({ place, onPick, go }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!place) return;
    setLoading(true);
    setError("");
    api
      .recommend(place.lat, place.lng)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [place]);

  useEffect(load, [load]);

  if (!place) {
    return (
      <div className="page narrow">
        <h1>Find the best network near you</h1>
        <p className="lead">Share your location or pick an area to see how each network performs there.</p>
        <LocationPicker onPick={onPick} />
      </div>
    );
  }

  const label = data?.location.label || place.label || "Your location";
  const best = data?.best;
  const sampleShare = data && data.totalReadings ? data.sampleReadings / data.totalReadings : 0;

  return (
    <div className="page results">
      <header className="results-head">
        <div>
          <p className="muted">Best network near</p>
          <h1>{label}</h1>
        </div>
        <details className="change-place">
          <summary className="btn btn-quiet">Change location</summary>
          <div className="change-pop">
            <LocationPicker onPick={onPick} compact />
          </div>
        </details>
      </header>

      {loading && !data && <Spinner label="Checking networks near you…" />}
      {error && <ErrorNote message={error} onRetry={load} />}

      {data && (
        <div className="results-grid">
          <div className="results-main">
            {best ? (
              <div className="verdict" style={{ "--net": best.color }}>
                <span className="verdict-mark" />
                <div>
                  <p className="verdict-title">
                    {best.name} is your best bet here, with a score of {best.score}.
                  </p>
                  <p className="muted">
                    Around {best.averages.download} Mbps download and {best.averages.latency} ms response time, from{" "}
                    {data.totalReadings} readings within {data.radiusKm} km.
                  </p>
                </div>
              </div>
            ) : (
              <div className="verdict verdict-empty">
                <div>
                  <p className="verdict-title">No one has tested here yet.</p>
                  <p className="muted">Run a speed test to give this area its first result.</p>
                </div>
              </div>
            )}

            <Rankings rankings={data.rankings} key={label} />

            {sampleShare > 0 && (
              <p className="sample-note">
                {sampleShare === 1 ? "All" : `${Math.round(sampleShare * 100)}%`} of the readings here are sample data
                used to start SpeedCap off. Real speed tests replace them over time.
              </p>
            )}
          </div>

          <aside className="results-side">
            <MapView lat={data.location.lat} lng={data.location.lng} radiusKm={data.radiusKm} label={label} color={best?.color === "#FFCB05" ? "#C99A00" : best?.color} />
            <div className="side-cta">
              <h2>Help your area</h2>
              <p className="muted">Test your connection here and share it. It takes about 20 seconds.</p>
              <button className="btn btn-primary btn-block" onClick={() => go("test")}>
                Test my speed
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
