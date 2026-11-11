const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseOpeningHours(openingHours) {
  if (openingHours === "24/7") {
    return { alwaysOpen: true };
  }
  if (typeof openingHours !== "string") {
    return null;
  }

  const match = openingHours.match(
    /^(?:(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+)?([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]|24):([0-5]\d)$/
  );
  if (!match || (match[5] === "24" && match[6] !== "00")) {
    return null;
  }

  const startDay = match[1] ? DAYS.indexOf(match[1]) : 0;
  const endDay = match[2] ? DAYS.indexOf(match[2]) : match[1] ? startDay : 6;
  const days = [];
  for (let day = startDay; ; day = (day + 1) % DAYS.length) {
    days.push(day);
    if (day === endDay || days.length === DAYS.length) {
      break;
    }
  }

  return {
    days,
    openMinutes: Number(match[3]) * 60 + Number(match[4]),
    closeMinutes: Number(match[5]) * 60 + Number(match[6])
  };
}

export function getOpeningStatus(facility, date = new Date()) {
  const hours = parseOpeningHours(facility.openingHours);
  if (!hours) {
    return "unknown";
  }
  if (hours.alwaysOpen) {
    return "open";
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const currentDay = (date.getDay() + 6) % DAYS.length;
  const previousDay = (currentDay + DAYS.length - 1) % DAYS.length;
  const opensOvernight = hours.closeMinutes < hours.openMinutes;
  const isWithinHours = opensOvernight
    ? currentMinutes >= hours.openMinutes || currentMinutes < hours.closeMinutes
    : currentMinutes >= hours.openMinutes && currentMinutes < hours.closeMinutes;

  if (!isWithinHours) {
    return "closed";
  }

  const relevantDay = opensOvernight && currentMinutes < hours.closeMinutes
    ? previousDay
    : currentDay;
  return hours.days.includes(relevantDay) ? "open" : "closed";
}

export function isOpenNow(facility, date = new Date()) {
  return getOpeningStatus(facility, date) === "open";
}

export function distanceKm(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(lat2 - lat1);
  const longitudeDifference = radians(lng2 - lng1);
  const haversine = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(lat1)) *
    Math.cos(radians(lat2)) *
    Math.sin(longitudeDifference / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function words(value) {
  return String(value || "").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

export function matchesFacilityName(facility, query) {
  const queryWords = words(query);
  if (!queryWords.length) return true;
  const nameWords = new Set(words(`${facility.name || ""} ${facility.nameAr || ""}`));
  return queryWords.every((word) => nameWords.has(word));
}

export function matchesFacilitySpecialty(facility, specialty, specialtyConfig = {}) {
  if (!specialty) return true;
  const facilityName = `${facility.name || ""} ${facility.nameAr || ""}`.toLocaleLowerCase();
  const keywords = specialtyConfig[specialty]?.nameKeywords || [];
  const matchesKeyword = keywords.some((keyword) =>
    typeof keyword === "string" && keyword && facilityName.includes(keyword.toLocaleLowerCase())
  );
  const genericFacilityName = ["polyclinic", "medical center", "medical centre", "specialty"]
    .some((keyword) => facilityName.includes(keyword));
  return matchesKeyword ||
    (genericFacilityName && ["hospital", "clinic"].includes(facility.type));
}

export function filterPlaceFacilities(facilities, intent, date = new Date(), specialtyConfig = {}) {
  return facilities.filter((facility) => {
    if (intent.placeType !== "any" && facility.type !== intent.placeType) return false;
    if (!matchesFacilityName(facility, intent.nameQuery)) return false;
    if (!matchesFacilitySpecialty(facility, intent.specialty, specialtyConfig)) return false;
    if (intent.emergency && !(facility.type === "hospital" && facility.emergencyDepartment === true)) return false;
    if (intent.openNow && !isOpenNow(facility, date)) return false;
    if (intent.wheelchair && facility.wheelchair !== "yes") return false;
    return true;
  });
}

export function applyFilters(facilities, { openNow, only24h, accessible, type } = {}, date = new Date()) {
  return facilities.filter((facility) => {
    if (openNow && !isOpenNow(facility, date)) {
      return false;
    }
    if (only24h && !(facility.is24h || facility.openingHours === "24/7")) {
      return false;
    }
    if (accessible && facility.wheelchair !== "yes") {
      return false;
    }
    if (type === "pharmacy" && facility.type !== "pharmacy") {
      return false;
    }
    if (type === "clinic" && facility.type !== "clinic") {
      return false;
    }
    if (type === "hospital" && !["hospital", "clinic"].includes(facility.type)) {
      return false;
    }
    return true;
  });
}
