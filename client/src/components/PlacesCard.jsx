import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import cities from "../data/cities.json";
import { exploreUrl, searchExplorePlaces } from "../utils/exploreSearch.js";
import SpeechControls from "./SpeechControls.jsx";

const validCategories = new Set([
  "hospital", "clinic", "pharmacy", "wellness", "restaurant", "cafe", "meal_plan"
]);

function parseIntent(item) {
  let payload;
  try {
    payload = typeof item.payload === "string" ? JSON.parse(item.payload || "{}") : item.payload || {};
  } catch {
    return null;
  }
  const candidate = payload.intent || payload.placeIntent;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const legacyCategory = candidate.placeType === "food" ? "restaurant"
    : candidate.placeType === "wellness" ? "wellness"
      : validCategories.has(candidate.placeType) ? candidate.placeType : null;
  const category = validCategories.has(candidate.category) ? candidate.category : legacyCategory;
  const cleanString = (value, maxLength) =>
    typeof value === "string" && value.trim().length <= maxLength ? value.trim() : null;
  const near = cleanString(candidate.near, 80);
  const emirate = cleanString(candidate.emirate, 40);
  const cleanTags = (values) => Array.isArray(values)
    ? values.filter((value) => typeof value === "string" && value.length <= 100).slice(0, 10)
    : [];
  const intent = {
    category,
    nameQuery: cleanString(candidate.nameQuery, 80),
    emirate,
    specialty: cleanString(candidate.specialty, 80),
    dietary: cleanTags(candidate.dietary),
    plans: cleanTags(candidate.plans),
    near,
    openNow: candidate.openNow === true,
    wheelchair: candidate.wheelchair === true
  };
  return category || intent.nameQuery || emirate || near || intent.dietary.length ||
    intent.plans.length || intent.openNow || intent.wheelchair ? intent : null;
}

function categoryName(category, t) {
  if (category === "cafe") return t.explore.categories.cafe;
  return t.explore.categories[category] || t.explore.categories.all;
}

export default function PlacesCard({ item }) {
  const { t, language } = useLanguage();
  const intent = useMemo(() => parseIntent(item), [item.payload]);
  const payload = useMemo(() => {
    try {
      return typeof item.payload === "string" ? JSON.parse(item.payload || "{}") : item.payload || {};
    } catch {
      return {};
    }
  }, [item.payload]);
  const initialResults = Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.placeResults) ? payload.placeResults : [];
  const [results, setResults] = useState(initialResults.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(payload.searchError ? t.explore.searchFailed : "");
  const [locationRequired, setLocationRequired] = useState(
    intent?.near === "me" || Boolean(intent?.near && !Object.hasOwn(cities, intent.near))
  );
  const [origin, setOrigin] = useState(null);
  const [near, setNear] = useState(intent?.near || "");

  useEffect(() => {
    setResults(initialResults.slice(0, 3));
    setError(payload.searchError ? t.explore.searchFailed : "");
  }, [item.id, payload.searchError, t.explore.searchFailed]);

  if (!intent) return null;

  const exploreLink = exploreUrl(intent, near || undefined);
  const placeLeadIn = ["restaurant", "cafe", "meal_plan"].includes(intent.category)
    ? t.map.foodChatLeadIn
    : item.content || t.chat.findPlacesLeadIn;
  const placeName = (place) => language === "ar" && place.nameAr ? place.nameAr : place.name;
  const speechText = results.map((place) =>
    [placeName(place), categoryName(place.category, t), place.emirate, place.confidence]
      .filter(Boolean)
      .join(". ")
  ).join(". ");

  async function searchAt(lat, lng, selectedNear) {
    setLoading(true);
    setError("");
    setLocationRequired(false);
    setOrigin([lat, lng]);
    setNear(selectedNear);
    try {
      const result = await searchExplorePlaces({
        categories: intent.category ? [intent.category] : undefined,
        category: intent.category || "all",
        q: intent.nameQuery || "",
        emirate: intent.emirate || "",
        lat,
        lng,
        radiusKm: 8,
        dietary: intent.dietary,
        plans: intent.plans,
        specialty: intent.specialty || undefined,
        openNow: intent.openNow,
        wheelchair: intent.wheelchair,
        limit: 3,
        page: 1
      });
      setResults(result.places.slice(0, 3));
    } catch {
      setResults([]);
      setError(t.explore.searchFailed);
    } finally {
      setLoading(false);
    }
  }

  function requestLocation() {
    setError("");
    if (!navigator.geolocation) {
      setLocationRequired(true);
      setError(t.explore.locationUnavailable);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = coords;
        if (lat < 22 || lat > 26.5 || lng < 51 || lng > 56.6) {
          setLocationRequired(true);
          setError(t.explore.locationUnavailable);
          return;
        }
        void searchAt(lat, lng, "me");
      },
      () => {
        setLocating(false);
        setLocationRequired(true);
        setError(t.explore.locationUnavailable);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }

  async function searchRequestedLocation() {
    if (!intent.near) {
      requestLocation();
      return;
    }
    const city = cities[intent.near];
    if (city) {
      await searchAt(city.lat, city.lng, intent.near);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/geocode/search", {
        params: { q: intent.near },
        timeout: 20000
      });
      const first = data.results?.[0];
      if (!first || !Number.isFinite(first.lat) || !Number.isFinite(first.lng)) {
        setResults([]);
        setError(t.explore.locationSearchFailed);
        return;
      }
      await searchAt(first.lat, first.lng, intent.near);
    } catch {
      setResults([]);
      setError(t.explore.locationSearchFailed);
    } finally {
      setLoading(false);
    }
  }

  const needsExplicitLocation = locationRequired || !intent.near || intent.near === "me" ||
    Boolean(intent.near && !Object.hasOwn(cities, intent.near)) ||
    Boolean(intent.near && !results.length);

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      {placeLeadIn && <p className="leading-6">{placeLeadIn}</p>}
      <SpeechControls
        messageId={`places-${item.id || intent.nameQuery || intent.category || "results"}`}
        text={speechText}
        language={language}
      />
      <p className="text-sm text-slate-700">{t.explore.locationPrivacy}</p>
      {needsExplicitLocation && (
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white hover:bg-hayat-900 disabled:opacity-60"
          type="button"
          onClick={() => void searchRequestedLocation()}
          disabled={loading || locating}
        >
          <MapPin size={18} aria-hidden="true" />
          {locating ? t.places.locating : loading ? t.explore.loading : t.explore.searchNearby}
        </button>
      )}
      {origin && <p className="text-sm text-slate-700">{t.explore.nearLabel.replace("{place}", near === "me" ? t.explore.nearMe : near)}</p>}
      {loading && <p className="rounded-lg bg-slate-50 p-3" role="status">{t.explore.loading}</p>}
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="alert">{error}</p>}
      {!loading && !error && !results.length && (
        <p className="rounded-lg border border-gray-200 bg-white p-3" role="status">{t.explore.chatEmpty}</p>
      )}
      {results.map((place) => (
        <article className="space-y-2 rounded-lg border border-slate-200 p-3" key={`${place.category}:${place.id}`}>
          <h3 className="font-semibold">{placeName(place)}</h3>
          <p><strong>{t.explore.category}:</strong> {categoryName(place.category, t)}</p>
          {place.emirate && <p><strong>{t.explore.area}:</strong> {place.emirate}</p>}
          <p><strong>{t.explore.confidence}:</strong> {t.map[`confidence${place.confidence}`] || t.explore.unknown}</p>
          {place.confidence !== "High" && <p className="text-sm text-slate-700">{t.explore.addressNotFullyVerified}</p>}
        </article>
      ))}
      <Link
        className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 font-medium text-hayat-900 underline"
        to={exploreLink}
      >
        {t.explore.viewAll}
      </Link>
    </section>
  );
}
