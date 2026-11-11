const express = require("express");
const database = require("../database");
const crypto = require("node:crypto");

const router = express.Router();
const requestIntervalMs = 1000;
const cacheDurationMs = 30 * 24 * 60 * 60 * 1000;
let queueTail = Promise.resolve();
let nextRequestAt = 0;

function enqueueNominatimRequest(request) {
  const queuedRequest = queueTail.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    nextRequestAt = Date.now() + requestIntervalMs;
    return request();
  });
  queueTail = queuedRequest.catch(() => {});
  return queuedRequest;
}

router.get("/reverse", async (req, res, next) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (req.query.lat === undefined || req.query.lat === "" ||
      req.query.lng === undefined || req.query.lng === "" ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < 22 || lat > 26.5 || lng < 51 || lng > 56.6) {
    return res.status(400).json({ error: "Invalid location" });
  }

  const roundedLat = Number(lat.toFixed(5));
  const roundedLng = Number(lng.toFixed(5));
  const key = `${roundedLat},${roundedLng}`;
  const ephemeral = req.query.ephemeral === "true";

  let cached;
  if (!ephemeral) {
    try {
      cached = await database.get(
        "SELECT address, fetchedAt FROM geocodeCache WHERE key = ?",
        key
      );
    } catch (error) {
      return next(error);
    }
  }
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (Number.isFinite(age) && age >= 0 && age < cacheDurationMs) {
      return res.json({ address: cached.address, source: "OpenStreetMap Nominatim" });
    }
  }

  if (!process.env.GEOCODE_CONTACT) {
    return res.json({ address: null });
  }

  let address;
  try {
    address = await enqueueNominatimRequest(async () => {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.search = new URLSearchParams({
        format: "jsonv2",
        zoom: "18",
        addressdetails: "1",
        "accept-language": "en",
        lat: String(roundedLat),
        lon: String(roundedLng)
      }).toString();
      const response = await fetch(url, {
        headers: {
          "User-Agent": `HayatAI-hackathon-prototype (${process.env.GEOCODE_CONTACT})`
        },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) {
        throw new Error(`Nominatim returned HTTP ${response.status}`);
      }
      const result = await response.json();
      return typeof result?.display_name === "string" && result.display_name.trim()
        ? result.display_name
        : null;
    });
  } catch {
    return res.json({ address: null });
  }
  if (!address) {
    return res.json({ address: null });
  }

  if (!ephemeral) {
    const fetchedAt = new Date().toISOString();
    try {
      await database.run(
        `INSERT INTO geocodeCache (key, address, fetchedAt) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET address = excluded.address, fetchedAt = excluded.fetchedAt`,
        key,
        address,
        fetchedAt
      );
    } catch (error) {
      return next(error);
    }
  }
  return res.json({ address, source: "OpenStreetMap Nominatim" });
});

router.get("/search", async (req, res, next) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 3 || query.length > 80) {
    return res.status(400).json({ error: "Search text must be between 3 and 80 characters" });
  }
  const key = `forward:${crypto.createHash("sha256").update(query.toLocaleLowerCase()).digest("hex")}`;
  let cached;
  try {
    cached = await database.get(
      "SELECT address, fetchedAt FROM geocodeCache WHERE key = ?",
      key
    );
  } catch (error) {
    return next(error);
  }
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (Number.isFinite(age) && age >= 0 && age < cacheDurationMs) {
      try {
        const results = JSON.parse(cached.address);
        if (Array.isArray(results)) return res.json({ results, source: "OpenStreetMap Nominatim" });
      } catch {
        // A reverse-geocode cache entry cannot be used as a forward result.
      }
    }
  }
  if (!process.env.GEOCODE_CONTACT) {
    return res.status(503).json({ error: "Location search is not configured" });
  }

  let results;
  try {
    results = await enqueueNominatimRequest(async () => {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.search = new URLSearchParams({
        q: query,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "ae",
        limit: "5",
        "accept-language": "en"
      }).toString();
      const response = await fetch(url, {
        headers: {
          "User-Agent": `HayatAI-hackathon-prototype (${process.env.GEOCODE_CONTACT})`
        },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`Nominatim returned HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Nominatim search response was invalid");
      return data.map((item) => ({
        lat: Number(item.lat),
        lng: Number(item.lon),
        displayName: typeof item.display_name === "string" ? item.display_name : ""
      })).filter((item) =>
        Number.isFinite(item.lat) && item.lat >= 22 && item.lat <= 26.5 &&
        Number.isFinite(item.lng) && item.lng >= 51 && item.lng <= 56.6 &&
        item.displayName
      ).slice(0, 5);
    });
  } catch {
    return res.status(503).json({ error: "Location search is temporarily unavailable" });
  }
  try {
    await database.run(
      `INSERT INTO geocodeCache (key, address, fetchedAt) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET address = excluded.address, fetchedAt = excluded.fetchedAt`,
      key,
      JSON.stringify(results),
      new Date().toISOString()
    );
  } catch (error) {
    return next(error);
  }
  return res.json({ results, source: "OpenStreetMap Nominatim" });
});

module.exports = router;
