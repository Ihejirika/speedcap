import { useRef, useState } from "react";
import Gauge from "../components/Gauge.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import { NetworkMark, ErrorNote } from "../components/ui.jsx";
import { api, NETWORKS } from "../api.js";
import { measurePing, measureDownload, measureUpload } from "../speedtest.js";

const PHASES = [
  { id: "ping", label: "Response time" },
  { id: "download", label: "Download" },
  { id: "upload", label: "Upload" },
];

export default function SpeedTest({ place, onPick, go }) {
  const [phase, setPhase] = useState("idle"); // idle | ping | download | upload | done
  const [live, setLive] = useState(0);
  const [result, setResult] = useState({});
  const [error, setError] = useState("");
  const [network, setNetwork] = useState("");
  const [share, setShare] = useState({ state: "idle", message: "" });
  const abort = useRef(null);

  const start = async () => {
    setError("");
    setResult({});
    setShare({ state: "idle", message: "" });
    setLive(0);
    abort.current = new AbortController();
    const signal = abort.current.signal;
    try {
      setPhase("ping");
      const ping = await measurePing(12);
      setResult((r) => ({ ...r, ...ping }));

      setPhase("download");
      setLive(0);
      const download = await measureDownload({ signal, onProgress: (_, v) => setLive(v) });
      setResult((r) => ({ ...r, download }));

      setPhase("upload");
      setLive(0);
      const upload = await measureUpload({ signal, onProgress: (_, v) => setLive(v) });
      setResult((r) => ({ ...r, upload }));
      setLive(download);
      setPhase("done");
    } catch (e) {
      setPhase("idle");
      setLive(0);
      if (e.name !== "AbortError") setError("The test stopped because the server couldn't be reached. Check your connection and try again.");
    }
  };

  const cancel = () => abort.current?.abort();

  const submit = async () => {
    setShare({ state: "saving", message: "" });
    try {
      const res = await api.saveReading({ network, lat: place.lat, lng: place.lng, ...result });
      setShare({ state: "saved", message: res.nearestArea ? `Shared for ${res.nearestArea}.` : "Shared for your location." });
    } catch (e) {
      setShare({ state: "error", message: e.message });
    }
  };

  const running = ["ping", "download", "upload"].includes(phase);
  const gaugeLabel = phase === "upload" ? "Upload" : phase === "done" ? "Download" : phase === "ping" ? "Measuring response time" : "Download";

  return (
    <div className="page speedtest">
      <div className="st-head">
        <h1>Test my speed</h1>
        <p className="lead">
          Turn off Wi-Fi so the test measures your mobile network. It uses about 30 to 80 MB of data on a fast
          connection.
        </p>
      </div>

      <div className="st-grid">
        <div className="st-dial">
          <Gauge value={phase === "ping" ? 0 : live} active={running} label={gaugeLabel} />
          <div className="st-actions">
            {running ? (
              <button className="btn btn-quiet btn-lg" onClick={cancel}>Stop test</button>
            ) : (
              <button className="btn btn-primary btn-lg st-go" onClick={start}>
                {phase === "done" ? "Test again" : "Start test"}
              </button>
            )}
          </div>
          {error && <ErrorNote message={error} />}
        </div>

        <div className="st-side">
          <ol className="st-phases">
            {PHASES.map((p) => {
              const value =
                p.id === "ping"
                  ? result.latency != null && `${result.latency} ms`
                  : result[p.id] != null && `${result[p.id]} Mbps`;
              const isNow = phase === p.id;
              return (
                <li key={p.id} className={(isNow ? "is-now " : "") + (value ? "is-done" : "")}>
                  <span>{p.label}</span>
                  <b>{value || (isNow ? "Testing…" : "–")}</b>
                </li>
              );
            })}
            <li className={result.jitter != null ? "is-done" : ""}>
              <span>Jitter</span>
              <b>{result.jitter != null ? `${result.jitter} ms` : "–"}</b>
            </li>
          </ol>

          {phase === "done" && share.state !== "saved" && (
            <div className="share">
              <h2>Share this result</h2>
              <p className="muted small">Which network were you on?</p>
              <div className="net-picker" role="radiogroup" aria-label="Network">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    role="radio"
                    aria-checked={network === n.id}
                    className={"net-chip" + (network === n.id ? " is-on" : "")}
                    style={{ "--net": n.color }}
                    onClick={() => setNetwork(n.id)}
                  >
                    <NetworkMark net={n} /> {n.name}
                  </button>
                ))}
              </div>

              {place ? (
                <p className="muted small share-place">
                  Location: {place.label || "your current position"}. Saved to the nearest 100 m.
                </p>
              ) : (
                <div className="share-loc">
                  <p className="muted small">Where did you run this test?</p>
                  <LocationPicker onPick={onPick} compact />
                </div>
              )}

              <button className="btn btn-dark btn-block" disabled={!network || !place || share.state === "saving"} onClick={submit}>
                {share.state === "saving" ? "Sharing…" : "Share result"}
              </button>
              {share.state === "error" && <p className="picker-error" role="alert">{share.message}</p>}
            </div>
          )}

          {share.state === "saved" && (
            <div className="share share-done" role="status">
              <h2>Thanks, result shared</h2>
              <p className="muted">{share.message} It now counts towards the ranking for this area.</p>
              <button className="btn btn-primary btn-block" onClick={() => go("results")}>
                See networks near me
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
