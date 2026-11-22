import { useEffect, useState } from "react";
import LocationPicker from "../components/LocationPicker.jsx";
import { SignalBars, NetworkMark } from "../components/ui.jsx";
import { api, AREAS } from "../api.js";

const FEATURED = AREAS.find((a) => a.id === "rumuokoro");

export default function Home({ onPick, go }) {
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.recommend(FEATURED.lat, FEATURED.lng).then(setPreview).catch(() => {});
    api.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <h1>Which network works best on your street?</h1>
          <p className="lead">
            SpeedCap ranks MTN, Airtel, Glo and 9mobile using speed tests from people near you, so you can pick the
            SIM that actually works where you live, study or work.
          </p>
          <LocationPicker onPick={onPick} />
        </div>

        <figure className="hero-card" aria-label="Example ranking for Rumuokoro">
          <figcaption>
            <span className="hero-card-place">{FEATURED.name}</span>
            <span className="muted small">Within {preview?.radiusKm ?? 2} km</span>
          </figcaption>
          <ol>
            {(preview?.rankings ?? placeholder).map((r, i) => (
              <li key={r.network} className={i === 0 ? "is-best" : ""}>
                <NetworkMark net={r} size={12} />
                <b>{r.name}</b>
                <span className="muted small">{r.averages ? `${r.averages.download} Mbps` : "…"}</span>
                <SignalBars score={r.score} color={i === 0 ? "var(--cobalt)" : "var(--ink-soft)"} size={20} />
                <span className="hero-score">{r.score ?? "–"}</span>
              </li>
            ))}
          </ol>
          <button className="hero-card-link" onClick={() => onPick({ lat: FEATURED.lat, lng: FEATURED.lng, label: "Rumuokoro, Port Harcourt", source: "area" })}>
            See full results for Rumuokoro
          </button>
        </figure>
      </section>

      <section className="how">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            <h3>Share your location</h3>
            <p>Or pick your area. SpeedCap looks at readings within a few kilometres of you.</p>
          </li>
          <li>
            <span className="step-num">2</span>
            <h3>See networks ranked</h3>
            <p>Each network gets a score out of 100 from download speed, response time, upload and stability.</p>
          </li>
          <li>
            <span className="step-num">3</span>
            <h3>Add your own test</h3>
            <p>Run a 20-second speed test and share it. Every result makes the ranking more accurate for your area.</p>
          </li>
        </ol>
        <div className="how-cta">
          <button className="btn btn-dark btn-lg" onClick={() => go("test")}>Test my speed</button>
          {stats && (
            <p className="muted small">
              {stats.totals.real.toLocaleString()} real speed test{stats.totals.real === 1 ? "" : "s"} shared so far.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

const placeholder = ["mtn", "airtel", "glo", "9mobile"].map((id) => ({
  network: id,
  name: { mtn: "MTN", airtel: "Airtel", glo: "Glo", "9mobile": "9mobile" }[id],
  color: { mtn: "#FFCB05", airtel: "#E4002B", glo: "#3FA535", "9mobile": "#0E6B4F" }[id],
  score: null,
}));
