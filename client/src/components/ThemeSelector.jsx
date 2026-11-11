import { useAccessibility } from "../context/AccessibilityContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function ThemeSelector({ compact = false, className = "" }) {
  const { t } = useLanguage();
  const { preferences, setPreference } = useAccessibility();
  const label = t.settings.themeLabel;

  return (
    <label className={`flex min-h-[44px] items-center gap-2 text-sm text-gray-900 ${className}`}>
      <span className={compact ? "sr-only" : ""}>{label}</span>
      <select
        className="min-h-[44px] max-w-full rounded-lg border border-slate-300 bg-white px-2 text-gray-900"
        aria-label={compact ? label : undefined}
        value={preferences.theme}
        onChange={(event) => void setPreference("theme", event.target.value)}
      >
        <option value="system">{t.settings.themeSystem}</option>
        <option value="light">{t.settings.themeLight}</option>
        <option value="dark">{t.settings.themeDark}</option>
      </select>
    </label>
  );
}
