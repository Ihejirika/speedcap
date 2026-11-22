// Talks to the SpeedCap API. Set VITE_API_URL in .env (see .env.example).
// When it isn't set, production builds call the API on the same site (as on Vercel).
const env = import.meta.env || {};
export const API_URL = (env.VITE_API_URL ?? (env.DEV ? "http://localhost:8080" : "")).replace(/\/$/, "");

async function request(path, options) {
  let res;
  try {
    res = await fetch(API_URL + path, options);
  } catch {
    throw new Error("Can't reach the SpeedCap server. Check your internet connection, then try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `The server returned an error (${res.status}).`);
  return body;
}

export const api = {
  recommend: (lat, lng) => request(`/api/recommend?lat=${lat}&lng=${lng}`),
  areas: () => request("/api/areas"),
  stats: () => request("/api/stats"),
  networks: () => request("/api/networks"),
  saveReading: (reading) =>
    request("/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading),
    }),
};

export const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCB05" },
  { id: "airtel", name: "Airtel", color: "#E4002B" },
  { id: "glo", name: "Glo", color: "#3FA535" },
  { id: "9mobile", name: "9mobile", color: "#0E6B4F" },
];

export const AREAS = [
  { id: "old-gra", name: "Old GRA", lat: 4.7845, lng: 7.0105 },
  { id: "gra-phase-2", name: "GRA Phase 2", lat: 4.8235, lng: 6.9995 },
  { id: "d-line", name: "D-Line", lat: 4.7985, lng: 7.0085 },
  { id: "diobu", name: "Mile 1, Diobu", lat: 4.7905, lng: 6.9975 },
  { id: "borokiri", name: "Borokiri", lat: 4.7505, lng: 7.0345 },
  { id: "trans-amadi", name: "Trans-Amadi", lat: 4.8125, lng: 7.0405 },
  { id: "woji", name: "Woji", lat: 4.8255, lng: 7.0555 },
  { id: "elelenwo", name: "Elelenwo", lat: 4.8355, lng: 7.0745 },
  { id: "rumuola", name: "Rumuola", lat: 4.8385, lng: 7.0125 },
  { id: "rumuigbo", name: "Rumuigbo", lat: 4.8545, lng: 6.9855 },
  { id: "rumuodara", name: "Rumuodara", lat: 4.8605, lng: 7.0205 },
  { id: "eliozu", name: "Eliozu", lat: 4.8655, lng: 7.0305 },
  { id: "rumuokoro", name: "Rumuokoro", lat: 4.8695, lng: 7.0005 },
  { id: "choba", name: "Choba", lat: 4.8945, lng: 6.9105 },
  { id: "aluu", name: "Aluu", lat: 4.9335, lng: 6.9425 },
];

// Ask the browser for the person's position.
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Your browser can't share your location. Pick your area instead."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Location access is turned off for this site. Allow it in your browser settings, or pick your area instead."
              : "Couldn't get your location. Try again outside or near a window, or pick your area instead."
          )
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}
