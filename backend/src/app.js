import { randomBytes } from "node:crypto";
import { NETWORKS, NETWORK_IDS, AREAS } from "./networks.js";
import { addReading, readingsNear, stats, seedSampleData } from "./db.js";
import { rankNetworks, WEIGHTS } from "./scoring.js";
import { isValidCoord, placeName, nearestArea } from "./geo.js";

// Comma-separated list of allowed front-end origins, or * for any.
const ALLOWED = (process.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
const SEED = process.env.SEED_SAMPLE_DATA !== "false";

if (SEED) {
  const n = seedSampleData();
  if (n) console.log(`Seeded ${n} sample readings`);
}

// One incompressible block reused for download tests.
const BLOCK = randomBytes(1 << 20); // 1 MiB
const MAX_DOWNLOAD = 25 * (1 << 20);
const MAX_UPLOAD = 25 * (1 << 20);

// Simple in-memory rate limit for submitting readings (per IP, not stored on disk).
const submissions = new Map();
const LIMIT_PER_HOUR = 20;
function allowSubmission(ip) {
  const now = Date.now();
  const list = (submissions.get(ip) || []).filter((t) => now - t < 3600000);
  if (list.length >= LIMIT_PER_HOUR) return false;
  list.push(now);
  submissions.set(ip, list);
  return true;
}
setInterval(() => submissions.clear(), 6 * 3600000).unref?.();

function cors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
  else if (origin && ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJson(req, max = 10_000) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw Object.assign(new Error("Request body is too large"), { status: 413 });
    chunks.push(c);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 });
  }
}

function coordsFrom(url) {
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  return isValidCoord(lat, lng) ? { lat, lng } : null;
}

// Search outward until enough readings are found.
function recommend(lat, lng) {
  for (const km of [2, 4, 8, 15]) {
    const readings = readingsNear(lat, lng, km);
    const networksWithData = new Set(readings.map((r) => r.network)).size;
    if (readings.length >= 8 && networksWithData >= 2) return { km, readings };
    if (km === 15) return { km, readings };
  }
}

const routes = {
  "GET /api/health": (req, res) => json(res, 200, { ok: true, time: new Date().toISOString() }),

  "GET /api/networks": (req, res) => json(res, 200, { networks: NETWORKS, weights: WEIGHTS }),

  "GET /api/areas": (req, res) => {
    const areas = AREAS.map((a) => {
      const readings = readingsNear(a.lat, a.lng, 1.5);
      const ranked = rankNetworks(readings, NETWORKS);
      return { ...a, readings: readings.length, rankings: ranked };
    });
    json(res, 200, { areas });
  },

  "GET /api/recommend": async (req, res, url) => {
    const c = coordsFrom(url);
    if (!c) return json(res, 400, { error: "Add lat and lng to the request, for example ?lat=4.82&lng=7.01" });
    const { km, readings } = recommend(c.lat, c.lng);
    const place = await placeName(c.lat, c.lng);
    const rankings = rankNetworks(readings, NETWORKS);
    json(res, 200, {
      location: { ...c, label: place.label },
      radiusKm: km,
      totalReadings: readings.length,
      sampleReadings: readings.filter((r) => r.isSample).length,
      rankings,
      best: rankings[0]?.score != null ? rankings[0] : null,
    });
  },

  "GET /api/geocode": async (req, res, url) => {
    const c = coordsFrom(url);
    if (!c) return json(res, 400, { error: "Add lat and lng to the request" });
    json(res, 200, { ...c, ...(await placeName(c.lat, c.lng)) });
  },

  "GET /api/stats": (req, res) => json(res, 200, stats()),

  "GET /api/ping": (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
    res.end("pong");
  },

  "GET /api/speedtest/download": (req, res, url) => {
    const size = Math.min(MAX_DOWNLOAD, Math.max(1024, Number(url.searchParams.get("bytes")) || 5 * (1 << 20)));
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": size,
      "Cache-Control": "no-store, no-transform",
      "Content-Encoding": "identity",
    });
    let sent = 0;
    const write = () => {
      while (sent < size) {
        const chunk = BLOCK.subarray(0, Math.min(BLOCK.length, size - sent));
        sent += chunk.length;
        if (!res.write(chunk)) return res.once("drain", write);
      }
      res.end();
    };
    write();
  },

  "POST /api/speedtest/upload": async (req, res) => {
    let received = 0;
    for await (const c of req) {
      received += c.length;
      if (received > MAX_UPLOAD) return json(res, 413, { error: "Upload test is limited to 25 MB" });
    }
    json(res, 200, { received });
  },

  "POST /api/readings": async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    if (!allowSubmission(ip)) return json(res, 429, { error: "You've shared a lot of results this hour. Try again later." });

    const b = await readJson(req);
    const r = {
      network: String(b.network || "").toLowerCase(),
      lat: Number(b.lat),
      lng: Number(b.lng),
      download: Number(b.download),
      upload: Number(b.upload),
      latency: Number(b.latency),
      jitter: Number(b.jitter),
    };
    const problems = [];
    if (!NETWORK_IDS.includes(r.network)) problems.push("network must be one of " + NETWORK_IDS.join(", "));
    if (!isValidCoord(r.lat, r.lng)) problems.push("lat and lng must be valid coordinates");
    if (!(r.download >= 0 && r.download <= 10000)) problems.push("download must be between 0 and 10000 Mbps");
    if (!(r.upload >= 0 && r.upload <= 10000)) problems.push("upload must be between 0 and 10000 Mbps");
    if (!(r.latency > 0 && r.latency <= 5000)) problems.push("latency must be between 1 and 5000 ms");
    if (!(r.jitter >= 0 && r.jitter <= 5000)) problems.push("jitter must be between 0 and 5000 ms");
    if (problems.length) return json(res, 400, { error: "Check your result: " + problems.join("; ") });

    // Store coordinates rounded to about 100 m so exact positions aren't kept.
    r.lat = Math.round(r.lat * 1000) / 1000;
    r.lng = Math.round(r.lng * 1000) / 1000;
    const id = addReading(r);
    const area = nearestArea(r.lat, r.lng);
    json(res, 201, { id, saved: true, nearestArea: area?.distanceKm < 4 ? area.name : null });
  },
};

export async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, "http://localhost");
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) {
    if (url.pathname === "/") return json(res, 200, { name: "SpeedCap API", docs: "See README.md for the list of endpoints" });
    return json(res, 404, { error: `No route for ${req.method} ${url.pathname}` });
  }
  try {
    await handler(req, res, url);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, err.status || 500, { error: err.status ? err.message : "Something went wrong on the server" });
    else res.end();
  }
}
