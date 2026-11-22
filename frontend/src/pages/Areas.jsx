import { useEffect, useState } from "react";
import { api } from "../api.js";
import { NetworkMark, Spinner, ErrorNote } from "../components/ui.jsx";

export default function Areas({ onPick }) {
  const [areas, setAreas] = useState(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("name");

  const load = () => {
    setError("");
    api.areas().then((d) => setAreas(d.areas)).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const sorted = areas
    ? [...areas].sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : (b.rankings[0]?.score ?? 0) - (a.rankings[0]?.score ?? 0)
      )
    : [];

  return (
    <div className="page areas">
      <header className="areas-head">
        <div>
          <h1>Port Harcourt by area</h1>
          <p className="lead">The strongest network in each neighbourhood, and how the others compare.</p>
        </div>
        <label className="sort">
          <span className="small muted">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Area name</option>
            <option value="score">Best score</option>
          </select>
        </label>
      </header>

      {!areas && !error && <Spinner label="Loading areas…" />}
      {error && <ErrorNote message={error} onRetry={load} />}

      {areas && (
        <div className="area-table" role="table" aria-label="Network scores by area">
          <div className="area-row area-row-head" role="row">
            <span role="columnheader">Area</span>
            <span role="columnheader">Best network</span>
            <span role="columnheader">All networks</span>
          </div>
          {sorted.map((a) => {
            const best = a.rankings[0];
            return (
              <button
                key={a.id}
                className="area-row"
                role="row"
                onClick={() => onPick({ lat: a.lat, lng: a.lng, label: `${a.name}, Port Harcourt`, source: "area" })}
              >
                <span role="cell" className="area-name">
                  <b>{a.name}</b>
                  <span className="muted small">{a.readings} readings</span>
                </span>
                <span role="cell" className="area-best">
                  {best?.score != null ? (
                    <>
                      <NetworkMark net={best} size={12} /> <b>{best.name}</b> <span className="area-best-score">{best.score}</span>
                    </>
                  ) : (
                    <span className="muted">No readings yet</span>
                  )}
                </span>
                <span role="cell" className="area-bars">
                  {a.rankings.map((r) => (
                    <span key={r.network} className="area-bar" title={`${r.name}: ${r.score ?? "no data"}`}>
                      <span className="area-bar-label">{r.name}</span>
                      <span className="area-bar-track">
                        <span style={{ width: (r.score ?? 0) + "%", background: r.color }} />
                      </span>
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
