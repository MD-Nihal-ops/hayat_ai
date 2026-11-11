function distanceMeters(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const haversine = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  return 6371000 * 2 * Math.atan2(
    Math.sqrt(boundedHaversine),
    Math.sqrt(1 - boundedHaversine)
  );
}

function locationIsUsable(place) {
  return Number.isFinite(place.lat) && Number.isFinite(place.lng) &&
    place.lat >= 22 && place.lat <= 26.5 &&
    place.lng >= 51 && place.lng <= 56.6 &&
    ["High", "Medium"].includes(place.confidence);
}

function matchesKeyword(values, query) {
  return values.some((value) =>
    typeof value === "string" && value.toLocaleLowerCase().includes(query)
  );
}

function filterPlaceRecords(places, {
  layer,
  q = "",
  emirate = "",
  providerType = "",
  keyword = "",
  dietary = "",
  healthPlan = "",
  origin = null,
  radius = null
}) {
  const normalizedQuery = q.toLocaleLowerCase();
  const normalizedEmirate = emirate.toLocaleLowerCase();
  const normalizedType = providerType.toLocaleLowerCase();
  const normalizedKeyword = keyword.toLocaleLowerCase();
  const normalizedDietary = dietary.toLocaleLowerCase();
  const normalizedHealthPlan = healthPlan.toLocaleLowerCase();

  const filtered = places.filter((place) => {
    if (normalizedEmirate &&
        String(place.emirate || "").toLocaleLowerCase() !== normalizedEmirate) return false;
    if (layer === "food") {
      if (normalizedType && String(place.type || "").toLocaleLowerCase() !== normalizedType) return false;
      if (normalizedKeyword && !matchesKeyword([...(place.plans || []), ...(place.dietary || [])], normalizedKeyword)) return false;
      if (normalizedDietary && !matchesKeyword(place.dietary || [], normalizedDietary)) return false;
      if (normalizedHealthPlan && !matchesKeyword(place.plans || [], normalizedHealthPlan)) return false;
    }
    if (normalizedQuery) {
      const searchFields = layer === "food"
        ? [place.name]
        : [place.name, place.nameAr, place.address, place.category, place.notes, place.emirate];
      if (!searchFields.some((value) =>
        typeof value === "string" && value.toLocaleLowerCase().includes(normalizedQuery)
      )) return false;
    }
    if (radius !== null) {
      if (!origin || !locationIsUsable(place)) return false;
      if (distanceMeters(origin.lat, origin.lng, place.lat, place.lng) > radius) return false;
    }
    return true;
  });

  if (origin) {
    filtered.sort((first, second) => {
      const firstDistance = locationIsUsable(first)
        ? distanceMeters(origin.lat, origin.lng, first.lat, first.lng)
        : Number.POSITIVE_INFINITY;
      const secondDistance = locationIsUsable(second)
        ? distanceMeters(origin.lat, origin.lng, second.lat, second.lng)
        : Number.POSITIVE_INFINITY;
      return firstDistance - secondDistance;
    });
  }
  return filtered;
}

module.exports = { distanceMeters, filterPlaceRecords, locationIsUsable };
