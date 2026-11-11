const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isSupportedFacilityElement,
  mapFacility,
  overpassQuery
} = require("../utils/osmFacilities");

test("wellness facilities come only from explicit OSM wellness or spa tags", () => {
  const leisureSpa = {
    type: "node",
    id: 42,
    lat: 25.2,
    lon: 55.27,
    tags: { leisure: "spa", name: "Listed Spa", "name:ar": "مركز" }
  };
  assert.equal(isSupportedFacilityElement(leisureSpa), true);
  assert.deepEqual(mapFacility(leisureSpa), {
      id: "node/42",
      source: "openStreetMap",
      name: "Listed Spa",
      nameAr: "مركز",
      type: "wellness",
      lat: 25.2,
      lng: 55.27,
      address: "",
      phone: null,
      openingHours: null,
      is24h: false,
      wheelchair: "unknown",
      specialty: null,
      emergencyDepartment: false
  });
  assert.equal(mapFacility({ ...leisureSpa, tags: { leisure: "spa" } }), null);
});

test("wellness query includes explicit healthcare, amenity spa, and leisure spa tags", () => {
  const query = overpassQuery(25.2, 55.27, 5000);
  assert.match(query, /\["healthcare"="wellness"\]/);
  assert.match(query, /\["amenity"="spa"\]/);
  assert.match(query, /\["leisure"="spa"\]/);
  assert.match(query, /around:5000,25\.2,55\.27/);
});

test("existing facility categories remain supported without broad activity matches", () => {
  assert.equal(isSupportedFacilityElement({ tags: { amenity: "hospital" } }), true);
  assert.equal(isSupportedFacilityElement({ tags: { leisure: "fitness_centre" } }), false);
  assert.equal(isSupportedFacilityElement({ tags: { amenity: "restaurant" } }), false);
});
