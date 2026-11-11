import { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

function localDateTimeToIso(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export default function ForOrganisations() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ org: "", kind: "appointment", title: "", when: "", place: "", note: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [signingConfigured, setSigningConfigured] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    axios.get("/api/link/demo-config")
      .then(({ data }) => {
        if (!active) return;
        setForm((current) => ({ ...current, org: data.orgName || "" }));
        setSigningConfigured(data.signingConfigured === true);
      })
      .catch(() => {
        if (active) setError(t.forOrganisations.configUnavailable);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [t.forOrganisations.configUnavailable]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createLink(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        v: 1,
        org: form.org.trim(),
        kind: form.kind,
        title: form.title.trim(),
        ...(localDateTimeToIso(form.when) ? { when: localDateTimeToIso(form.when) } : {}),
        ...(form.place.trim() ? { place: form.place.trim() } : {}),
        ...(form.note.trim() ? { note: form.note.trim(), lang: language } : {})
      };
      const { data } = await axios.post("/api/link/create", payload);
      setResult(data);
    } catch {
      setError(t.forOrganisations.createFailed);
    } finally {
      setCreating(false);
    }
  }

  const smsText = result ? `${t.forOrganisations.smsText}\n${result.link}` : "";
  const emailText = result ? `${t.forOrganisations.emailSubject}\n\n${t.forOrganisations.emailText}\n${result.link}` : "";

  return (
    <>
    <a className="skip-link" href="#main-content">{t.accessibility.skipToMain}</a>
    <main id="main-content" tabIndex={-1} className="mx-auto min-h-screen w-full max-w-5xl space-y-7 bg-white px-4 py-6 text-gray-900 sm:py-10" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold">{t.forOrganisations.title}</h1>
          <p className="mt-2 inline-flex rounded-md border border-amber-400 bg-amber-50 px-3 py-2 font-medium text-amber-950">{t.forOrganisations.pilotLabel}</p>
          <p className="mt-2 max-w-3xl text-slate-700">{t.forOrganisations.intro}</p>
        </div>
        <Link className="inline-flex min-h-[44px] items-center text-hayat-900 underline" to="/link">{t.forOrganisations.patientPage}</Link>
      </header>

      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
      {!signingConfigured && !loading && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="status">{t.forOrganisations.secretNotConfigured}</p>}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:items-start">
        <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6" onSubmit={(event) => void createLink(event)}>
          <h2 className="text-xl font-semibold">{t.forOrganisations.createTitle}</h2>
          <p className="text-sm text-slate-700">{t.forOrganisations.noPatientIdentifiers}</p>
          <label className="block space-y-1">
            <span>{t.forOrganisations.orgName}</span>
            <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" maxLength={100} value={form.org} onChange={(event) => update("org", event.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span>{t.forOrganisations.kind}</span>
            <select className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={form.kind} onChange={(event) => update("kind", event.target.value)}>
              <option value="appointment">{t.link.kinds.appointment}</option>
              <option value="instructions">{t.link.kinds.instructions}</option>
              <option value="result_ready">{t.link.kinds.result_ready}</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span>{t.forOrganisations.titleField}</span>
            <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" maxLength={160} value={form.title} onChange={(event) => update("title", event.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span>{t.forOrganisations.dateTime}</span>
            <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="datetime-local" value={form.when} onChange={(event) => update("when", event.target.value)} />
          </label>
          <label className="block space-y-1">
            <span>{t.forOrganisations.place}</span>
            <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" maxLength={160} value={form.place} onChange={(event) => update("place", event.target.value)} />
          </label>
          <label className="block space-y-1">
            <span>{t.forOrganisations.note}</span>
            <textarea className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900" maxLength={200} value={form.note} onChange={(event) => update("note", event.target.value)} />
            <span className="text-sm text-slate-600">{form.note.length}/200</span>
          </label>
          <button className="min-h-[48px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={creating || loading || !signingConfigured}>
            {creating ? t.forOrganisations.creating : t.forOrganisations.createLink}
          </button>
          <p className="text-sm text-slate-600">{t.forOrganisations.rateLimit}</p>
        </form>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-xl font-semibold">{t.forOrganisations.howItWorks}</h2>
          <ol className="list-inside list-decimal space-y-2 text-slate-800">
            <li>{t.forOrganisations.stepOne}</li>
            <li>{t.forOrganisations.stepTwo}</li>
            <li>{t.forOrganisations.stepThree}</li>
          </ol>
          <h3 className="font-semibold">{t.forOrganisations.limitsTitle}</h3>
          <ul className="list-inside list-disc space-y-2 text-slate-700">
            <li>{t.forOrganisations.limitNotEncrypted}</li>
            <li>{t.forOrganisations.limitPerOrgSecret}</li>
            <li>{t.forOrganisations.limitAgreements}</li>
          </ul>
        </section>
      </section>

      {result && (
        <section className="space-y-5 border-t border-slate-200 pt-5">
          <h2 className="text-xl font-semibold">{t.forOrganisations.generatedTitle}</h2>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-4">
              <label className="block space-y-1">
                <span>{t.forOrganisations.generatedLink}</span>
                <textarea className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900" readOnly value={result.link} />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-1">
                  <span>{t.forOrganisations.sampleSms}</span>
                  <textarea className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900" readOnly value={smsText} />
                </label>
                <label className="block space-y-1">
                  <span>{t.forOrganisations.sampleEmail}</span>
                  <textarea className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900" readOnly value={emailText} />
                </label>
              </div>
            </div>
            <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4">
              <QRCodeSVG value={result.link} size={192} level="M" aria-label={t.forOrganisations.qrCode} />
            </div>
          </div>
          <article className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">{t.forOrganisations.previewTitle}</h3>
            <p className="text-sm font-medium text-green-800">{t.link.verifiedFrom.replace("{org}", result.data.org)}</p>
            <h4 className="text-lg font-semibold">{result.data.title}</h4>
            <p><strong>{t.link.organisation}:</strong> {result.data.org}</p>
            <p><strong>{t.link.messageType}:</strong> {t.link.kinds[result.data.kind]}</p>
            {result.data.when && <p><strong>{t.link.when}:</strong> {new Date(result.data.when).toLocaleString(language)}</p>}
            {result.data.place && <p><strong>{t.link.place}:</strong> {result.data.place}</p>}
            {result.data.note && <p className="whitespace-pre-wrap"><strong>{t.link.note}:</strong> {result.data.note}</p>}
          </article>
        </section>
      )}
    </main>
    </>
  );
}
