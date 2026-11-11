import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAccessibility } from "../context/AccessibilityContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { LanguageSelector } from "../context/LanguageContext.jsx";
import ThemeSelector from "../components/ThemeSelector.jsx";

export default function Settings({ section = "all" }) {
  const { t, language } = useLanguage();
  const { preferences, setPreference, profileSyncFailed } = useAccessibility();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function downloadData() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.get("/api/account/export", { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "hayat-ai-data.json";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setSuccess(t.settings.downloadSuccess);
    } catch {
      setError(t.settings.downloadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (confirmation !== t.settings.confirmWord) return;
    setLoading(true);
    setError("");
    try {
      await axios.delete("/api/account");
      logout();
      navigate("/login", { replace: true });
    } catch {
      setError(t.settings.deleteFailed);
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {section === "preferences" ? t.sectionTabs.languageDisplay : section === "accessibility" ? t.sectionTabs.accessibility : section === "data" ? t.sectionTabs.dataControls : t.navigation.settings}
        </h1>
        {section === "all" && <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 bg-white px-4 font-medium text-hayat-900" to="/me/privacy/consents">
          {t.navigation.consents}
        </Link>}
      </header>
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 p-3 text-green-900" role="status">{success}</p>}
      {section !== "data" && <section className="card-surface space-y-4">
        <h2 className="text-lg font-semibold">{section === "accessibility" ? t.sectionTabs.accessibility : t.settings.preferences}</h2>
        {section !== "accessibility" && <>
          <LanguageSelector className="justify-between sm:justify-start" />
          <ThemeSelector className="justify-between sm:justify-start" />
          <label className="flex min-h-[44px] flex-wrap items-center gap-3">
            <span>{t.accessibility.textSize}</span>
            <select className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={preferences.textScale} onChange={(event) => void setPreference("textScale", event.target.value)}>
              <option value="100">100%</option><option value="125">125%</option><option value="150">150%</option>
            </select>
          </label>
        </>}
        {section !== "preferences" && [
          ["easyRead", t.accessibility.easyRead],
          ["highContrast", t.accessibility.highContrast],
          ["textSpacing", t.accessibility.textSpacing],
          ["reduceMotion", t.accessibility.reduceMotion],
          ["dyslexiaFont", t.accessibility.dyslexiaFont]
        ].map(([key, label]) => (
          <label className="flex min-h-[44px] items-center gap-3" key={key}>
            <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={preferences[key]} onChange={(event) => void setPreference(key, event.target.checked)} />
            <span>{label}</span>
          </label>
        ))}
        {section !== "preferences" && profileSyncFailed && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-gray-900" role="alert">{t.settings.accessibilitySyncFailed}</p>}
      </section>}
      {(section === "data" || section === "all") && <section className="card-surface space-y-3">
        <h2 className="text-lg font-semibold">{t.settings.yourData}</h2>
        <p>{t.settings.exportDescription}</p>
        <button className="btn-primary min-h-[44px]" type="button" disabled={loading} onClick={downloadData}>
          {loading ? t.settings.working : t.settings.download}
        </button>
      </section>}
      {(section === "data" || section === "all") && <section className="card-surface space-y-3 border-amber-300 bg-amber-50">
        <h2 className="text-lg font-semibold text-amber-950">{t.settings.deleteTitle}</h2>
        <p>{t.settings.deleteDescription}</p>
        <label className="block">
          <span className="mb-1 block font-medium">{t.settings.typeToConfirm.replace("{word}", t.settings.confirmWord)}</span>
          <input className="min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 text-gray-900" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
        <button className="min-h-[44px] rounded-xl border border-slate-800 bg-slate-800 px-5 font-semibold text-white hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hayat-700 disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={loading || confirmation !== t.settings.confirmWord} onClick={deleteAccount}>
          {t.settings.deleteButton}
        </button>
      </section>}
    </section>
  );
}
