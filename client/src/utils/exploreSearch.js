import axios from "axios";

export const PLACE_CATEGORIES = [
  "hospital",
  "clinic",
  "pharmacy",
  "wellness",
  "restaurant",
  "cafe",
  "meal_plan"
];

export function categoriesForSelection(category) {
  if (!category || category === "all") return [...PLACE_CATEGORIES];
  if (category === "food") return ["restaurant", "cafe", "meal_plan"];
  if (category === "restaurant") return ["restaurant", "cafe"];
  return PLACE_CATEGORIES.includes(category) ? [category] : [];
}

export function exploreUrl(intent = {}, near = intent.near) {
  const params = new URLSearchParams();
  const category = intent.category === "cafe" ? "restaurant" : intent.category || "all";
  if (category !== "all") params.set("cat", category);
  if (intent.nameQuery) params.set("q", intent.nameQuery);
  if (intent.specialty) params.set("specialty", intent.specialty);
  if (intent.emirate) params.set("emirate", intent.emirate);
  if (Array.isArray(intent.dietary) && intent.dietary.length) params.set("dietary", intent.dietary.join(","));
  if (Array.isArray(intent.plans) && intent.plans.length) params.set("plans", intent.plans.join(","));
  if (near) params.set("near", near);
  if (intent.openNow) params.set("openNow", "true");
  if (intent.wheelchair) params.set("wheelchair", "true");
  const query = params.toString();
  return `/explore${query ? `?${query}` : ""}`;
}

export async function searchExplorePlaces({
  categories,
  category,
  q = "",
  emirate = "",
  lat,
  lng,
  radiusKm,
  providerType,
  keyword,
  specialty,
  confidence,
  dietary = [],
  plans = [],
  deliveryOnly,
  openNow,
  twentyFourHours,
  wheelchair,
  emergency,
  limit = 50,
  page = 1
}, config = {}) {
  const selectedCategories = categories || categoriesForSelection(category);
  const params = {
    categories: selectedCategories.join(","),
    q: q || undefined,
    emirate: emirate || undefined,
    lat,
    lng,
    radiusKm: lat !== undefined && lng !== undefined ? radiusKm : undefined,
    providerType: providerType || undefined,
    keyword: keyword || undefined,
    specialty: specialty || undefined,
    confidence: confidence || undefined,
    dietary: dietary.length ? dietary.join(",") : undefined,
    plans: plans.length ? plans.join(",") : undefined,
    deliveryOnly: deliveryOnly === undefined ? undefined : String(deliveryOnly),
    openNow: openNow ? "true" : undefined,
    twentyFourHours: twentyFourHours ? "true" : undefined,
    wheelchair: wheelchair ? "true" : undefined,
    emergency: emergency ? "true" : undefined,
    limit,
    page
  };
  const { data } = await axios.get("/api/explore/search", { ...config, params });
  if (!Array.isArray(data?.places) || !Number.isInteger(data.total) ||
      !Number.isInteger(data.page) || !Number.isInteger(data.pages)) {
    throw new Error("Explore search returned an invalid response");
  }
  return data;
}
