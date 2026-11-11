const express = require("express");
const { searchPlaces } = require("../services/placesSearch");

const router = express.Router();
const layerCategories = {
  healthcare: ["hospital", "clinic", "pharmacy"],
  wellness: ["wellness"],
  food: ["restaurant", "cafe", "meal_plan"]
};

function legacyPlaceShape(place) {
  return {
    ...place,
    type: place.providerType || place.category,
    mapsUrl: place.links?.maps || null,
    osmUrl: place.links?.osm || null
  };
}

function optionalBoolean(value, name) {
  if (value === undefined || value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const error = new Error(`${name} must be true or false`);
  error.status = 400;
  throw error;
}

function optionsFromQuery(query, categories) {
  const hasLat = query.lat !== undefined && query.lat !== "";
  const hasLng = query.lng !== undefined && query.lng !== "";
  const filters = {};
  if (query.providerType) filters.providerType = query.providerType;
  if (query.keyword) filters.keyword = query.keyword;
  if (query.dietary) filters.dietary = [query.dietary];
  if (query.healthPlan) filters.plans = [query.healthPlan];
  if (query.emergency !== undefined) filters.emergency = optionalBoolean(query.emergency, "emergency");
  return {
    categories,
    q: query.q || "",
    emirate: query.emirate || "",
    ...(hasLat || hasLng ? { lat: query.lat, lng: query.lng } : {}),
    ...(query.radius !== undefined && query.radius !== ""
      ? { radiusKm: Math.max(1, Number(query.radius) / 1000) }
      : {}),
    filters,
    limit: query.limit === undefined ? 50 : Number(query.limit),
    page: query.page === undefined ? 1 : Number(query.page)
  };
}

router.get("/", async (req, res, next) => {
  try {
    const layer = typeof req.query.layer === "string" ? req.query.layer : "";
    if (!Object.hasOwn(layerCategories, layer)) {
      return res.status(400).json({ error: "Choose a supported place layer" });
    }
    if (req.query.radius !== undefined && req.query.radius !== "") {
      const radius = Number(req.query.radius);
      if (!Number.isFinite(radius) || radius < 500 || radius > 50000) {
        return res.status(400).json({ error: "Radius must be between 500 and 50000 meters" });
      }
    }
    const search = await searchPlaces(optionsFromQuery(req.query, layerCategories[layer]));
    const radiusMeters = req.query.radius === undefined || req.query.radius === "" ? null : Number(req.query.radius);
    const places = (radiusMeters === null
      ? search.places
      : search.places.filter((place) =>
        place.distanceKm === null
          ? place.category === "meal_plan" || place.deliveryOnly
          : place.distanceKm * 1000 <= radiusMeters
      )).map(legacyPlaceShape);
    const total = radiusMeters === null ? search.total : places.length;
    return res.json({
      places,
      layer,
      total,
      page: search.page,
      limit: search.limit,
      pages: Math.ceil(total / search.limit),
      ...(search.facets && layer === "food" ? { facets: {
        types: search.facets.providerTypes,
        emirates: search.facets.emirates,
        keywords: [...new Set([...search.facets.plans, ...search.facets.dietary])],
        plans: search.facets.plans,
        dietary: search.facets.dietary
      } } : {}),
      ...(search.source ? { source: search.source } : {}),
      ...(search.savedAt ? { savedAt: search.savedAt } : {}),
      ...(search.pages > 0 && req.query.lat ? { locationSorted: true } : {}),
      ...(radiusMeters !== null ? { radiusMeters } : {})
    });
  } catch (error) {
    if (error.status === 503) return res.status(503).json({ error: "Place layer data is not available" });
    if (error.status === 400) return res.status(400).json({ error: error.message });
    return next(error);
  }
});

router.get("/:layer/:id", async (req, res, next) => {
  try {
    const categories = layerCategories[req.params.layer];
    if (!categories) return res.status(400).json({ error: "Choose a supported place layer" });
    const search = await searchPlaces({ categories, limit: 150, page: 1 });
    const place = search.places.find((item) => item.id === req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    return res.json({ place: legacyPlaceShape(place) });
  } catch (error) {
    if (error.status === 503) return res.status(503).json({ error: "Place layer data is not available" });
    if (error.status === 400) return res.status(400).json({ error: error.message });
    return next(error);
  }
});

module.exports = router;
