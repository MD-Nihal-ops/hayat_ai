const test = require("node:test");
const assert = require("node:assert/strict");
const foodDirectory = require("../data/places/food.json");
const {
  searchPlaces,
  validatePlaceIntent,
  validateSearchOptions
} = require("../services/placesSearch");

test("search validation rejects unsupported categories, coordinates, radius, and confidence", () => {
  assert.throws(() => validateSearchOptions({ categories: ["urgent-care"] }), { status: 400 });
  assert.throws(() => validateSearchOptions({ categories: ["hospital"], lat: 20, lng: 55 }), { status: 400 });
  assert.throws(() => validateSearchOptions({ categories: ["hospital"], lat: 25, lng: 55, radiusKm: 51 }), { status: 400 });
  assert.throws(() => validateSearchOptions({
    categories: ["wellness"],
    filters: { confidence: "Verified" }
  }), { status: 400 });
});

test("place intent keeps only supported categories, directory tags, locations, and booleans", () => {
  const dietary = foodDirectory.flatMap((place) => place.dietary || [])[0];
  const result = validatePlaceIntent({
    category: "restaurant",
    emirate: "Dubai",
    nameQuery: "  cafe  ",
    dietary: [dietary, "invented tag"],
    plans: ["not a plan"],
    near: "sharjah",
    openNow: true,
    wheelchair: "yes",
    phone: "ignored"
  });
  assert.deepEqual(result, {
    category: "restaurant",
    emirate: "Dubai",
    nameQuery: "cafe",
    dietary: [dietary],
    plans: [],
    near: "Sharjah",
    openNow: true,
    wheelchair: false
  });
  assert.equal(validatePlaceIntent({ category: "unknown", phone: "ignored" }), null);
});

test("wellness search normalizes the imported wellness directory without fabricating fields", async () => {
  const result = await searchPlaces({ categories: ["wellness"], limit: 5, page: 1 });
  assert.ok(result.total > 0);
  assert.ok(result.places.every((place) => place.category === "wellness"));
  const place = result.places[0];
  for (const key of ["id", "name", "lat", "lng", "distanceKm", "address", "emirate", "confidence", "sourceLabel", "badges", "links"]) {
    assert.ok(Object.hasOwn(place, key), `expected normalized field ${key}`);
  }
  assert.equal(place.hoursText, null);
  assert.equal(place.phone, null);
  assert.equal(place.wheelchair, "unknown");
});

test("meal-plan search reads the shared food layer and returns its available facets", async () => {
  const result = await searchPlaces({ categories: ["meal_plan"], limit: 5, page: 1 });
  assert.ok(result.total > 0);
  assert.ok(result.places.every((place) => place.category === "meal_plan"));
  assert.ok(result.facets.providerTypes.includes("Meal Plan Provider"));

  const nearby = await searchPlaces({
    categories: ["meal_plan"],
    lat: 25.2048,
    lng: 55.2708,
    radiusKm: 2,
    limit: 150,
    page: 1
  });
  assert.ok(nearby.places.some((place) => place.distanceKm === null));
});
