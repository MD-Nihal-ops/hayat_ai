import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";
import cities from "../data/cities.json";
import { cleanPhone, isValidPhone } from "../utils/contactLinks.js";
import { matchGroup } from "../utils/groupMatch.js";
import { categoriesForSelection, PLACE_CATEGORIES, searchExplorePlaces } from "../utils/exploreSearch.js";
import { mapTileProviders } from "../config/mapTiles.js";
import "leaflet/dist/leaflet.css";

const DUBAI_CENTRE = [25.2048, 55.2708];
const emirates = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];
const confidenceValues = ["High", "Medium", "Low", "Unknown"];
const categorySymbols = {
  hospital: ["explore-pin--hospital", "H"],
  clinic: ["explore-pin--clinic", "C"],
  pharmacy: ["explore-pin--pharmacy", "P"],
  wellness: ["explore-pin--wellness", "W"],
  restaurant: ["explore-pin--food", "R"],
  cafe: ["explore-pin--cafe", "C"],
  meal_plan: ["explore-pin--meal", "M"]
};

function categoryFromSearch(params) {
  const cat = params.get("cat");
  if (cat === "food") return "food";
  if (cat === "cafe") return "restaurant";
  if (["all", ...PLACE_CATEGORIES.filter((category) => category !== "cafe")].includes(cat)) return cat;
  const type = params.get("type");
  if (["hospital", "clinic", "pharmacy"].includes(type)) return type;
  if (params.get("layer") === "wellness") return "wellness";
  if (params.get("layer") === "food") return "food";
  if (params.get("emergency") === "true") return "hospital";
  return "all";
}

function categoryLabel(place, t) {
  if (place.category === "cafe") return t.explore.categories.cafe;
  if (place.category === "restaurant") return t.explore.categories.restaurant;
  return t.explore.categories[place.category] || place.category;
}

function PlaceMarker({ place, onSelect, t, direction, language }) {
  const [className, symbol] = categorySymbols[place.category] || categorySymbols.clinic;
  const icon = L.divIcon({
    className: "explore-pin-anchor",
    html: `<span class="explore-pin ${className}" aria-hidden="true">${symbol}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(place.id) }}
    >
      <Popup>
        <div className="space-y-1" dir={direction}>
          <strong>{language === "ar" && place.nameAr ? place.nameAr : place.name}</strong>
          <p>{t.explore.approximateLocation}</p>
        </div>
      </Popup>
    </Marker>
  );
}

function ClusterMarker({ places, onSelect, t, direction, language }) {
  const map = useMap();
  const lat = places.reduce((sum, place) => sum + place.lat, 0) / places.length;
  const lng = places.reduce((sum, place) => sum + place.lng, 0) / places.length;
  const icon = L.divIcon({
    className: "explore-pin-anchor",
    html: `<span class="explore-pin explore-pin--cluster" aria-hidden="true">${places.length}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{ click: () => map.setView([lat, lng], Math.min(map.getZoom() + 2, 17)) }}
    >
      <Popup>
        <div dir={direction}>
          <strong>{places.length} {t.explore.placesTab}</strong>
          <p>{t.explore.approximateLocation}</p>
          <button className="min-h-[44px] text-hayat-800 underline" type="button" onClick={() => onSelect(places[0].id)}>
            {language === "ar" && places[0].nameAr ? places[0].nameAr : places[0].name}
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

function MapCenterTracker({ onCenterChange }) {
  const map = useMap();
  useEffect(() => {
    function update() {
      const center = map.getCenter();
      onCenterChange([center.lat, center.lng]);
    }
    map.on("moveend", update);
    return () => map.off("moveend", update);
  }, [map, onCenterChange]);
  return null;
}

function MapCenterUpdater({ center, resetKey }) {
  const map = useMap();
  const centerRef = useRef(center);
  centerRef.current = center;

  useEffect(() => {
    map.setView(centerRef.current, map.getZoom());
  }, [map, resetKey]);

  return null;
}

function MapVisibilityUpdater({ visible }) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return undefined;
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [map, visible]);

  return null;
}

function MapTileLayer({ provider, providerIndex, onTileFailure }) {
  const tileErrors = useRef([]);
  const failureHandled = useRef(false);
  const handleTileError = useCallback(() => {
    if (failureHandled.current) return;
    const now = Date.now();
    tileErrors.current = tileErrors.current.filter((timestamp) => now - timestamp < 10000);
    tileErrors.current.push(now);
    if (tileErrors.current.length >= 6) {
      tileErrors.current = [];
      failureHandled.current = true;
      onTileFailure();
    }
  }, [onTileFailure]);

  useEffect(() => {
    tileErrors.current = [];
    failureHandled.current = false;
  }, [providerIndex]);

  return (
    <TileLayer
      attribution={provider.attribution}
      url={provider.url}
      maxZoom={19}
      referrerPolicy="strict-origin-when-cross-origin"
      eventHandlers={{ tileerror: handleTileError }}
    />
  );
}

function MarkersInView({ places, onSelect, t, direction, language }) {
  const map = useMap();
  const [viewport, setViewport] = useState(0);
  useEffect(() => {
    const update = () => setViewport((value) => value + 1);
    map.on("moveend zoomend", update);
    return () => map.off("moveend zoomend", update);
  }, [map]);

  const visible = useMemo(() => {
    const bounds = map.getBounds();
    return places.filter((place) => bounds.contains([place.lat, place.lng]));
  }, [map, places, viewport]);
  const clusters = useMemo(() => {
    if (visible.length <= 50) return null;
    let step = 0.005;
    let groups = new Map();
    do {
      groups = new Map();
      for (const place of visible) {
        const key = `${Math.floor(place.lat / step)}:${Math.floor(place.lng / step)}`;
        groups.set(key, [...(groups.get(key) || []), place]);
      }
      step *= 2;
    } while (groups.size > 50);
    return [...groups.values()];
  }, [visible]);

  if (clusters) {
    return clusters.map((group) => group.length === 1
      ? <PlaceMarker key={group[0].id} place={group[0]} onSelect={onSelect} t={t} direction={direction} language={language} />
      : <ClusterMarker key={group.map((place) => place.id).join("|")} places={group} onSelect={onSelect} t={t} direction={direction} language={language} />);
  }
  return visible.map((place) => (
    <PlaceMarker key={place.id} place={place} onSelect={onSelect} t={t} direction={direction} language={language} />
  ));
}

export default function Map() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const selectedCategory = categoryFromSearch(searchParams);
  const nearParam = searchParams.get("near") || "";
  const [localLocation, setLocalLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DUBAI_CENTRE);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mapView, setMapView] = useState("list");
  const [mapReady, setMapReady] = useState(false);
  const [activeTileProviderIndex, setActiveTileProviderIndex] = useState(0);
  const activeTileProviderIndexRef = useRef(0);
  const [tileNotice, setTileNotice] = useState("");
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const tileNoticeTimer = useRef(null);
  const [searchText, setSearchText] = useState(() => Object.keys(cities).includes(nearParam) ? "" : nearParam);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [places, setPlaces] = useState([]);
  const [facets, setFacets] = useState({ providerTypes: [], dietary: [], plans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [addresses, setAddresses] = useState({});
  const requestId = useRef(0);
  const reportId = searchParams.get("reportId");
  const [reportMedicines, setReportMedicines] = useState([]);
  const [reportError, setReportError] = useState("");

  const currentLocation = useMemo(() => {
    if (localLocation?.near === nearParam) return localLocation;
    const city = cities[nearParam];
    if (city) return { lat: city.lat, lng: city.lng, near: nearParam, label: t.places.cityNames[nearParam] || nearParam };
    return null;
  }, [localLocation, nearParam, t.places.cityNames]);

  const emergencyOnly = searchParams.get("emergency") === "true";
  const selectedEmirate = searchParams.get("emirate") || "";
  const radiusKm = Number(searchParams.get("radiusKm") || searchParams.get("radius") || 5);
  const normalizedRadiusKm = radiusKm > 50 ? radiusKm / 1000 : radiusKm;
  const openNow = searchParams.get("openNow") === "true";
  const twentyFourHours = searchParams.get("twentyFourHours") === "true" || searchParams.get("only24h") === "true";
  const wheelchair = searchParams.get("wheelchair") === "true";
  const confidence = searchParams.get("confidence") || "";
  const dietary = (searchParams.get("dietary") || "").split(",").filter(Boolean);
  const plans = (searchParams.get("plans") || "").split(",").filter(Boolean);
  const providerType = searchParams.get("providerType") || "";
  const keyword = searchParams.get("keyword") || "";
  const specialty = searchParams.get("specialty") || "";
  const deliveryOnly = searchParams.get("deliveryOnly") === "true";
  const sortBy = searchParams.get("sort") === "name" ? "name" : "nearest";

  const updateParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadPlaces = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await searchExplorePlaces({
        categories: categoriesForSelection(selectedCategory),
        q: searchParams.get("q") || searchParams.get("nameQuery") || "",
        emirate: selectedEmirate,
        ...(currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : {}),
        radiusKm: normalizedRadiusKm,
        providerType,
        keyword,
        specialty,
        confidence,
        dietary,
        plans,
        deliveryOnly: deliveryOnly || undefined,
        openNow,
        twentyFourHours,
        wheelchair,
        emergency: emergencyOnly,
        limit: 150,
        page: 1
      });
      if (currentRequestId !== requestId.current) return;
      const sorted = [...result.places].sort((first, second) => {
        if (sortBy === "name") return first.name.localeCompare(second.name);
        if (currentLocation) return (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity) || first.name.localeCompare(second.name);
        return first.name.localeCompare(second.name);
      });
      setPlaces(sorted);
      setFacets(result.facets || { providerTypes: [], dietary: [], plans: [] });
      setSelectedId((current) => sorted.some((place) => place.id === current) ? current : "");
    } catch {
      if (currentRequestId !== requestId.current) return;
      setPlaces([]);
      setFacets({ providerTypes: [], dietary: [], plans: [] });
      setError(t.explore.searchFailed);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [
    confidence, currentLocation, deliveryOnly, dietary.join("|"), emergencyOnly, openNow, plans.join("|"),
    keyword, providerType, searchParams, selectedCategory, selectedEmirate, sortBy, specialty, t.explore.searchFailed,
    twentyFourHours, wheelchair, normalizedRadiusKm
  ]);

  useEffect(() => {
    void loadPlaces();
    return () => { requestId.current += 1; };
  }, [loadPlaces, queryString]);

  useEffect(() => {
    if (!reportId) {
      setReportMedicines([]);
      setReportError("");
      return undefined;
    }
    let active = true;
    axios.get(`/api/reports/${encodeURIComponent(reportId)}`)
      .then(({ data }) => {
        if (!active) return;
        const names = data.type === "prescription" && Array.isArray(data.extractedValues)
          ? [...new Set(data.extractedValues.map((item) => typeof item.name === "string" ? item.name.trim() : "").filter(Boolean))]
          : [];
        setReportMedicines(names);
      })
      .catch(() => { if (active) setReportError(t.map.reportFailed); });
    return () => { active = false; };
  }, [reportId, t.map.reportFailed]);

  useEffect(() => () => window.clearTimeout(tileNoticeTimer.current), []);

  useEffect(() => {
    if (!nearParam || nearParam === "me" || Object.hasOwn(cities, nearParam) ||
        localLocation?.near === nearParam) return undefined;
    let active = true;
    axios.get("/api/geocode/search", { params: { q: nearParam }, timeout: 20000 })
      .then(({ data }) => {
        const first = data.results?.[0];
        if (!active) return;
        if (!first || !Number.isFinite(first.lat) || !Number.isFinite(first.lng)) {
          setLocationError(t.explore.locationSearchFailed);
          return;
        }
        setLocalLocation({ lat: first.lat, lng: first.lng, near: nearParam, label: first.displayName });
        setMapResetKey((current) => current + 1);
      })
      .catch(() => {
        if (active) setLocationError(t.explore.locationSearchFailed);
      });
    return () => { active = false; };
  }, [nearParam, localLocation, t.explore.locationSearchFailed]);

  const mappablePlaces = useMemo(() => places.filter((place) =>
    ["High", "Medium"].includes(place.confidence) &&
    place.category !== "meal_plan" && !place.deliveryOnly &&
    Number.isFinite(place.lat) && Number.isFinite(place.lng) &&
    place.lat >= 22 && place.lat <= 26.5 && place.lng >= 51 && place.lng <= 56.6
  ), [places]);

  function chooseCity(cityName) {
    const city = cities[cityName];
    if (!city) return;
    setLocalLocation({ lat: city.lat, lng: city.lng, near: cityName, label: t.places.cityNames[cityName] || cityName });
    setLocationError("");
    setSearchText("");
    updateParams({ near: cityName });
    setMapResetKey((current) => current + 1);
  }

  function chooseCategory(category) {
    if (category === selectedCategory) return;
    const healthcareCategory = ["hospital", "clinic", "pharmacy"].includes(category);
    updateParams({
      cat: category === "all" ? null : category,
      layer: null,
      type: null,
      page: null,
      confidence: null,
      providerType: null,
      dietary: null,
      plans: null,
      keyword: null,
      deliveryOnly: null,
      emergency: category === "hospital" ? searchParams.get("emergency") : null,
      openNow: healthcareCategory && openNow ? "true" : null,
      twentyFourHours: healthcareCategory && twentyFourHours ? "true" : null,
      only24h: null,
      wheelchair: healthcareCategory && wheelchair ? "true" : null,
      specialty: healthcareCategory ? specialty : null
    });
  }

  function useMyLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError(t.explore.locationUnavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        if (lat < 22 || lat > 26.5 || lng < 51 || lng > 56.6) {
          setLocationError(t.explore.locationUnavailable);
          return;
        }
        setLocalLocation({ lat, lng, near: "me", label: t.explore.nearMe });
        updateParams({ near: "me" });
        setMapResetKey((current) => current + 1);
      },
      () => setLocationError(t.explore.locationUnavailable),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }

  async function searchManualLocation(event) {
    event.preventDefault();
    const query = searchText.trim();
    if (query.length < 3 || query.length > 80) {
      setLocationError(t.explore.locationSearchFailed);
      return;
    }
    setGeocodeLoading(true);
    setLocationError("");
    try {
      const { data } = await axios.get("/api/geocode/search", { params: { q: query }, timeout: 20000 });
      const first = data.results?.[0];
      if (!first || !Number.isFinite(first.lat) || !Number.isFinite(first.lng)) {
        setLocationError(t.explore.locationSearchFailed);
        return;
      }
      setLocalLocation({ lat: first.lat, lng: first.lng, near: query, label: first.displayName });
      updateParams({ near: query });
      setMapResetKey((current) => current + 1);
    } catch {
      setLocationError(t.explore.locationSearchFailed);
    } finally {
      setGeocodeLoading(false);
    }
  }

  async function showApproximateAddress(place) {
    setAddresses((current) => ({ ...current, [place.id]: { loading: true, address: "" } }));
    try {
      const { data } = await axios.get("/api/geocode/reverse", {
        params: { lat: place.lat, lng: place.lng, ephemeral: "true" },
        timeout: 20000
      });
      setAddresses((current) => ({
        ...current,
        [place.id]: { loading: false, address: typeof data?.address === "string" ? data.address : "" }
      }));
    } catch {
      setAddresses((current) => ({ ...current, [place.id]: { loading: false, address: "" } }));
    }
  }

  const categories = [
    ["all", "all"], ["hospital", "hospital"], ["clinic", "clinic"], ["pharmacy", "pharmacy"],
    ["wellness", "wellness"], ["restaurant", "restaurant"], ["meal_plan", "meal_plan"]
  ];
  const foodCategory = ["food", "restaurant", "meal_plan"].includes(selectedCategory);
  const activeLocationLabel = currentLocation?.label || "";
  const center = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : mapCenter || DUBAI_CENTRE;
  const selectedCategories = categoriesForSelection(selectedCategory);
  const activeTileProvider = mapTileProviders[activeTileProviderIndex];

  const showTileNotice = useCallback((message) => {
    window.clearTimeout(tileNoticeTimer.current);
    setTileNotice(message);
    tileNoticeTimer.current = window.setTimeout(() => setTileNotice(""), 5000);
  }, []);

  const handleTileFailure = useCallback(() => {
    const nextProviderIndex = activeTileProviderIndexRef.current + 1;
    if (nextProviderIndex < mapTileProviders.length) {
      activeTileProviderIndexRef.current = nextProviderIndex;
      setActiveTileProviderIndex(nextProviderIndex);
      setTilesUnavailable(false);
      showTileNotice(t.map.mapStyleChanged);
      return;
    }
    setTilesUnavailable(true);
    setTileNotice("");
  }, [showTileNotice, t.map.mapStyleChanged]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.explore.title}</h1>
        <p className="font-medium text-hayat-800">{t.explore.placesTab}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t.explore.placesTab}>
        {categories.map(([category, key]) => (
          <button
            className={`min-h-[44px] rounded-xl border px-4 py-2 font-medium transition-colors ${selectedCategory === category
              ? "border-hayat-800 bg-hayat-800 text-white"
              : "border-gray-300 bg-white text-gray-900 hover:bg-hayat-50"}`}
            key={category}
            type="button"
            aria-pressed={selectedCategory === category || (category === "restaurant" && selectedCategory === "food")}
            onClick={() => chooseCategory(category)}
          >
            {t.explore.categories[key]}
          </button>
        ))}
      </div>

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white hover:bg-hayat-900"
            type="button"
            onClick={useMyLocation}
          >
            {t.explore.useMyLocation}
          </button>
          <form className="flex min-w-0 flex-1 flex-wrap gap-2" onSubmit={(event) => void searchManualLocation(event)}>
            <label className="min-w-[min(100%,16rem)] flex-1">
              <span className="sr-only">{t.explore.manualLocation}</span>
              <input
                className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900"
                value={searchText}
                maxLength={80}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={t.explore.manualPlaceholder}
                type="search"
              />
            </label>
            <button
              className="min-h-[44px] rounded-lg border border-hayat-700 bg-white px-4 py-2 font-medium text-gray-900 disabled:opacity-60"
              type="submit"
              disabled={geocodeLoading}
            >
              {geocodeLoading ? t.explore.locating : t.explore.searchLocation}
            </button>
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t.explore.cityShortcuts}</span>
          {Object.keys(cities).map((cityName) => (
            <button
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-hayat-50"
              key={cityName}
              type="button"
              onClick={() => chooseCity(cityName)}
            >
              {t.places.cityNames[cityName] || cityName}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-700">{t.explore.locationPrivacy}</p>
        {activeLocationLabel && (
          <p className="rounded-lg bg-hayat-50 p-3 font-medium">
            {t.explore.nearLabel.replace("{place}", activeLocationLabel)}
          </p>
        )}
        {locationError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="status">{locationError}</p>}
      </section>
        {!currentLocation && categoriesForSelection(selectedCategory).some((category) =>
          ["hospital", "clinic", "pharmacy", "wellness"].includes(category)
        ) && <p className="rounded-lg border border-gray-200 bg-white p-3" role="note">{t.places.chooseCity}</p>}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="flex min-h-[44px] items-center gap-2">
          <span>{t.explore.emirate}</span>
          <select className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900" value={selectedEmirate} onChange={(event) => updateParams({ emirate: event.target.value })}>
            <option value="">{t.explore.allEmirates}</option>
            {emirates.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex min-h-[44px] items-center gap-2">
          <span>{t.explore.radius}</span>
          <select className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900" value={normalizedRadiusKm} onChange={(event) => updateParams({ radiusKm: event.target.value })}>
            {[2, 5, 10, 25].map((value) => <option key={value} value={value}>{value} km</option>)}
          </select>
        </label>
        <label className="flex min-h-[44px] items-center gap-2">
          <span>{t.explore.sort}</span>
          <select className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900" value={sortBy} onChange={(event) => updateParams({ sort: event.target.value })}>
            <option value="nearest">{t.explore.sortNearest}</option>
            <option value="name">{t.explore.sortName}</option>
          </select>
        </label>

        {["hospital", "clinic", "pharmacy"].includes(selectedCategory) && (
          <>
            <label className="flex min-h-[44px] items-center gap-2">
              <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={openNow} onChange={(event) => updateParams({ openNow: event.target.checked ? "true" : null })} />
              <span>{t.explore.openNow}</span>
            </label>
            <label className="flex min-h-[44px] items-center gap-2">
              <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={twentyFourHours} onChange={(event) => updateParams({ twentyFourHours: event.target.checked ? "true" : null, only24h: null })} />
              <span>{t.explore.twentyFourHours}</span>
            </label>
            <label className="flex min-h-[44px] items-center gap-2">
              <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={wheelchair} onChange={(event) => updateParams({ wheelchair: event.target.checked ? "true" : null })} />
              <span>{t.explore.wheelchair}</span>
            </label>
          </>
        )}

        {selectedCategory === "wellness" && (
          <label className="flex min-h-[44px] items-center gap-2">
            <span>{t.explore.confidence}</span>
            <select className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900" value={confidence} onChange={(event) => updateParams({ confidence: event.target.value })}>
              <option value="">{t.explore.allConfidence}</option>
              {confidenceValues.map((value) => <option key={value} value={value}>{t.map[`confidence${value}`] || value}</option>)}
            </select>
          </label>
        )}

        {foodCategory && (
          <>
            <label className="flex min-h-[44px] items-center gap-2">
              <span>{t.explore.providerType}</span>
              <select className="min-h-[44px] max-w-64 rounded-lg border border-gray-300 bg-white px-3 text-gray-900" value={providerType} onChange={(event) => updateParams({ providerType: event.target.value })}>
                <option value="">{t.explore.allProviderTypes}</option>
                {facets.providerTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.explore.dietary}>
              <span className="font-medium">{t.explore.dietary}</span>
              {facets.dietary.map((value) => (
                <button className={`min-h-[40px] rounded-full border px-3 py-1 text-sm ${dietary.includes(value) ? "border-hayat-700 bg-hayat-50" : "border-gray-300 bg-white"}`} type="button" key={value} aria-pressed={dietary.includes(value)} onClick={() => updateParams({ dietary: dietary.includes(value) ? dietary.filter((item) => item !== value).join(",") : [...dietary, value].join(",") })}>{value}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.explore.plans}>
              <span className="font-medium">{t.explore.plans}</span>
              {facets.plans.map((value) => (
                <button className={`min-h-[40px] rounded-full border px-3 py-1 text-sm ${plans.includes(value) ? "border-hayat-700 bg-hayat-50" : "border-gray-300 bg-white"}`} type="button" key={value} aria-pressed={plans.includes(value)} onClick={() => updateParams({ plans: plans.includes(value) ? plans.filter((item) => item !== value).join(",") : [...plans, value].join(",") })}>{value}</button>
              ))}
            </div>
            <label className="flex min-h-[44px] items-center gap-2">
              <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={deliveryOnly} onChange={(event) => updateParams({ deliveryOnly: event.target.checked ? "true" : null })} />
              <span>{t.explore.deliveryOnly}</span>
            </label>
          </>
        )}
      </div>

      {emergencyOnly && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="note">{t.map.emergencyNotice}</p>}
      {selectedCategory === "restaurant" || selectedCategory === "meal_plan" ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="note">{t.map.foodDisclaimer}</p>
      ) : null}
      {reportId && (
        <section className="card-surface space-y-2">
          <h2 className="font-semibold">{t.map.medicinesTitle}</h2>
          {reportError ? <p className="text-slate-700" role="alert">{reportError}</p>
            : reportMedicines.length ? <ul className="list-inside list-disc">{reportMedicines.map((name) => <li key={name}>{name}</li>)}</ul>
              : <p>{t.map.noMedicines}</p>}
          <p>{t.map.stockDisclaimer}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label={t.map.viewOptions}>
        <button className={`min-h-[44px] rounded-xl border border-hayat-700 px-4 py-2 font-medium ${mapView === "list" ? "bg-hayat-800 text-white" : "bg-white text-gray-900"}`} type="button" aria-pressed={mapView === "list"} onClick={() => setMapView("list")}>{t.explore.listView}</button>
        <button className={`min-h-[44px] rounded-xl border border-hayat-700 px-4 py-2 font-medium ${mapView === "map" ? "bg-hayat-800 text-white" : "bg-white text-gray-900"}`} type="button" aria-pressed={mapView === "map"} onClick={() => { setMapReady(true); setMapView("map"); }}>{t.explore.mapView}</button>
      </div>

      {tilesUnavailable
        ? <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{t.map.tilesUnavailable}</p>
        : tileNotice && <p className="rounded-xl border border-hayat-200 bg-hayat-50 p-3 text-gray-900" role="status">{tileNotice}</p>}

      <div className={`grid gap-4 ${mapView === "map" ? "md:grid-cols-2 md:items-start" : ""}`}>
        {mapReady && (
          <div className={`order-1 space-y-2 ${mapView === "map" ? "" : "hidden"}`}>
            <div className="h-[40vh] min-h-[260px] overflow-hidden rounded-2xl border border-gray-300 bg-white md:h-[calc(100vh-18rem)] md:min-h-[500px]">
              <MapContainer className="h-full w-full" center={center} zoom={12} scrollWheelZoom>
                <MapTileLayer
                  provider={activeTileProvider}
                  providerIndex={activeTileProviderIndex}
                  onTileFailure={handleTileFailure}
                />
                <MapCenterUpdater center={center} resetKey={`${mapResetKey}:${nearParam}`} />
                <MapCenterTracker onCenterChange={setMapCenter} />
                <MapVisibilityUpdater visible={mapView === "map"} />
                <MarkersInView places={mappablePlaces} onSelect={setSelectedId} t={t} direction={language === "ar" ? "rtl" : "ltr"} language={language} />
              </MapContainer>
            </div>
            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3" aria-label={t.explore.mapLegend}>
              {selectedCategories.filter((category) => category !== "meal_plan").map((category) => {
                const [pinClass, symbol] = categorySymbols[category];
                return <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm" key={category}><span className={`explore-legend-pin ${pinClass}`} aria-hidden="true">{symbol}</span>{t.explore.categories[category]}</span>;
              })}
            </div>
          </div>
        )}

        <section className={`order-2 space-y-3 ${mapView === "map" ? "md:max-h-[calc(100vh-18rem)] md:overflow-y-auto" : ""}`} aria-label={t.explore.resultsTitle}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t.explore.resultsTitle} <span className="text-sm font-normal text-slate-600">({places.length})</span></h2>
            {activeLocationLabel && <p className="text-sm text-slate-700">{t.explore.nearLabel.replace("{place}", activeLocationLabel)}</p>}
          </div>
          {loading && <PageSkeleton label={t.explore.loading} rows={3} />}
          {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="alert">{error}</p>}
          {!loading && !error && !places.length && <p className="rounded-xl border border-gray-200 bg-white p-4" role="status">{t.explore.noResults}</p>}
          {places.map((place) => {
            const phoneValid = isValidPhone(place.phone);
            const addressLookup = addresses[place.id];
            const group = place.category === "hospital" || place.category === "clinic"
              ? matchGroup([place.name, place.nameAr].filter(Boolean).join(" "))
              : null;
            return (
              <article id={`place-${place.id}`} className={`space-y-3 rounded-xl border bg-white p-4 ${selectedId === place.id ? "border-hayat-700 ring-2 ring-hayat-200" : "border-gray-200"}`} key={`${place.category}:${place.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{language === "ar" && place.nameAr ? place.nameAr : place.name}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{categoryLabel(place, t)}</span>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="font-medium">{t.explore.category}</dt><dd>{categoryLabel(place, t)}</dd></div>
                  {place.emirate && <div><dt className="font-medium">{t.explore.area}</dt><dd>{place.emirate}</dd></div>}
                  {place.address && <div className="sm:col-span-2"><dt className="font-medium">{t.explore.address}</dt><dd>{place.address}</dd></div>}
                </dl>
                {place.confidence !== "High" && <p className="text-sm text-slate-700">{t.explore.addressNotFullyVerified}</p>}
                {["hospital", "clinic", "pharmacy", "wellness"].includes(place.category) && (
                  <p><strong>{t.explore.hours}:</strong> {place.hoursText || t.explore.hoursNotListed}</p>
                )}
                {place.category === "restaurant" || place.category === "cafe" || place.category === "meal_plan" ? (
                  <div className="flex flex-wrap gap-2">
                    {place.plans.map((tag) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm" key={tag}>{tag}</span>)}
                    {place.dietary.map((tag) => <span className="rounded-full bg-hayat-50 px-3 py-1 text-sm" key={tag}>{tag}</span>)}
                  </div>
                ) : null}
                {place.wheelchair !== "unknown" && <p><strong>{t.map.accessibility}:</strong> {place.wheelchair === "yes" ? t.map.yes : place.wheelchair === "no" ? t.map.notAccessible : t.map.limited}</p>}
                {place.emergencyDepartment && <p className="font-medium">{t.map.emergencyDepartment}</p>}
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{t.explore.confidence}: {t.map[`confidence${place.confidence}`] || place.confidence}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{t.explore.source}: {place.sourceLabel}</span>
                  {place.distanceKm !== null && <span className="rounded-full bg-slate-100 px-3 py-1">{t.places.distance.replace("{distance}", place.distanceKm.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}</span>}
                </div>
                {group && <Link className="inline-flex min-h-[44px] items-center text-hayat-800 underline" to={`/explore/providers/${encodeURIComponent(group.id)}`}>{t.map.viewProvider}</Link>}
                {addressLookup?.address && <p><strong>{t.explore.address}:</strong> {addressLookup.address} <span className="text-sm text-slate-600">({t.explore.approximateLocation})</span></p>}
                {addressLookup && !addressLookup.loading && !addressLookup.address && <p className="text-sm text-slate-700" role="status">{t.explore.addressUnavailable}</p>}
                <div className="flex flex-wrap gap-2">
                  {place.category !== "restaurant" && place.category !== "cafe" && place.category !== "meal_plan" && place.lat !== null && place.lng !== null && !place.address && (
                    <button className="min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900" type="button" disabled={addressLookup?.loading} onClick={() => void showApproximateAddress(place)}>
                      {addressLookup?.loading ? t.explore.loadingAddress : t.explore.showApproximateAddress}
                    </button>
                  )}
                  {place.links.directions && <a className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-3 py-2 text-gray-900" href={place.links.directions} target="_blank" rel="noopener noreferrer">{t.explore.directions}</a>}
                  {phoneValid && place.category !== "restaurant" && place.category !== "cafe" && place.category !== "meal_plan" && <a className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-3 py-2 text-gray-900" href={`tel:${cleanPhone(place.phone)}`}>{t.explore.call}</a>}
                  {place.links.maps && <a className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-3 py-2 text-gray-900" href={place.links.maps} target="_blank" rel="noopener noreferrer">{t.map.openGoogleMaps}</a>}
                  {place.links.osm && <a className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-3 py-2 text-gray-900" href={place.links.osm} target="_blank" rel="noopener noreferrer">{t.map.openOsm}</a>}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </section>
  );
}
