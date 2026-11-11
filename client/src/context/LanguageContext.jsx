import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import hi from "../locales/hi.json";
import ml from "../locales/ml.json";

const translations = { en, ar, hi, ml };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem("hayat-language");
    return Object.hasOwn(translations, savedLanguage) ? savedLanguage : "en";
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.title = translations[language].appName;
    if (language === "ar") {
      void import("@fontsource/noto-sans-arabic/400.css");
      void import("@fontsource/noto-sans-arabic/700.css");
    } else if (language === "hi") {
      void import("@fontsource/noto-sans-devanagari/400.css");
      void import("@fontsource/noto-sans-devanagari/700.css");
    } else if (language === "ml") {
      void import("@fontsource/noto-sans-malayalam/400.css");
      void import("@fontsource/noto-sans-malayalam/700.css");
    }
  }, [language]);

  const changeLanguage = useCallback((nextLanguage) => {
    if (!Object.hasOwn(translations, nextLanguage)) {
      throw new Error(`Unsupported language: ${nextLanguage}`);
    }
    window.localStorage.setItem("hayat-language", nextLanguage);
    setLanguage(nextLanguage);
  }, []);

  const value = useMemo(() => ({
    language,
    changeLanguage,
    t: translations[language]
  }), [language, changeLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function LanguageSelector({ className = "" }) {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <label className={`flex min-h-[44px] items-center gap-2 text-sm ${className}`}>
      <span>{t.language.label}</span>
      <select
        className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-slate-800"
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label={t.language.label}
      >
        <option value="en">{t.language.english}</option>
        <option value="ar">{t.language.arabic}</option>
        <option value="hi">{t.language.hindi}</option>
        <option value="ml">{t.language.malayalam}</option>
      </select>
    </label>
  );
}
