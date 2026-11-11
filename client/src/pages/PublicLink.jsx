import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import SpeechControls from "../components/SpeechControls.jsx";

const sessionKey = "hayat-link-pending-save";
const supportedLanguages = ["en", "ar", "hi", "ml"];

function localDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function appointmentDateAndTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const pad = (number) => String(number).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

function escapeIcs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function downloadCalendar(data, when) {
  const date = new Date(when);
  if (!Number.isFinite(date.getTime())) return false;
  const dateStamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hayat AI//Hayat Link//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@hayat-ai`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${dateStamp}`,
    `SUMMARY:${escapeIcs(data?.title || "Clinic message")}`,
    ...(data?.place ? [`LOCATION:${escapeIcs(data.place)}`] : []),
    ...(data?.note ? [`DESCRIPTION:${escapeIcs(data.note)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hayat-appointment.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

function readPendingSave() {
  try {
    const value = window.sessionStorage.getItem(sessionKey);
    if (!value) return null;
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" &&
      (parsed.data || typeof parsed.pastedText === "string") ? parsed : null;
  } catch {
    return null;
  }
}

export default function PublicLink() {
  const { t, language, changeLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [verified, setVerified] = useState(false);
  const [signedD, setSignedD] = useState("");
  const [signedS, setSignedS] = useState("");
  const [loadingLink, setLoadingLink] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [translatedNote, setTranslatedNote] = useState("");
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [easyRead, setEasyRead] = useState(false);
  const [whenInput, setWhenInput] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const d = url.searchParams.get("d") || "";
    const s = url.searchParams.get("s") || "";
    if (d || s) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
      setSignedD(d);
      setSignedS(s);
      setLoadingLink(true);
      axios.post("/api/link/verify", { d, s })
        .then(({ data: result }) => {
          setData(result.data);
          setVerified(result.verified === true);
          setWhenInput(localDateTimeInput(result.data.when));
          if (supportedLanguages.includes(result.data.lang)) {
            setSelectedLanguage(result.data.lang);
            changeLanguage(result.data.lang);
          }
        })
        .catch(() => setLoadError(t.link.invalidLink))
        .finally(() => setLoadingLink(false));
      return;
    }

    const pending = readPendingSave();
    if (pending) {
      setData(pending.data || null);
      setVerified(pending.verified === true);
      setSignedD(pending.d || "");
      setSignedS(pending.s || "");
      setPastedText(typeof pending.pastedText === "string" ? pending.pastedText : "");
      setWhenInput(pending.whenInput || localDateTimeInput(pending.data.when));
      setSaveMessage(t.link.returnedToLink);
    }
  }, [changeLanguage, t.link.invalidLink, t.link.returnedToLink]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const speechText = useMemo(() => [
    data?.title,
    data?.when ? new Date(data.when).toLocaleString(selectedLanguage) : "",
    data?.place,
    translatedNote || data?.note,
    explanation
  ].filter(Boolean).join(". "), [data, explanation, selectedLanguage, translatedNote]);

  function selectLanguage(event) {
    const nextLanguage = event.target.value;
    setSelectedLanguage(nextLanguage);
    changeLanguage(nextLanguage);
    setTranslatedNote("");
    setTranslationError("");
  }

  async function translateNote() {
    if (!data?.note) return;
    setTranslationLoading(true);
    setTranslationError("");
    setTranslatedNote("");
    try {
      const { data: result } = await axios.post("/api/link/translate", {
        note: data.note,
        language: selectedLanguage
      });
      setTranslatedNote(typeof result.text === "string" ? result.text : "");
    } catch (error) {
      setTranslationError(error.response?.status === 429 ? t.link.rateLimited : t.link.translationFailed);
    } finally {
      setTranslationLoading(false);
    }
  }

  async function explainPastedText(event) {
    event.preventDefault();
    setExplanationLoading(true);
    setExplanationError("");
    setExplanation("");
    try {
      const { data: result } = await axios.post("/api/link/explain", {
        text: pastedText,
        language: selectedLanguage
      });
      setExplanation(typeof result.text === "string" ? result.text : "");
    } catch (error) {
      setExplanationError(error.response?.status === 429 ? t.link.rateLimited : t.link.explanationFailed);
    } finally {
      setExplanationLoading(false);
    }
  }

  function createMapsUrl() {
    if (!data?.place) return "";
    const url = new URL("https://www.google.com/maps/search/");
    url.searchParams.set("api", "1");
    url.searchParams.set("query", data.place);
    return url.toString();
  }

  function getAppointmentDraft() {
    const dateAndTime = appointmentDateAndTime(whenInput);
    if (!dateAndTime) return null;
    const title = data?.title || t.link.pastedAppointmentTitle;
    const notes = data?.note || pastedText || "";
    return {
      title,
      date: dateAndTime.date,
      time: dateAndTime.time,
      place: data?.place || "",
      notes
    };
  }

  function storePendingSave(draft) {
    const pending = {
      data,
      verified,
      d: signedD,
      s: signedS,
      whenInput,
      pastedText
    };
    window.sessionStorage.setItem(sessionKey, JSON.stringify(pending));
  }

  async function saveAppointment() {
    setActionError("");
    setSaveMessage("");
    const draft = getAppointmentDraft();
    if (!draft) {
      setActionError(t.link.chooseDateTime);
      return;
    }
    try {
      storePendingSave(draft);
    } catch {
      setActionError(t.link.saveFailed);
      return;
    }
    if (!isAuthenticated) {
      navigate("/login?returnTo=%2Flink");
      return;
    }
    setSavingAppointment(true);
    try {
      await axios.post("/api/care/appointments", draft);
      window.sessionStorage.removeItem(sessionKey);
      setSaveMessage(t.link.appointmentSaved);
    } catch {
      setActionError(t.link.saveFailed);
    } finally {
      setSavingAppointment(false);
    }
  }

  function saveCalendar() {
    setActionError("");
    if (!downloadCalendar(data, whenInput)) setActionError(t.link.chooseDateTime);
  }

  async function explainTextAndKeepTransient(event) {
    await explainPastedText(event);
  }

  const mapsUrl = createMapsUrl();
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(t.link.shareMessage)}${signedD && signedS
    ? `%0A${encodeURIComponent(`${window.location.origin}/link?d=${signedD}&s=${signedS}`)}` : ""}`;

  return (
    <>
    <a className="skip-link" href="#main-content">{t.accessibility.skipToMain}</a>
    <main id="main-content" tabIndex={-1} className="mx-auto min-h-screen w-full max-w-4xl space-y-5 bg-white px-4 py-6 text-gray-900 sm:py-10" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.link.title}</h1>
          <p className="mt-1 text-sm text-slate-700">{t.link.intro}</p>
        </div>
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <span>{t.link.language}</span>
          <select className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={selectedLanguage} onChange={selectLanguage}>
            <option value="en">{t.language.english}</option>
            <option value="ar">{t.language.arabic}</option>
            <option value="hi">{t.language.hindi}</option>
            <option value="ml">{t.language.malayalam}</option>
          </select>
        </label>
      </header>

      {loadingLink && <p className="rounded-lg border border-slate-200 bg-slate-50 p-4" role="status">{t.link.loading}</p>}
      {loadError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">{loadError}</p>}
      <label className="flex min-h-[44px] items-center gap-3">
        <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={easyRead} onChange={(event) => setEasyRead(event.target.checked)} />
        <span>{t.link.easyRead}</span>
      </label>
      {data && (
        <section className={`space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 ${easyRead ? "text-lg leading-8" : "text-base leading-7"}`}>
          {verified ? (
            <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-900" role="status">
              {t.link.verifiedFrom.replace("{org}", data.org)}
            </p>
          ) : (
            <p className="rounded-lg border border-amber-400 bg-amber-50 p-3 font-medium text-amber-950" role="alert">
              {t.link.notVerified}
            </p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-600">{t.link.messageTitle}</dt>
              <dd className="font-semibold">{data.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">{t.link.organisation}</dt>
              <dd>{data.org}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">{t.link.messageType}</dt>
              <dd>{t.link.kinds[data.kind]}</dd>
            </div>
            {data.when && (
              <div>
                <dt className="text-sm font-medium text-slate-600">{t.link.when}</dt>
                <dd>{new Date(data.when).toLocaleString(selectedLanguage)}</dd>
              </div>
            )}
            {data.place && (
              <div>
                <dt className="text-sm font-medium text-slate-600">{t.link.place}</dt>
                <dd>{data.place}</dd>
              </div>
            )}
            {data.note && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-600">{t.link.note}</dt>
                <dd className="whitespace-pre-wrap">{translatedNote || data.note}</dd>
                <button className="mt-2 inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 text-hayat-900 disabled:opacity-60" type="button" disabled={translationLoading} onClick={() => void translateNote()}>
                  {translationLoading ? t.link.translating : translatedNote ? t.link.translateAgain : t.link.translateNote}
                </button>
                {translationError && <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-gray-900" role="alert">{translationError}</p>}
              </div>
            )}
          </dl>
          <SpeechControls messageId={`hayat-link-${signedD || "pasted"}`} text={speechText} language={selectedLanguage} />
          <label className="block space-y-1">
            <span className="font-medium">{t.link.dateTimeForActions}</span>
            <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900 sm:max-w-sm" type="datetime-local" value={whenInput} onChange={(event) => setWhenInput(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white" type="button" onClick={saveCalendar}>{t.link.addCalendar}</button>
            {mapsUrl && <a className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 text-hayat-900 underline" href={mapsUrl} target="_blank" rel="noopener noreferrer">{t.link.openMaps}</a>}
            <a className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-400 px-4 py-2 text-gray-900 underline" href={whatsappUrl} target="_blank" rel="noopener noreferrer">{t.link.shareFamily}</a>
            <button className="min-h-[44px] rounded-lg border border-hayat-700 px-4 py-2 font-medium text-hayat-900" type="button" disabled={savingAppointment} onClick={() => void saveAppointment()}>
              {savingAppointment ? t.link.saving : isAuthenticated ? t.link.createAppointment : t.link.saveAccount}
            </button>
          </div>
          {saveMessage && <p className="text-green-800" role="status">{saveMessage}</p>}
          {actionError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{actionError}</p>}
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-xl font-semibold">{t.link.pasteTitle}</h2>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="note">{t.link.pastePrivacy}</p>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="note">{t.link.neverShareCodes}</p>
        <form className="space-y-3" onSubmit={(event) => void explainTextAndKeepTransient(event)}>
          <label className="block space-y-1">
            <span>{t.link.pasteLabel}</span>
            <textarea className="min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900" maxLength={800} value={pastedText} onChange={(event) => setPastedText(event.target.value)} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={explanationLoading || !pastedText.trim()}>
              {explanationLoading ? t.link.explaining : t.link.explainMessage}
            </button>
            <span className="text-sm text-slate-600">{pastedText.length}/800</span>
          </div>
        </form>
        {explanationError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{explanationError}</p>}
        {!data && (
          <label className="block space-y-1">
            <span>{t.link.dateTimeForActions}</span>
            <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900 sm:max-w-sm" type="datetime-local" value={whenInput} onChange={(event) => setWhenInput(event.target.value)} />
          </label>
        )}
        {explanation && (
          <div className={`space-y-2 border-t border-slate-200 pt-3 ${easyRead ? "text-lg leading-8" : "leading-7"}`}>
            <h3 className="font-semibold">{t.link.explanationTitle}</h3>
            <p className="whitespace-pre-wrap">{explanation}</p>
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{t.link.aiConfirmClinic}</p>
            <SpeechControls messageId="hayat-link-pasted" text={explanation} language={selectedLanguage} />
          </div>
        )}
        {pastedText && (
          <>
            <button className="min-h-[44px] rounded-lg border border-hayat-700 px-4 py-2 font-medium text-hayat-900" type="button" disabled={savingAppointment} onClick={() => void saveAppointment()}>
              {savingAppointment ? t.link.saving : isAuthenticated ? t.link.createAppointment : t.link.saveAccount}
            </button>
            {saveMessage && <p className="text-green-800" role="status">{saveMessage}</p>}
            {actionError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{actionError}</p>}
          </>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-sm">
        <span>{t.link.footer}</span>
        <Link className="min-h-[44px] inline-flex items-center text-hayat-900 underline" to="/for-organisations">{t.link.forOrganisations}</Link>
      </footer>
    </main>
    </>
  );
}
