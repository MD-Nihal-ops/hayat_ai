import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";

function formatDate(value, language) {
  if (!value) return "";
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  return new Date(timestamp).toLocaleString(language);
}

export default function ConsentHistory() {
  const { t, language } = useLanguage();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState("");

  const loadConsents = useCallback(async () => {
    setError("");
    try {
      const { data } = await axios.get("/api/consents");
      setConsents(data);
    } catch (loadError) {
      setError(loadError.response?.data?.error || t.consentHistory.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.consentHistory.loadFailed]);

  useEffect(() => {
    void loadConsents();
  }, [loadConsents]);

  async function revokeConsent(consent) {
    setRevokingId(consent.consentId);
    setError("");
    try {
      await axios.post(`/api/consents/${encodeURIComponent(consent.consentId)}/revoke`);
      await loadConsents();
    } catch (revokeError) {
      setError(revokeError.response?.data?.error || t.consentHistory.revokeFailed);
    } finally {
      setRevokingId("");
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header>
        <h1 className="text-2xl font-semibold">{t.consentHistory.title}</h1>
        <p className="mt-2 text-slate-700">{t.consentHistory.description}</p>
      </header>
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
      {loading && <PageSkeleton label={t.consentHistory.loading} rows={3} />}
      {!loading && consents.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-5">{t.consentHistory.empty}</p>
      )}
      {!loading && consents.map((consent) => (
        <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" key={consent.consentId}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="font-semibold">{consent.recipient}</h2>
              <p>{t.consentHistory.recipientType}: {t.consentHistory.recipientTypes[consent.recipientType]}</p>
              <p>{t.consentHistory.purpose}: {consent.purpose === "family_report_sharing"
                ? t.consentHistory.familyReportPurpose
                : consent.purpose}</p>
              {consent.resourceId && (
                <p className="text-sm text-slate-700">{t.consentHistory.scope}: {t.consentHistory.reportScope.replace("{id}", consent.resourceId)}</p>
              )}
              <p className="text-sm text-slate-700">
                {t.consentHistory.data}: {consent.dataCategories.map((category) =>
                  t.consentHistory.categories[category] || t.consentHistory.unknownCategory
                ).join(", ")}
              </p>
              <p className="text-sm text-slate-700">
                {t.consentHistory.grantedAt}: {formatDate(consent.grantedAt, language) || t.consentHistory.notGranted}
              </p>
              {consent.expiresAt && (
                <p className="text-sm text-slate-700">{t.consentHistory.expiresAt}: {formatDate(consent.expiresAt, language)}</p>
              )}
              {consent.revokedAt && (
                <p className="text-sm text-slate-700">{t.consentHistory.revokedAt}: {formatDate(consent.revokedAt, language)}</p>
              )}
              <p className="text-sm text-slate-700">{t.consentHistory.version}: {consent.consentVersion}</p>
              <p className="text-sm text-slate-700">{t.consentHistory.optional}: {consent.optional ? t.consentHistory.yes : t.consentHistory.no}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{t.consentHistory.statuses[consent.status]}</span>
              {consent.status === "granted" && (
                <button
                  className="min-h-[44px] rounded-lg border border-slate-400 px-4 font-medium text-gray-900 disabled:opacity-60"
                  type="button"
                  disabled={revokingId === consent.consentId}
                  onClick={() => void revokeConsent(consent)}
                >
                  {revokingId === consent.consentId ? t.consentHistory.revoking : t.consentHistory.revoke}
                </button>
              )}
            </div>
          </div>
          {consent.events.length > 0 && (
            <section className="border-t border-slate-200 pt-3">
              <h3 className="mb-2 font-medium">{t.consentHistory.auditTrail}</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {consent.events.map((event, index) => (
                  <li key={`${event.eventType}-${event.timestamp}-${index}`}>
                    {t.consentHistory.events[event.eventType]} · {formatDate(event.timestamp, language)} · {event.consentVersion}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      ))}
    </section>
  );
}
