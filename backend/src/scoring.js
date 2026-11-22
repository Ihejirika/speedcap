// SpeedCap score: 0-100 per network, from speed-test readings near a location.
//   Download speed 40%  (50 Mbps or more scores full marks)
//   Latency        25%  (20 ms or less is full marks, 200 ms or more is zero)
//   Upload speed   20%  (20 Mbps or more scores full marks)
//   Stability      15%  (jitter of 5 ms or less is full marks, 60 ms or more is zero)
// Newer readings count more: a reading loses half its weight every 30 days.

export const WEIGHTS = { download: 0.4, latency: 0.25, upload: 0.2, stability: 0.15 };

const clamp = (v) => Math.max(0, Math.min(100, v));
const between = (v, best, worst) => clamp(((worst - v) / (worst - best)) * 100);

export function subScores({ download, upload, latency, jitter }) {
  return {
    download: clamp((download / 50) * 100),
    upload: clamp((upload / 20) * 100),
    latency: between(latency, 20, 200),
    stability: between(jitter, 5, 60),
  };
}

export function totalScore(s) {
  return s.download * WEIGHTS.download + s.latency * WEIGHTS.latency + s.upload * WEIGHTS.upload + s.stability * WEIGHTS.stability;
}

export function confidence(count) {
  if (count >= 10) return "high";
  if (count >= 3) return "medium";
  return "low";
}

// readings: [{ network, download, upload, latency, jitter, createdAt, isSample }]
export function rankNetworks(readings, networks, now = Date.now()) {
  const groups = Object.fromEntries(networks.map((n) => [n.id, []]));
  for (const r of readings) if (groups[r.network]) groups[r.network].push(r);

  const ranked = networks.map((n) => {
    const list = groups[n.id];
    if (!list.length) return { network: n.id, name: n.name, color: n.color, readings: 0, score: null, confidence: "none" };

    let wSum = 0;
    const acc = { download: 0, upload: 0, latency: 0, jitter: 0 };
    for (const r of list) {
      const ageDays = Math.max(0, (now - new Date(r.createdAt).getTime()) / 86400000);
      const w = Math.pow(0.5, ageDays / 30);
      wSum += w;
      for (const k of Object.keys(acc)) acc[k] += r[k] * w;
    }
    const avg = Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, v / wSum]));
    const parts = subScores(avg);

    return {
      network: n.id,
      name: n.name,
      color: n.color,
      readings: list.length,
      realReadings: list.filter((r) => !r.isSample).length,
      score: Math.round(totalScore(parts)),
      confidence: confidence(list.length),
      averages: {
        download: round1(avg.download),
        upload: round1(avg.upload),
        latency: Math.round(avg.latency),
        jitter: Math.round(avg.jitter),
      },
      parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round(v)])),
    };
  });

  return ranked.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

const round1 = (v) => Math.round(v * 10) / 10;
