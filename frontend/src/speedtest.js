import { API_URL } from "./api.js";

const now = () => performance.now();

// Latency: median of several small requests. Jitter: average change between consecutive pings.
export async function measurePing(count = 12, onProgress) {
  const times = [];
  for (let i = 0; i < count; i++) {
    const t0 = now();
    await fetch(`${API_URL}/api/ping?r=${Math.random()}`, { cache: "no-store" });
    const dt = now() - t0;
    if (i > 0) times.push(dt); // first request includes connection setup
    onProgress?.((i + 1) / count, dt);
  }
  const sorted = [...times].sort((a, b) => a - b);
  const latency = sorted[Math.floor(sorted.length / 2)];
  let diff = 0;
  for (let i = 1; i < times.length; i++) diff += Math.abs(times[i] - times[i - 1]);
  const jitter = times.length > 1 ? diff / (times.length - 1) : 0;
  return { latency: Math.round(latency), jitter: Math.round(jitter) };
}

// Download: several parallel streams for a fixed time, counting bytes as they arrive.
export async function measureDownload({ seconds = 8, streams = 4, onProgress, signal } = {}) {
  let bytes = 0;
  const start = now();
  const stopAt = start + seconds * 1000;
  const ctrl = new AbortController();
  signal?.addEventListener("abort", () => ctrl.abort());

  const tick = setInterval(() => {
    const elapsed = (now() - start) / 1000;
    onProgress?.(Math.min(1, elapsed / seconds), toMbps(bytes, elapsed));
  }, 150);

  const run = async () => {
    while (now() < stopAt && !ctrl.signal.aborted) {
      const res = await fetch(`${API_URL}/api/speedtest/download?bytes=${4 * 1024 * 1024}&r=${Math.random()}`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (now() >= stopAt) {
          ctrl.abort();
          break;
        }
      }
    }
  };

  await Promise.allSettled(Array.from({ length: streams }, run));
  clearInterval(tick);
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const elapsed = (now() - start) / 1000;
  return round1(toMbps(bytes, elapsed));
}

// Upload: repeatedly post a random payload in parallel for a fixed time.
export async function measureUpload({ seconds = 6, streams = 3, onProgress, signal } = {}) {
  const payload = randomBlob(1.5 * 1024 * 1024);
  let bytes = 0;
  const start = now();
  const stopAt = start + seconds * 1000;

  const tick = setInterval(() => {
    const elapsed = (now() - start) / 1000;
    onProgress?.(Math.min(1, elapsed / seconds), toMbps(bytes, elapsed));
  }, 150);

  const run = async () => {
    while (now() < stopAt && !signal?.aborted) {
      const res = await fetch(`${API_URL}/api/speedtest/upload?r=${Math.random()}`, { method: "POST", body: payload, signal });
      if (res.ok) bytes += payload.size;
    }
  };

  await Promise.allSettled(Array.from({ length: streams }, run));
  clearInterval(tick);
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const elapsed = (now() - start) / 1000;
  return round1(toMbps(bytes, elapsed));
}

function randomBlob(size) {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i += 65536) crypto.getRandomValues(buf.subarray(i, Math.min(size, i + 65536)));
  return new Blob([buf]);
}

const toMbps = (bytes, seconds) => (seconds > 0 ? (bytes * 8) / seconds / 1e6 : 0);
const round1 = (v) => Math.round(v * 10) / 10;
