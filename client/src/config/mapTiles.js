const openStreetMap = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors"
};

const alternateUrl = import.meta.env.VITE_TILE_URL_2?.trim();
const alternateAttribution = import.meta.env.VITE_TILE_ATTRIBUTION_2?.trim();

export const mapTileProviders = [
  openStreetMap,
  ...(alternateUrl && alternateAttribution
    ? [{ url: alternateUrl, attribution: alternateAttribution }]
    : [])
];
