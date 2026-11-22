// Speedometer dial. Uses a stretched scale so slow and fast connections both read clearly.
const STOPS = [0, 1, 5, 10, 20, 30, 50, 75, 100];
const START = -225; // degrees
const SWEEP = 270;

function toFraction(v) {
  if (v <= 0) return 0;
  for (let i = 1; i < STOPS.length; i++) {
    if (v <= STOPS[i]) {
      const f = (v - STOPS[i - 1]) / (STOPS[i] - STOPS[i - 1]);
      return (i - 1 + f) / (STOPS.length - 1);
    }
  }
  return 1;
}

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

function arc(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export default function Gauge({ value = 0, unit = "Mbps", label, active }) {
  const cx = 160, cy = 160, r = 128;
  const f = toFraction(value);
  const end = START + SWEEP * f;
  const [nx, ny] = polar(cx, cy, r, end);

  return (
    <div className={"gauge" + (active ? " is-active" : "")}>
      <svg viewBox="0 0 320 290" role="img" aria-label={`${label || "Speed"}: ${value.toFixed(1)} ${unit}`}>
        <path d={arc(cx, cy, r, START, START + SWEEP)} className="gauge-track" />
        {f > 0.001 && <path d={arc(cx, cy, r, START, end)} className="gauge-fill" />}
        {STOPS.map((s, i) => {
          const deg = START + (SWEEP * i) / (STOPS.length - 1);
          const [tx, ty] = polar(cx, cy, r - 30, deg);
          return (
            <text key={s} x={tx} y={ty} className="gauge-tick" textAnchor="middle" dominantBaseline="middle">
              {s}
            </text>
          );
        })}
        <circle cx={nx} cy={ny} r="15" className="gauge-knob" />
      </svg>
      <div className="gauge-readout">
        <span className="gauge-value">{value >= 100 ? Math.round(value) : value.toFixed(1)}</span>
        <span className="gauge-unit">{unit}</span>
        {label && <span className="gauge-label">{label}</span>}
      </div>
    </div>
  );
}
