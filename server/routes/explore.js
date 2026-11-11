const express = require("express");
const { searchPlaces } = require("../services/placesSearch");

const router = express.Router();

function parseList(value) {
  if (value === undefined || value === "") return [];
  return Array.isArray(value) ? value : String(value).split(",").filter(Boolean);
}

function optionalBoolean(value, name) {
  if (value === undefined || value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const error = new Error(`${name} must be true or false`);
  error.status = 400;
  throw error;
}

router.get("/search", async (req, res, next) => {
  try {
    const categories = parseList(req.query.categories || req.query.cat);
    const filters = {};
    for (const key of ["providerType", "keyword", "specialty", "confidence"]) {
      if (req.query[key] !== undefined && req.query[key] !== "") filters[key] = req.query[key];
    }
    const dietary = parseList(req.query.dietary);
    const plans = parseList(req.query.plans);
    if (dietary.length) filters.dietary = dietary;
    if (plans.length) filters.plans = plans;
    for (const key of ["deliveryOnly", "openNow", "twentyFourHours", "wheelchair", "emergency"]) {
      const value = optionalBoolean(req.query[key], key);
      if (value !== undefined) filters[key] = value;
    }
    const search = await searchPlaces({
      categories,
      q: req.query.q === undefined ? "" : req.query.q,
      emirate: req.query.emirate === undefined ? "" : req.query.emirate,
      lat: req.query.lat,
      lng: req.query.lng,
      radiusKm: req.query.radiusKm === undefined ? undefined : req.query.radiusKm,
      filters,
      limit: req.query.limit === undefined ? 50 : req.query.limit,
      page: req.query.page === undefined ? 1 : req.query.page,
      ephemeral: true
    });
    return res.json(search);
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 503) return res.status(503).json({ error: "Places are temporarily unavailable" });
    return next(error);
  }
});

module.exports = router;
