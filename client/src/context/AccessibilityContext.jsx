import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext.jsx";

const storageKey = "hayat-accessibility-settings";
const defaultPreferences = {
  textScale: "100",
  theme: "system",
  highContrast: false,
  textSpacing: false,
  reduceMotion: false,
  dyslexiaFont: false,
  easyRead: false
};
const preferenceContext = createContext(null);

function loadPreferences() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    const textScale = ["100", "125", "150"].includes(String(stored.textScale)) ? String(stored.textScale) : "100";
    const theme = ["light", "dark", "system"].includes(stored.theme) ? stored.theme : "system";
    return {
      ...defaultPreferences,
      ...Object.fromEntries(Object.keys(defaultPreferences).filter((key) => key !== "textScale").map((key) => [key, stored[key] === true])),
      textScale,
      theme
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function AccessibilityProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(loadPreferences);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileSyncFailed, setProfileSyncFailed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textScale = preferences.textScale;
    root.classList.toggle("high-contrast", preferences.highContrast);
    root.classList.toggle("text-spacing", preferences.textSpacing);
    root.classList.toggle("reduce-motion", preferences.reduceMotion);
    root.classList.toggle("dyslexia-font", preferences.dyslexiaFont);
    root.classList.toggle("easy-read", preferences.easyRead);
    root.classList.toggle("high-contrast", preferences.highContrast);
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = !preferences.highContrast && (preferences.theme === "dark" || (preferences.theme === "system" && media.matches));
      root.dataset.theme = preferences.theme;
      root.classList.toggle("dark", isDark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#081b14" : "#f5f9f7");
    };
    applyTheme();
    if (preferences.theme !== "system") return undefined;
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [preferences.theme, preferences.highContrast]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    setIsLoadingProfile(true);
    axios.get("/api/profile/accessibility")
      .then(({ data }) => {
        if (!active) return;
        setPreferences((current) => ({ ...current, easyRead: data.easyRead === true }));
        setProfileSyncFailed(false);
      })
      .catch(() => {
        if (active) setProfileSyncFailed(true);
      })
      .finally(() => {
        if (active) setIsLoadingProfile(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  const setPreference = useCallback(async (key, value) => {
    if (!Object.hasOwn(defaultPreferences, key)) return false;
    const nextValue = key === "textScale" || key === "theme" ? String(value) : value === true;
    if (key === "textScale" && !["100", "125", "150"].includes(nextValue)) return false;
    if (key === "theme" && !["light", "dark", "system"].includes(nextValue)) return false;
    setPreferences((current) => ({ ...current, [key]: nextValue }));
    if (key !== "easyRead" || !isAuthenticated) return true;
    try {
      await axios.patch("/api/profile/accessibility", { easyRead: nextValue });
      setProfileSyncFailed(false);
      return true;
    } catch {
      setProfileSyncFailed(true);
      return false;
    }
  }, [isAuthenticated]);

  const value = useMemo(() => ({
    preferences,
    setPreference,
    isLoadingProfile,
    profileSyncFailed
  }), [preferences, setPreference, isLoadingProfile, profileSyncFailed]);

  return <preferenceContext.Provider value={value}>{children}</preferenceContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(preferenceContext);
  if (!context) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return context;
}
