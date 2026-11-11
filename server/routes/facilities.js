const express = require("express");
const { searchPlaces, specialtyNameKeywords, toLegacyFacility } = require("../services/placesSearch");

const router = express.Router();

function parseBoolean(value, name) {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  const error = new Error(`${name} must be true or false`);
  error.status = 400;
  throw error;
}

router.get("/", async (req, res, next) => {
  try {
    const rawRadius = req.query.radius === undefined ? "5000" : req.query.radius;
    const radiusMeters = Number(rawRadius);
    if (typeof rawRadius !== "string" || !rawRadius.trim() ||
        !Number.isFinite(radiusMeters) || radiusMeters < 500 || radiusMeters > 50000) {
      return res.status(400).json({ error: "Radius must be between 500 and 50000 meters" });
    }
    const requestedType = typeof req.query.type === "string" ? req.query.type : "all";
    const allowedTypes = new Set(["all", "pharmacy", "hospital", "clinic", "wellness"]);
    if (!allowedTypes.has(requestedType)) {
      return res.status(400).json({ error: "Choose a supported facility type" });
    }
    const categories = requestedType === "all" ? ["hospital", "clinic", "pharmacy", "wellness"] : [requestedType];
    const filters = {
      openNow: parseBoolean(req.query.openNow, "openNow"),
      twentyFourHours: parseBoolean(req.query.only24h, "only24h"),
      wheelchair: parseBoolean(req.query.wheelchair, "wheelchair"),
      emergency: parseBoolean(req.query.emergency, "emergency")
    };
    if (req.query.specialty !== undefined && req.query.specialty !== "") {
      filters.specialty = req.query.specialty;
    }
    const search = await searchPlaces({
      categories,
      lat: req.query.lat,
      lng: req.query.lng,
      radiusKm: Math.max(1, radiusMeters / 1000),
      filters,
      limit: 150,
      ephemeral: req.query.ephemeral === "true" || radiusMeters < 1000
    });
    const facilities = search.places
      .filter((place) => !filters.emergency || place.emergencyDepartment)
      .filter((place) => place.distanceKm === null || place.distanceKm * 1000 <= radiusMeters)
      .map(toLegacyFacility);
    return res.json({
      source: search.source || "live",
      ...(search.savedAt ? { savedAt: search.savedAt } : {}),
      specialties: specialtyNameKeywords,
      facilities
    });
  } catch (error) {
    if (error.status === 503) {
      return res.status(503).json({ error: "Facilities unavailable", detail: "The map data service is busy." });
    }
    if (error.status === 400) return res.status(400).json({ error: error.message });
    return next(error);
  }
});

module.exports = router;
