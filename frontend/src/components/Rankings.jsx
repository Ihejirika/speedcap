import { useState } from "react";
import { SignalBars, NetworkMark, confidenceText } from "./ui.jsx";

const PARTS = [
  { key: "download", label: "Download", weight: "40%" },
  { key: "latency", label: "Response time", weight: "25%" },
  { key: "upload", label: "Upload", weight: "20%" },
  { key: "stability", label: "Stability", weight: "15%" },
];

export default function Rankings({ rankings }) {
  const [open, setOpen] = useState(rankings[0]?.network);

  return (
    <ol className="rankings">
      {rankings.map((r, i) => {
        const isOpen = open === r.network && r.score != null;
        return (
          <li key={r.network} className={"rank" + (i === 0 && r.score != null ? " is-best" : "") + (r.score == null ? " is-empty" : "")}>
            <button
              className="rank-row"
              onClick={() => setOpen(isOpen ? null : r.network)}
              aria-expanded={isOpen}
              disabled={r.score == null}
            >
              <span className="rank-pos">{r.score == null ? "–" : i + 1}</span>
              <span className="rank-name">
                <NetworkMark net={r} size={14} />
                <b>{r.name}</b>
              </span>
              <span className="rank-meta">
                {r.score == null ? (
                  confidenceText.none
                ) : (
                  <>
                    {r.averages.download} Mbps down, {r.averages.latency} ms
                  </>
                )}
              </span>
              <span className="rank-score">
                <SignalBars score={r.score} color={i === 0 ? "var(--cobalt)" : "var(--ink-soft)"} />
                <b>{r.score ?? "–"}</b>
              </span>
            </button>

            {isOpen && (
              <div className="rank-detail">
                <div className="parts">
                  {PARTS.map((p) => (
                    <div className="part" key={p.key}>
                      <span className="part-label">
                        {p.label} <i>counts {p.weight}</i>
                      </span>
                      <span className="part-track">
                        <span style={{ width: r.parts[p.key] + "%" }} />
                      </span>
                      <span className="part-val">{r.parts[p.key]}</span>
                    </div>
                  ))}
                </div>
                <dl className="averages">
                  <div><dt>Download</dt><dd>{r.averages.download} Mbps</dd></div>
                  <div><dt>Upload</dt><dd>{r.averages.upload} Mbps</dd></div>
                  <div><dt>Response time</dt><dd>{r.averages.latency} ms</dd></div>
                  <div><dt>Jitter</dt><dd>{r.averages.jitter} ms</dd></div>
                </dl>
                <p className="small muted">
                  Based on {r.readings} reading{r.readings === 1 ? "" : "s"}
                  {r.realReadings < r.readings ? `, ${r.readings - r.realReadings} of them sample data` : ""}. {confidenceText[r.confidence]}.
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
