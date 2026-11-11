const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const specialties = require("../config/specialties.json");
const cities = require("../config/cities.json").cities;
const { isSupportedFacilityElement, mapFacility, overpassQuery } = require("../utils/osmFacilities");
const { locationIsUsable } = require("../utils/placeDirectory");

const categories = new Set(["hospital", "clinic", "pharmacy", "wellness", "restaurant", "cafe", "meal_plan"]);
const emirates = new Set(["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"]);
const filterKeys = new Set(["providerType", "keyword", "dietary", "plans", "deliveryOnly", "openNow", "twentyFourHours", "wheelchair", "emergency", "specialty", "confidence"]);
const overpassUrls = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];
const cacheTtlMs = 60 * 60 * 1000;
const maxSavedEntries = 20;
const maxResults = 150;
const cache = new Map();
const layerCache = new Map();
const dataDirectory = path.join(__dirname, "..", "data");
const placesDirectory = path.join(dataDirectory, "places");
const savedCachePath = path.join(dataDirectory, "facilitiesCache.json");
const officialFacilitiesPath = path.join(dataDirectory, "officialFacilities.json");
const specialtyNameKeywords = Object.fromEntries(
  Object.entries(specialties)
    .filter(([key]) => key !== "_note")
    .map(([key, value]) => [key, { nameKeywords: value.nameKeywords }])
);

let officialFacilities = [];
try {
  if (fs.existsSync(officialFacilitiesPath)) {
    const data = JSON.parse(fs.readFileSync(officialFacilitiesPath, "utf8"));
    if (!Array.isArray(data)) throw new Error("Official facilities data must be an array");
    officialFacilities = data;
  }
} catch (error) {
  console.error("[places-search] official data load failed:", error?.name || "Error");
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateSearchOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw validationError("Search options are required");
  }
  const requestedCategories = options.categories;
  if (!Array.isArray(requestedCategories) || !requestedCategories.length ||
      requestedCategories.length > categories.size ||
      requestedCategories.some((category) => typeof category !== "string" || !categories.has(category))) {
    throw validationError("Choose one or more supported categories");
  }
  const uniqueCategories = [...new Set(requestedCategories)];
  if (uniqueCategories.length !== requestedCategories.length) {
    throw validationError("Categories must not be repeated");
  }

  const q = options.q === undefined || options.q === null ? "" : options.q;
  if (typeof q !== "string" || q.length > 120) throw validationError("Search text must be 120 characters or fewer");
  const emirate = options.emirate === undefined || options.emirate === null || options.emirate === ""
    ? ""
    : options.emirate;
  if (typeof emirate !== "string" || (emirate && !emirates.has(emirate))) {
    throw validationError("Choose a supported UAE emirate");
  }

  const hasLat = options.lat !== undefined && options.lat !== null && options.lat !== "";
  const hasLng = options.lng !== undefined && options.lng !== null && options.lng !== "";
  if (hasLat !== hasLng) throw validationError("Provide both latitude and longitude");
  let lat = null;
  let lng = null;
  if (hasLat) {
    lat = typeof options.lat === "number" ? options.lat : Number(options.lat);
    lng = typeof options.lng === "number" ? options.lng : Number(options.lng);
    if (!Number.isFinite(lat) || lat < 22 || lat > 26.5 ||
        !Number.isFinite(lng) || lng < 51 || lng > 56.6) {
      throw validationError("Location must be within the UAE search area");
    }
  }

  const radiusKm = options.radiusKm === undefined || options.radiusKm === null || options.radiusKm === ""
    ? null
    : typeof options.radiusKm === "number" ? options.radiusKm : Number(options.radiusKm);
  if (radiusKm !== null && (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 50 || !hasLat)) {
    throw validationError("Radius must be between 1 and 50 km and requires a location");
  }
  const limit = options.limit === undefined ? 50 : Number(options.limit);
  const page = options.page === undefined ? 1 : Number(options.page);
  if (!Number.isInteger(limit) || limit < 1 || limit > maxResults ||
      !Number.isInteger(page) || page < 1 || page > 10000) {
    throw validationError("Limit and page must be valid positive whole numbers");
  }

  const rawFilters = options.filters === undefined || options.filters === null ? {} : options.filters;
  if (!rawFilters || typeof rawFilters !== "object" || Array.isArray(rawFilters) ||
      Object.keys(rawFilters).some((key) => !filterKeys.has(key))) {
    throw validationError("Unsupported search filter");
  }
  const filters = {};
  for (const [key, value] of Object.entries(rawFilters)) {
    if (["providerType", "keyword", "specialty"].includes(key)) {
      if (typeof value !== "string" || value.length > 100) throw validationError(`Invalid ${key} filter`);
      filters[key] = value.trim();
    } else if (key === "confidence") {
      if (!["High", "Medium", "Low", "Unknown"].includes(value)) {
        throw validationError("Choose a supported confidence level");
      }
      filters[key] = value;
    } else if (["dietary", "plans"].includes(key)) {
      if (!Array.isArray(value) || value.length > 10 ||
          value.some((entry) => typeof entry !== "string" || entry.length > 100)) {
        throw validationError(`Invalid ${key} filter`);
      }
      filters[key] = [...new Set(value.map((entry) => entry.trim()).filter(Boolean))];
    } else {
      if (typeof value !== "boolean") throw validationError(`Invalid ${key} filter`);
      filters[key] = value;
    }
  }

  return { categories: uniqueCategories, emirate, q: q.trim(), lat, lng, radiusKm, filters, limit, page };
}

async function loadLayer(layer) {
  if (!layerCache.has(layer)) {
    const pending = fsp.readFile(path.join(placesDirectory, `${layer}.json`), "utf8")
      .then((contents) => {
        const parsed = JSON.parse(contents);
        if (!Array.isArray(parsed)) throw new Error(`Place layer "${layer}" is not an array`);
        return parsed;
      })
      .catch((error) => {
        if (error.code === "ENOENT") {
          const unavailable = new Error(`Place layer "${layer}" is unavailable`);
          unavailable.status = 503;
          throw unavailable;
        }
        throw error;
      });
    layerCache.set(layer, pending);
    pending.catch(() => layerCache.delete(layer));
  }
  return layerCache.get(layer);
}

async function readSavedEntries() {
  try {
    const contents = await fsp.readFile(savedCachePath, "utf8");
    const data = JSON.parse(contents);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function saveFacilities(key, lat, lng, radius, facilities) {
  const entries = await readSavedEntries();
  const savedAt = new Date().toISOString();
  entries[key] = { lat, lng, radius, savedAt, facilities };
  const newestEntries = Object.entries(entries)
    .filter(([, entry]) => entry && typeof entry.savedAt === "string" && Array.isArray(entry.facilities))
    .sort(([, first], [, second]) => Date.parse(second.savedAt) - Date.parse(first.savedAt))
    .slice(0, maxSavedEntries);
  await fsp.writeFile(savedCachePath, `${JSON.stringify(Object.fromEntries(newestEntries), null, 2)}\n`, "utf8");
  return savedAt;
}

function facilityNameWords(name) {
  return new Set(String(name || "").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
}

function namesShareWord(official, osm) {
  const officialWords = facilityNameWords(`${official.name || ""} ${official.nameAr || ""}`);
  return [...facilityNameWords(osm.name)].some((word) => officialWords.has(word));
}

function mergeFacilities(osmFacilities, lat, lng, radiusMeters) {
  const officialNearby = officialFacilities.filter((facility) =>
    Number.isFinite(facility.lat) && Number.isFinite(facility.lng) &&
    distanceMeters(lat, lng, facility.lat, facility.lng) <= radiusMeters
  );
  const usedOsmIds = new Set();
  const combined = [];
  for (const official of officialNearby) {
    const match = osmFacilities
      .filter((osm) => !usedOsmIds.has(osm.id) &&
        distanceMeters(official.lat, official.lng, osm.lat, osm.lng) <= 100 &&
        namesShareWord(official, osm))
      .sort((first, second) =>
        distanceMeters(official.lat, official.lng, first.lat, first.lng) -
        distanceMeters(official.lat, official.lng, second.lat, second.lng)
      )[0];
    if (match) {
      usedOsmIds.add(match.id);
      combined.push({
        ...official,
        source: "official",
        osmSource: true,
        osmId: match.id,
        address: match.address || "",
        phone: match.phone,
        openingHours: match.openingHours,
        is24h: match.is24h,
        wheelchair: match.wheelchair,
        specialty: match.specialty,
        emergencyDepartment: match.emergencyDepartment
      });
    } else {
      combined.push({
        ...official,
        source: "official",
        phone: null,
        openingHours: null,
        is24h: false,
        wheelchair: "unknown"
      });
    }
  }
  for (const facility of osmFacilities) {
    if (!usedOsmIds.has(facility.id)) combined.push({ ...facility, source: "openStreetMap" });
  }
  return combined.filter((facility) =>
    Number.isFinite(facility.lat) && Number.isFinite(facility.lng) &&
    distanceMeters(lat, lng, facility.lat, facility.lng) <= radiusMeters
  );
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDiff = radians(lat2 - lat1);
  const lngDiff = radians(lng2 - lng1);
  const value = Math.sin(latDiff / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(lngDiff / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function savedEntryForRequest(entries, key, lat, lng, radiusMeters) {
  if (entries[key]) return entries[key];
  return Object.values(entries)
    .filter((entry) =>
      Number.isFinite(entry?.lat) && Number.isFinite(entry?.lng) && Array.isArray(entry.facilities)
    )
    .map((entry) => ({ entry, distance: distanceMeters(lat, lng, entry.lat, entry.lng) }))
    .filter(({ distance }) => distance <= radiusMeters + 15000)
    .sort((first, second) => first.distance - second.distance)[0]?.entry || null;
}

async function fetchFromOverpass(url, query) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "HayatAI-hackathon-prototype (student hackathon)"
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) {
    const error = new Error(`Overpass returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  if (!Array.isArray(data.elements)) throw new Error("Overpass response did not contain elements");
  return data.elements.filter(isSupportedFacilityElement).map(mapFacility).filter((facility) =>
    facility && Number.isFinite(facility.lat) && Number.isFinite(facility.lng)
  );
}

async function fetchFacilities(lat, lng, radiusKm, { ephemeral = true } = {}) {
  const roundedLat = Number(lat.toFixed(2));
  const roundedLng = Number(lng.toFixed(2));
  const radiusMeters = Math.round(radiusKm * 1000);
  const key = `${roundedLat},${roundedLng},${radiusMeters}`;
  const now = Date.now();
  for (const [cacheKey, entry] of cache) {
    if (now - entry.createdAt >= cacheTtlMs) cache.delete(cacheKey);
  }
  if (!ephemeral) {
    const cached = cache.get(key);
    if (cached) {
      return { source: "live", facilities: mergeFacilities(cached.facilities, lat, lng, radiusMeters), savedAt: null };
    }
  }
  const query = overpassQuery(roundedLat, roundedLng, radiusMeters);
  for (const url of overpassUrls) {
    try {
      const osmFacilities = await fetchFromOverpass(url, query);
      let savedAt = null;
      if (!ephemeral) {
        cache.set(key, { facilities: osmFacilities, createdAt: now });
        try {
          savedAt = await saveFacilities(key, roundedLat, roundedLng, radiusMeters, osmFacilities);
        } catch (error) {
          console.error("[places-search] saved cache write failed:", error?.name || "Error");
        }
      }
      return { source: "live", facilities: mergeFacilities(osmFacilities, lat, lng, radiusMeters), savedAt };
    } catch (error) {
      console.error("[places-search] live facility request failed:", error?.name || "Error");
    }
  }
  try {
    const entries = await readSavedEntries();
    const saved = savedEntryForRequest(entries, key, roundedLat, roundedLng, radiusMeters);
    if (saved) {
      return {
        source: "saved",
        facilities: mergeFacilities(saved.facilities, lat, lng, radiusMeters),
        savedAt: saved.savedAt
      };
    }
  } catch (error) {
    console.error("[places-search] saved cache read failed:", error?.name || "Error");
  }
  const error = new Error("Facilities are unavailable");
  error.status = 503;
  throw error;
}

const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
function isOpenNow(hoursText, date = new Date()) {
  if (hoursText === "24/7") return true;
  const match = typeof hoursText === "string" && hoursText.match(
    /^(?:(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+)?([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]|24):([0-5]\d)$/
  );
  if (!match || (match[5] === "24" && match[6] !== "00")) return false;
  const start = match[1] ? days.indexOf(match[1]) : 0;
  const end = match[2] ? days.indexOf(match[2]) : match[1] ? start : 6;
  const activeDays = [];
  for (let day = start; ; day = (day + 1) % 7) {
    activeDays.push(day);
    if (day === end || activeDays.length === 7) break;
  }
  const open = Number(match[3]) * 60 + Number(match[4]);
  const close = Number(match[5]) * 60 + Number(match[6]);
  const current = date.getHours() * 60 + date.getMinutes();
  const currentDay = (date.getDay() + 6) % 7;
  const previousDay = (currentDay + 6) % 7;
  const overnight = close < open;
  const within = overnight ? current >= open || current < close : current >= open && current < close;
  const relevantDay = overnight && current < close ? previousDay : currentDay;
  return within && activeDays.includes(relevantDay);
}

function normalizedFoodCategory(place) {
  const type = String(place.type || "").toLocaleLowerCase();
  if (type.includes("meal")) return "meal_plan";
  if (type.includes("cafe") || type.includes("café") || type.includes("cafÃ")) return "cafe";
  if (type.includes("restaurant")) return "restaurant";
  return null;
}

function safeLink(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeFacility(facility, origin) {
  const source = facility.source === "official" || facility.source === "mohap" ? "mohap" : "openStreetMap";
  const confidence = ["High", "Medium", "Low"].includes(facility.confidence)
    ? facility.confidence
    : source === "openStreetMap" ? "Medium" : "Unknown";
  const coordinatesValid = Number.isFinite(facility.lat) && facility.lat >= 22 && facility.lat <= 26.5 &&
    Number.isFinite(facility.lng) && facility.lng >= 51 && facility.lng <= 56.6;
  const lat = coordinatesValid ? facility.lat : null;
  const lng = coordinatesValid ? facility.lng : null;
  const directions = lat !== null && lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : null;
  const osmMatch = source === "openStreetMap" && String(facility.id).match(/^(node|way|relation)\/(\d+)$/);
  const osm = osmMatch
    ? `https://www.openstreetmap.org/${osmMatch[1]}/${osmMatch[2]}`
    : null;
  return {
    id: String(facility.id),
    category: facility.type,
    name: facility.name,
    nameAr: facility.nameAr || null,
    lat,
    lng,
    distanceKm: origin && coordinatesValid
      ? distanceMeters(origin.lat, origin.lng, lat, lng) / 1000
      : null,
    address: typeof facility.address === "string" && facility.address.trim() ? facility.address.trim() : null,
    emirate: typeof facility.emirate === "string" && facility.emirate.trim() ? facility.emirate.trim() : null,
    confidence,
    sourceLabel: source === "mohap" ? "MOHAP" : "OpenStreetMap",
    source,
    osmSource: facility.osmSource === true,
    badges: source === "mohap"
      ? facility.osmSource ? ["official", "openStreetMap"] : ["official"]
      : ["openStreetMap"],
    links: { directions, maps: null, osm },
    hoursText: facility.openingHours || null,
    is24h: facility.is24h === true || facility.openingHours === "24/7",
    wheelchair: ["yes", "no", "limited"].includes(facility.wheelchair) ? facility.wheelchair : "unknown",
    phone: typeof facility.phone === "string" && facility.phone.trim() ? facility.phone.trim() : null,
    specialty: facility.specialty || facility.speciality || null,
    emergencyDepartment: facility.emergencyDepartment === true,
    plans: [],
    dietary: [],
    deliveryOnly: false
  };
}

function normalizedDirectoryPlace(place, origin, categoryOverride = null) {
  const category = categoryOverride || normalizedFoodCategory(place);
  if (!category) return null;
  const coordinatesValid = locationIsUsable(place);
  const lat = coordinatesValid ? place.lat : null;
  const lng = coordinatesValid ? place.lng : null;
  const confidence = ["High", "Medium", "Low"].includes(place.confidence) ? place.confidence : "Unknown";
  const sourceLabel = typeof place.sourceName === "string" && place.sourceName.trim()
    ? place.sourceName.trim()
    : "Directory listing";
  return {
    id: String(place.id),
    category,
    name: String(place.name || ""),
    nameAr: place.nameAr || null,
    lat,
    lng,
    distanceKm: origin && coordinatesValid
      ? distanceMeters(origin.lat, origin.lng, lat, lng) / 1000
      : null,
    address: typeof place.address === "string" && place.address.trim() ? place.address.trim() : null,
    emirate: typeof place.emirate === "string" && place.emirate.trim() ? place.emirate.trim() : null,
    confidence,
    sourceLabel,
    source: "directory",
    badges: ["directory"],
    links: { directions: null, maps: safeLink(place.mapsUrl), osm: safeLink(place.osmUrl) },
    hoursText: null,
    wheelchair: "unknown",
    phone: null,
    providerType: place.type || null,
    plans: Array.isArray(place.plans) ? place.plans.filter((item) => typeof item === "string") : [],
    dietary: Array.isArray(place.dietary) ? place.dietary.filter((item) => typeof item === "string") : [],
    deliveryOnly: place.deliveryOnly === true,
    notes: place.notes || null
  };
}

function matchesEmirate(placeEmirate, wanted) {
  if (!wanted) return true;
  return String(placeEmirate || "").split(/[,/]/).some((part) => part.trim().toLocaleLowerCase() === wanted.toLocaleLowerCase());
}

function matchesCategory(place, wanted) {
  return wanted === place.category;
}

function matchesFilters(place, filters) {
  if (filters.confidence && place.confidence !== filters.confidence) return false;
  if (filters.providerType && String(place.providerType || "").toLocaleLowerCase() !== filters.providerType.toLocaleLowerCase()) return false;
  if (filters.keyword && ![...place.dietary, ...place.plans].some((value) =>
    value.toLocaleLowerCase().includes(filters.keyword.toLocaleLowerCase())
  )) return false;
  if (filters.dietary?.length && !filters.dietary.every((filter) =>
    place.dietary.some((tag) => tag.toLocaleLowerCase() === filter.toLocaleLowerCase())
  )) return false;
  if (filters.plans?.length && !filters.plans.every((filter) =>
    place.plans.some((tag) => tag.toLocaleLowerCase() === filter.toLocaleLowerCase())
  )) return false;
  if (filters.deliveryOnly === true && !place.deliveryOnly) return false;
  if (filters.deliveryOnly === false && place.deliveryOnly) return false;
  if (filters.openNow && !isOpenNow(place.hoursText)) return false;
  if (filters.twentyFourHours && !place.is24h) return false;
  if (filters.wheelchair && place.wheelchair !== "yes") return false;
  if (filters.emergency && !(place.category === "hospital" && place.emergencyDepartment)) return false;
  if (filters.specialty) {
    const keywords = specialtyNameKeywords[filters.specialty]?.nameKeywords || [];
    const facilityName = `${place.name} ${place.nameAr || ""}`.toLocaleLowerCase();
    const matches = keywords.some((keyword) => facilityName.includes(keyword.toLocaleLowerCase()));
    const generic = ["polyclinic", "medical center", "medical centre", "specialty"].some((keyword) => facilityName.includes(keyword));
    if (!matches && !(generic && ["hospital", "clinic"].includes(place.category))) return false;
  }
  return true;
}

function matchesQuery(place, q) {
  const normalized = q.toLocaleLowerCase();
  if (!normalized) return true;
  return [
    place.name, place.nameAr, place.address, place.emirate, place.providerType,
    place.specialty, ...place.plans, ...place.dietary
  ].some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(normalized));
}

function publicDirectoryPlace(place) {
  const restrictedText = (value) => /calorie|nutrition|\blow cal\b/i.test(String(value || ""));
  return {
    ...place,
    plans: place.plans.filter((value) => !restrictedText(value)),
    dietary: place.dietary.filter((value) => !restrictedText(value)),
    notes: restrictedText(place.notes) ? null : place.notes
  };
}

async function searchPlaces(options) {
  const input = validateSearchOptions(options);
  const origin = input.lat === null ? null : { lat: input.lat, lng: input.lng };
  const radiusKm = input.radiusKm || 5;
  const wantsFacilities = input.categories.some((category) =>
    ["hospital", "clinic", "pharmacy", "wellness"].includes(category)
  );
  const wantsFood = input.categories.some((category) =>
    ["restaurant", "cafe", "meal_plan"].includes(category)
  );
  const wantsWellness = input.categories.includes("wellness");
  const [facilityData, foodLayer, wellnessLayer] = await Promise.all([
    wantsFacilities && origin
      ? fetchFacilities(origin.lat, origin.lng, radiusKm, { ephemeral: options.ephemeral !== false })
      : Promise.resolve(null),
    wantsFood ? loadLayer("food") : Promise.resolve([]),
    wantsWellness ? loadLayer("healthcare") : Promise.resolve([])
  ]);
  const allowedProviderTypes = new Set(foodLayer.map((place) => place.type).filter(Boolean).map((value) => value.toLocaleLowerCase()));
  const allowedDietary = new Set(foodLayer.flatMap((place) => place.dietary || []).filter(Boolean).map((value) => value.toLocaleLowerCase()));
  const allowedPlans = new Set(foodLayer.flatMap((place) => place.plans || []).filter(Boolean).map((value) => value.toLocaleLowerCase()));
  if (input.filters.providerType && !allowedProviderTypes.has(input.filters.providerType.toLocaleLowerCase())) {
    throw validationError("Choose a provider type present in the directory");
  }
  if (input.filters.dietary?.some((value) => !allowedDietary.has(value.toLocaleLowerCase()))) {
    throw validationError("Choose dietary filters present in the directory");
  }
  if (input.filters.plans?.some((value) => !allowedPlans.has(value.toLocaleLowerCase()))) {
    throw validationError("Choose plan filters present in the directory");
  }
  const candidates = [
    ...(facilityData ? facilityData.facilities.map((facility) => normalizeFacility(facility, origin)) : []),
    ...wellnessLayer.map((place) => normalizedDirectoryPlace(place, origin, "wellness")).filter(Boolean),
    ...foodLayer.map((place) => normalizedDirectoryPlace(place, origin)).filter(Boolean)
  ];
  const filtered = candidates
    .filter((place) => input.categories.some((category) => matchesCategory(place, category)))
    .filter((place) => matchesEmirate(place.emirate, input.emirate))
    .filter((place) => matchesQuery(place, input.q))
    .filter((place) => matchesFilters(place, input.filters))
    .filter((place) => {
      if (input.radiusKm === null) return true;
      if (place.distanceKm === null) return place.category === "meal_plan" || place.deliveryOnly;
      return place.distanceKm !== null && place.distanceKm <= input.radiusKm;
    })
    .sort((first, second) => {
      if (origin) return (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity) || first.name.localeCompare(second.name);
      return first.name.localeCompare(second.name);
    });
  const distinct = [];
  const confidenceRank = { High: 3, Medium: 2, Low: 1, Unknown: 0 };
  for (const place of filtered) {
    const name = place.name.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const duplicateIndex = distinct.findIndex((existing) => {
      if (existing.category !== place.category) return false;
      const existingName = existing.name.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (name !== existingName || String(existing.emirate || "").toLocaleLowerCase() !== String(place.emirate || "").toLocaleLowerCase()) return false;
      if (existing.lat !== null && existing.lng !== null && place.lat !== null && place.lng !== null) {
        return distanceMeters(existing.lat, existing.lng, place.lat, place.lng) <= 100;
      }
      return Boolean(existing.address && place.address) &&
        existing.address.toLocaleLowerCase() === place.address.toLocaleLowerCase();
    });
    if (duplicateIndex < 0) {
      distinct.push(place);
      continue;
    }
    if ((confidenceRank[place.confidence] || 0) > (confidenceRank[distinct[duplicateIndex].confidence] || 0)) {
      distinct[duplicateIndex] = place;
    }
  }
  distinct.sort((first, second) => {
    if (origin) return (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity) || first.name.localeCompare(second.name);
    return first.name.localeCompare(second.name);
  });
  const total = Math.min(distinct.length, maxResults);
  const pageSize = Math.min(input.limit, maxResults);
  const start = (input.page - 1) * pageSize;
  const places = distinct.slice(0, maxResults).slice(start, start + pageSize).map(publicDirectoryPlace);
  const foodLayerForFacets = wantsFood
    ? foodLayer.filter((place) => input.categories.includes(normalizedFoodCategory(place)))
    : [];
  const uniqueSorted = (values) => [...new Set(values.filter((value) => typeof value === "string" && value.trim()))]
    .sort((first, second) => first.localeCompare(second));
  const facets = wantsFood ? {
    providerTypes: uniqueSorted(foodLayerForFacets.map((place) => place.type)),
    emirates: uniqueSorted(foodLayerForFacets.map((place) => place.emirate)),
    dietary: uniqueSorted(foodLayerForFacets.flatMap((place) => place.dietary || [])),
    plans: uniqueSorted(foodLayerForFacets.flatMap((place) => place.plans || []))
  } : null;
  return {
    places,
    total,
    page: input.page,
    limit: pageSize,
    pages: Math.ceil(total / pageSize),
    source: facilityData?.source || (wantsFood ? "directory" : null),
    savedAt: facilityData?.savedAt || null,
    specialties: specialtyNameKeywords,
    facets
  };
}

function validatePlaceIntent(intent) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) return null;
  const category = categories.has(intent.category) ? intent.category : null;
  const nameQuery = typeof intent.nameQuery === "string" && intent.nameQuery.trim().length <= 80
    ? intent.nameQuery.trim() || null
    : null;
  const emirate = typeof intent.emirate === "string" && emirates.has(intent.emirate)
    ? intent.emirate
    : null;
  const allowedTags = new Set();
  for (const place of require("../data/places/food.json")) {
    for (const value of [...(place.dietary || []), ...(place.plans || [])]) {
      if (typeof value === "string") allowedTags.add(value.toLocaleLowerCase());
    }
  }
  const cleanTags = (values) => Array.isArray(values)
    ? [...new Set(values.filter((value) => typeof value === "string" && allowedTags.has(value.trim().toLocaleLowerCase()))
      .map((value) => value.trim()).slice(0, 10))]
    : [];
  let near = null;
  if (typeof intent.near === "string") {
    const trimmed = intent.near.trim();
    const city = Object.keys(cities).find((name) => name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
    if (trimmed.toLocaleLowerCase() === "me") near = "me";
    else if (city) near = city;
    else if (trimmed.length >= 3 && trimmed.length <= 80) near = trimmed;
  }
  const openNow = typeof intent.openNow === "boolean" ? intent.openNow : false;
  const wheelchair = typeof intent.wheelchair === "boolean" ? intent.wheelchair : false;
  const hasKnownIntent = category || nameQuery || emirate || near || openNow || wheelchair;
  if (!hasKnownIntent) return null;
  return { category, emirate, nameQuery, dietary: cleanTags(intent.dietary), plans: cleanTags(intent.plans), near, openNow, wheelchair };
}

function locationForCity(cityName) {
  const city = cities[cityName];
  return city ? { lat: city.lat, lng: city.lng } : null;
}

function toLegacyFacility(place) {
  return {
    id: place.id,
    source: place.source === "mohap" ? "official"
      : place.source === "directory" ? "directory" : "openStreetMap",
    osmSource: place.badges.includes("openStreetMap") && place.source === "mohap",
    name: place.name,
    nameAr: place.nameAr,
    type: place.category,
    lat: place.lat,
    lng: place.lng,
    address: place.address || "",
    phone: place.phone,
    openingHours: place.hoursText,
    is24h: place.is24h,
    wheelchair: place.wheelchair,
    specialty: place.specialty,
    emergencyDepartment: place.emergencyDepartment,
    confidence: place.confidence
  };
}

function legacyDirectoryPlace(place, rawById) {
  return rawById.get(place.id) || place;
}

function getFoodOptions() {
  return loadLayer("food");
}

module.exports = {
  categories,
  emirates,
  specialtyNameKeywords,
  searchPlaces,
  validateSearchOptions,
  validatePlaceIntent,
  locationForCity,
  toLegacyFacility,
  legacyDirectoryPlace,
  getFoodOptions,
  publicDirectoryPlace
};
