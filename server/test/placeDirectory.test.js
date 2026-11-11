const test = require("node:test");
const assert = require("node:assert/strict");
const {
  distanceMeters,
  filterPlaceRecords,
  locationIsUsable
} = require("../utils/placeDirectory");
const importedFoodPlaces = require("../data/places/food.json");

const foodPlaces = [
  {
    id: "near",
    type: "Meal Plan Provider",
    plans: ["High Protein"],
    dietary: ["Gluten-free"],
    emirate: "Dubai",
    lat: 25.205,
    lng: 55.271,
    confidence: "High"
  },
  {
    id: "far",
    type: "Restaurant",
    plans: ["Weight loss"],
    dietary: ["Vegan"],
    emirate: "Sharjah",
    lat: 25.346,
    lng: 55.421,
    confidence: "Medium"
  },
  {
    id: "unlocated",
    type: "Meal Plan Provider",
    plans: ["High Protein"],
    dietary: ["Gluten-free"],
    emirate: "Dubai",
    lat: null,
    lng: null,
    confidence: "High"
  }
];

test("distanceMeters calculates haversine distance", () => {
  assert.equal(distanceMeters(25, 55, 25, 55), 0);
  assert.ok(Math.abs(distanceMeters(0, 0, 0, 1) - 111195) < 100);
});

test("locationIsUsable requires UAE coordinates with high or medium confidence", () => {
  assert.equal(locationIsUsable(foodPlaces[0]), true);
  assert.equal(locationIsUsable({ ...foodPlaces[0], confidence: "Low" }), false);
  assert.equal(locationIsUsable({ ...foodPlaces[0], lat: 30 }), false);
  assert.equal(locationIsUsable(foodPlaces[2]), false);
});

test("food search applies type, emirate, and separate plan and dietary facets", () => {
  assert.deepEqual(
    filterPlaceRecords(foodPlaces, {
      layer: "food",
      providerType: "Meal Plan Provider",
      emirate: "Dubai",
      healthPlan: "protein",
      dietary: "gluten-free"
    }).map((place) => place.id),
    ["near", "unlocated"]
  );
  assert.deepEqual(
    filterPlaceRecords(foodPlaces, { layer: "food", keyword: "vegan" }).map((place) => place.id),
    ["far"]
  );
});

test("radius filtering excludes entries without usable coordinates and sorts by distance", () => {
  const results = filterPlaceRecords(foodPlaces, {
    layer: "food",
    origin: { lat: 25.2048, lng: 55.2708 },
    radius: 1000
  });
  assert.deepEqual(results.map((place) => place.id), ["near"]);
});

test("distance sorting places unverified coordinates after usable records", () => {
  const results = filterPlaceRecords(foodPlaces, {
    layer: "food",
    origin: { lat: 25.2048, lng: 55.2708 }
  });
  assert.deepEqual(results.map((place) => place.id), ["near", "far", "unlocated"]);
});

test("imported food listings support searches using source-listed plan tags", () => {
  const results = filterPlaceRecords(importedFoodPlaces, {
    layer: "food",
    healthPlan: "high protein"
  });
  assert.ok(results.length > 0);
  assert.ok(results.every((place) =>
    place.plans.some((plan) => plan.toLocaleLowerCase().includes("high protein"))
  ));
});
