import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { AREAS, NETWORKS } from "./networks.js";
import { boundingBox, distanceKm } from "./geo.js";

const DB_PATH = process.env.DATABASE_PATH || "./data/speedcap.db";
if (DB_PATH !== ":memory:") mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS readings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    network    TEXT    NOT NULL,
    lat        REAL    NOT NULL,
    lng        REAL    NOT NULL,
    download   REAL    NOT NULL,
    upload     REAL    NOT NULL,
    latency    REAL    NOT NULL,
    jitter     REAL    NOT NULL,
    is_sample  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS idx_readings_loc ON readings (lat, lng);
  CREATE INDEX IF NOT EXISTS idx_readings_created ON readings (created_at);
`);

const toReading = (r) => ({
  id: r.id,
  network: r.network,
  lat: r.lat,
  lng: r.lng,
  download: r.download,
  upload: r.upload,
  latency: r.latency,
  jitter: r.jitter,
  isSample: r.is_sample === 1,
  createdAt: r.created_at,
});

const insertStmt = db.prepare(
  `INSERT INTO readings (network, lat, lng, download, upload, latency, jitter, is_sample, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))`
);

export function addReading(r, { isSample = false, createdAt = null } = {}) {
  const info = insertStmt.run(r.network, r.lat, r.lng, r.download, r.upload, r.latency, r.jitter, isSample ? 1 : 0, createdAt);
  return Number(info.lastInsertRowid);
}

const nearStmt = db.prepare(
  `SELECT * FROM readings
   WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ? AND created_at >= ?`
);

// Readings within `km` of a point from the last `days` days.
export function readingsNear(lat, lng, km, days = 180) {
  const b = boundingBox(lat, lng, km);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  return nearStmt
    .all(b.minLat, b.maxLat, b.minLng, b.maxLng, since)
    .map(toReading)
    .filter((r) => distanceKm(lat, lng, r.lat, r.lng) <= km);
}

export function stats() {
  const perNetwork = db
    .prepare(
      `SELECT network, COUNT(*) AS readings, SUM(is_sample = 0) AS real,
              AVG(download) AS download, AVG(upload) AS upload, AVG(latency) AS latency
       FROM readings GROUP BY network`
    )
    .all();
  const totals = db.prepare(`SELECT COUNT(*) AS total, SUM(is_sample = 0) AS real FROM readings`).get();
  const recent = db
    .prepare(`SELECT * FROM readings WHERE is_sample = 0 ORDER BY created_at DESC LIMIT 10`)
    .all()
    .map(toReading);
  return { totals: { total: totals.total, real: totals.real ?? 0 }, perNetwork, recent };
}

// Deterministic pseudo-random numbers so every fresh database gets the same sample data.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Rough per-network tendencies for sample data only. Real readings replace these over time.
const BIAS = {
  mtn: { dl: 1.15, lat: 0.9 },
  airtel: { dl: 1.05, lat: 0.95 },
  glo: { dl: 0.8, lat: 1.2 },
  "9mobile": { dl: 0.6, lat: 1.35 },
};

export function seedSampleData() {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM readings WHERE is_sample = 1`).get();
  if (n > 0) return 0;

  const rand = rng(20261122);
  let count = 0;
  db.exec("BEGIN");
  AREAS.forEach((area, ai) => {
    NETWORKS.forEach((net, ni) => {
      // Each area gets its own local character so the best network differs by neighbourhood.
      const local = 0.7 + rand() * 0.6;
      const perNet = 4 + Math.floor(rand() * 5);
      for (let i = 0; i < perNet; i++) {
        const b = BIAS[net.id];
        const download = Math.max(0.5, (8 + rand() * 30) * b.dl * local);
        const upload = Math.max(0.3, download * (0.25 + rand() * 0.25));
        const latency = Math.max(18, (35 + rand() * 70) * b.lat / local);
        const jitter = Math.max(2, latency * (0.08 + rand() * 0.2));
        const daysAgo = Math.floor(rand() * 60);
        addReading(
          {
            network: net.id,
            lat: area.lat + (rand() - 0.5) * 0.012,
            lng: area.lng + (rand() - 0.5) * 0.012,
            download: Math.round(download * 10) / 10,
            upload: Math.round(upload * 10) / 10,
            latency: Math.round(latency),
            jitter: Math.round(jitter),
          },
          { isSample: true, createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString() }
        );
        count++;
      }
    });
  });
  db.exec("COMMIT");
  return count;
}

export function clearSampleData() {
  return Number(db.prepare(`DELETE FROM readings WHERE is_sample = 1`).run().changes);
}
