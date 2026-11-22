import { useEffect, useRef, useState } from "react";

// Leaflet is loaded from a CDN the first time a map is shown, so it adds nothing to the main bundle.
let leafletPromise;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = () => resolve(window.L);
      s.onerror = () => reject(new Error("Map failed to load"));
      document.head.appendChild(s);
    });
  }
  return leafletPromise;
}

export default function MapView({ lat, lng, radiusKm, color = "#2346F5", label }) {
  const el = useRef(null);
  const map = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !el.current) return;
        if (!map.current) {
          map.current = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
          L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          }).addTo(map.current);
        }
        const m = map.current;
        m.eachLayer((layer) => {
          if (!(layer instanceof L.TileLayer)) m.removeLayer(layer);
        });
        const circle = L.circle([lat, lng], {
          radius: (radiusKm || 2) * 1000,
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.08,
        }).addTo(m);
        L.circleMarker([lat, lng], { radius: 9, color: "#fff", weight: 3, fillColor: color, fillOpacity: 1 })
          .addTo(m)
          .bindTooltip(label || "You are here", { direction: "top", offset: [0, -8] });
        m.fitBounds(circle.getBounds(), { padding: [16, 16] });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusKm, color, label]);

  useEffect(() => () => map.current?.remove(), []);

  if (failed) return <div className="map map-fallback">Map couldn't load. Results below still apply to {label}.</div>;
  return <div ref={el} className="map" aria-label={`Map of ${label}`} />;
}
