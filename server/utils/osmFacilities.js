const facilityTypes = new Set(["pharmacy", "hospital", "clinic", "spa"]);

function isSupportedFacilityElement(element) {
  const tags = element?.tags || {};
  return facilityTypes.has(tags.amenity) ||
    tags.healthcare === "wellness" ||
    tags.leisure === "spa";
}

function facilityAddress(tags) {
  const parts = [
    ["addr:housenumber", "addr:street"],
    ["addr:unit"],
    ["addr:place"],
    ["addr:suburb"],
    ["addr:district"],
    ["addr:city"],
    ["addr:state"],
    ["addr:postcode"],
    ["addr:country"]
  ].map((keys) => keys.map((key) => tags[key]?.trim()).filter(Boolean).join(" "));

  return parts.filter(Boolean).join(", ");
}

function mapFacility(element) {
  const tags = element.tags || {};
  const type = ["pharmacy", "hospital", "clinic"].includes(tags.amenity)
    ? tags.amenity
    : tags.amenity === "spa" || tags.leisure === "spa" || tags.healthcare === "wellness"
      ? "wellness"
      : null;
  if (!type) return null;
  const coordinates = element.center || element;
  const sourceName = tags.name || tags["name:en"];
  if (type === "wellness" && !sourceName) return null;
  const name = sourceName || `Unnamed ${type}`;
  const wheelchair = ["yes", "limited", "no"].includes(tags.wheelchair)
    ? tags.wheelchair
    : "unknown";
  const phone = [tags.phone, tags["contact:phone"]]
    .find((value) => typeof value === "string" && value.trim());
  const speciality = tags["healthcare:speciality"];
  const emergencyDepartment = tags.emergency === "yes" ||
    (typeof speciality === "string" && speciality.split(/[;,]/).some((item) => item.trim().includes("emergency")));

  return {
    id: `${element.type}/${element.id}`,
    source: "openStreetMap",
    name,
    nameAr: tags["name:ar"] || null,
    type,
    lat: coordinates.lat,
    lng: coordinates.lon,
    address: facilityAddress(tags),
    phone: phone ? phone.trim() : null,
    openingHours: tags.opening_hours || null,
    is24h: tags.opening_hours === "24/7",
    wheelchair,
    specialty: tags["healthcare:speciality"] || tags["healthcare:specialty"] || null,
    emergencyDepartment
  };
}

function overpassQuery(lat, lng, radius) {
  return `[out:json][timeout:25];
(
  node(around:${radius},${lat},${lng})["amenity"~"^(pharmacy|hospital|clinic)$"];
  way(around:${radius},${lat},${lng})["amenity"~"^(pharmacy|hospital|clinic)$"];
  relation(around:${radius},${lat},${lng})["amenity"~"^(pharmacy|hospital|clinic)$"];
  node(around:${radius},${lat},${lng})["healthcare"="wellness"];
  way(around:${radius},${lat},${lng})["healthcare"="wellness"];
  relation(around:${radius},${lat},${lng})["healthcare"="wellness"];
  node(around:${radius},${lat},${lng})["amenity"="spa"];
  way(around:${radius},${lat},${lng})["amenity"="spa"];
  relation(around:${radius},${lat},${lng})["amenity"="spa"];
  node(around:${radius},${lat},${lng})["leisure"="spa"];
  way(around:${radius},${lat},${lng})["leisure"="spa"];
  relation(around:${radius},${lat},${lng})["leisure"="spa"];
);
out center tags;`;
}

module.exports = { isSupportedFacilityElement, mapFacility, overpassQuery };
