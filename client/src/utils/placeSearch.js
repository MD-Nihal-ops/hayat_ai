import axios from "axios";

export async function fetchPlacePage(params, config = {}) {
  const { params: requestParams, ...requestConfig } = config;
  const { data } = await axios.get("/api/places", {
    ...requestConfig,
    params: { ...requestParams, ...params }
  });
  if (!Array.isArray(data?.places) || !Number.isInteger(data.total) ||
      !Number.isInteger(data.page) || !Number.isInteger(data.pages)) {
    throw new Error("Place response has an invalid shape");
  }
  return data;
}

export async function fetchAllPlaceResults(params, config = {}) {
  const firstPage = await fetchPlacePage({ ...params, page: 1, limit: 50 }, config);
  const places = [...firstPage.places];
  for (let page = 2; page <= firstPage.pages; page += 1) {
    const nextPage = await fetchPlacePage({ ...params, page, limit: 50 }, config);
    places.push(...nextPage.places);
  }
  return { ...firstPage, places };
}

export async function fetchFacilitiesAt([lat, lng], radius = 5000, config = {}) {
  const { params: requestParams, ...requestConfig } = config;
  const { data } = await axios.get("/api/facilities", {
    ...requestConfig,
    params: { ...requestParams, lat, lng, radius, ephemeral: "true" },
    timeout: requestConfig.timeout ?? 90000
  });
  if (!Array.isArray(data?.facilities)) {
    throw new Error("Facility response has an invalid shape");
  }
  return data;
}
