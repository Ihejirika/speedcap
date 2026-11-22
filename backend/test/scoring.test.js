import { test } from "node:test";
import assert from "node:assert/strict";
import { subScores, totalScore, rankNetworks, confidence } from "../src/scoring.js";
import { NETWORKS } from "../src/networks.js";

test("perfect connection scores 100", () => {
  const s = subScores({ download: 80, upload: 30, latency: 10, jitter: 2 });
  assert.equal(Math.round(totalScore(s)), 100);
});

test("terrible connection scores 0", () => {
  const s = subScores({ download: 0, upload: 0, latency: 400, jitter: 100 });
  assert.equal(Math.round(totalScore(s)), 0);
});

test("latency scales linearly between 20 and 200 ms", () => {
  assert.equal(subScores({ download: 0, upload: 0, latency: 110, jitter: 0 }).latency, 50);
});

test("networks rank by score and networks without data come last", () => {
  const now = Date.now();
  const at = new Date(now).toISOString();
  const readings = [
    { network: "mtn", download: 40, upload: 10, latency: 40, jitter: 6, createdAt: at },
    { network: "glo", download: 10, upload: 3, latency: 120, jitter: 30, createdAt: at },
  ];
  const ranked = rankNetworks(readings, NETWORKS, now);
  assert.equal(ranked[0].network, "mtn");
  assert.equal(ranked[1].network, "glo");
  assert.equal(ranked[2].score, null);
});

test("older readings count less", () => {
  const now = Date.now();
  const old = new Date(now - 90 * 86400000).toISOString();
  const fresh = new Date(now).toISOString();
  const ranked = rankNetworks(
    [
      { network: "mtn", download: 5, upload: 1, latency: 150, jitter: 40, createdAt: old },
      { network: "mtn", download: 45, upload: 15, latency: 30, jitter: 5, createdAt: fresh },
    ],
    NETWORKS,
    now
  );
  assert.ok(ranked[0].averages.download > 40);
});

test("confidence grows with readings", () => {
  assert.equal(confidence(1), "low");
  assert.equal(confidence(5), "medium");
  assert.equal(confidence(12), "high");
});
