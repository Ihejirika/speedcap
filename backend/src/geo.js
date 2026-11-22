import { AREAS } from "./networks.js";

const R = 6371; // Earth radius in km

export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Bounding box around a point, used to narrow the SQL query before exact distance checks.
export function boundingBox(lat, lng, km) {
  const dLat = km / 111.32;
  const dLng = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

export function nearestArea(lat, lng) {
  let best = null;
  for (const a of AREAS) {
    const d = distanceKm(lat, lng, a.lat, a.lng);
    if (!best || d < best.distanceKm) best = { ...a, distanceKm: d };
  }
  return best;
}

export function isValidCoord(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Reverse geocode with OpenStreetMap Nominatim, falling back to the nearest known area.
const cache = new Map();
export async function placeName(lat, lng) {
  const key = lat.toFixed(3) + "," + lng.toFixed(3);
  if (cache.has(key)) return cache.get(key);

  const near = nearestArea(lat, lng);
  let label = near && near.distanceKm < 4 ? `${near.name}, Port Harcourt` : null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SpeedCap/1.0 (network recommender)", "Accept-Language": "en" },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const j = await res.json();
      const a = j.address || {};
      const local = a.suburb || a.neighbourhood || a.quarter || a.village || a.town || a.city_district;
      const city = a.city || a.town || a.state;
      if (local || city) label = [local, city].filter(Boolean).join(", ");
    }
  } catch {
    // Network error or timeout: keep the fallback label.
  }

  const result = { label: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, nearestArea: near?.distanceKm < 4 ? near.name : null };
  if (cache.size > 2000) cache.clear();
  cache.set(key, result);
  return result;
}
