import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import useAuthedBlobUrl from "../hooks/useAuthedBlobUrl.js";
import ReportQuestions from "./ReportQuestions.jsx";
import SpeechControls from "./SpeechControls.jsx";

const supportedLanguages = new Set(["en", "ar", "hi", "ml"]);

function storedViewerLanguage(fallback) {
  const savedLanguage = window.localStorage.getItem("hayat-shared-language");
  return supportedLanguages.has(savedLanguage) ? savedLanguage : fallback;
}

function reportDate(value, language) {
  if (!value) return "";
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  return new Date(timestamp).toLocaleDateString(language);
}

function statusLabel(status, reports) {
  if (status.startsWith("DANGER:")) return reports.statuses.danger;
  if (status === "within range") return reports.statuses.withinRange;
  if (status === "high") return reports.statuses.high;
  if (status === "low") return reports.statuses.low;
  return reports.statuses.notJudged;
}

export default function SharedReportView({ shareId }) {
  const { t, language } = useLanguage();
  const [shared, setShared] = useState(null);
  const [translationLanguage, setTranslationLanguage] = useState(() => storedViewerLanguage(language));
  const [translationLoading, setTranslationLoading] = useState(false);
  const [accessEnded, setAccessEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const file = useAuthedBlobUrl(
    shared?.includeOriginal ? `/api/shared/${shareId}/file` : "",
    Boolean(shared?.includeOriginal),
    t.family.fileFailed
  );
  const report = shared?.report;
  const values = report?.extractedValues || [];
  const explanation = report?.explanation;
  const spokenText = useMemo(() => [
    t.family.sharedBanner.replace("{name}", shared?.ownerName || ""),
    ...values.map((item) => `${item.name}: ${item.value} ${item.unit || ""}. ${item.status}`),
    explanation?.inShort || explanation?.summary || "",
    ...(explanation?.mostImportant || []),
    ...Object.values(explanation?.sections || {}).flatMap((section) =>
      Object.values(section || {}).flatMap((value) =>
        typeof value === "string" ? [value] : Array.isArray(value)
          ? value.flatMap((entry) => typeof entry === "string"
            ? [entry]
            : entry && typeof entry === "object"
              ? Object.values(entry).flatMap((part) =>
                typeof part === "string" ? [part] : Array.isArray(part) ? part : []
              )
              : [])
          : []
      )
    ),
    ...(explanation?.questionsForDoctor || []),
    ...(explanation?.couldNotRead || []),
    ...(explanation?.steps || []).flatMap((step) => [step.text, ...(step.documents || [])]),
    ...(explanation?.items || []).flatMap((item) => [item.name, item.meaning, item.statusNote]),
    explanation?.closing || ""
  ].filter(Boolean).join("\n"), [explanation, shared?.ownerName, t.family.sharedBanner, values]);

  useEffect(() => {
    let active = true;
    const preferredLanguage = storedViewerLanguage(language);
    setLoading(true);
    setError("");
    setAccessEnded(false);
    setTranslationLanguage(preferredLanguage);
    window.localStorage.setItem("hayat-shared-language", preferredLanguage);
    axios.get(`/api/shared/${shareId}`, { params: { language: preferredLanguage } })
      .then(async ({ data }) => {
        if (!active) return;
        setShared(data);
        if (preferredLanguage !== data.report.explanationLanguage) {
          setTranslationLoading(true);
          try {
            const translated = await axios.post(`/api/shared/${shareId}/translate`, { language: preferredLanguage });
            if (active) {
              setShared((current) => current && ({
                ...current,
                report: {
                  ...current.report,
                  explanation: translated.data,
                  explanationLanguage: preferredLanguage
                }
              }));
            }
          } catch (requestError) {
            if (!active) return;
            if (requestError.response?.status === 403) setAccessEnded(true);
            else if (requestError.response?.status === 429) setError(t.family.translationLimit);
            else setError(t.family.translationFailed);
          } finally {
            if (active) setTranslationLoading(false);
          }
        }
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.response?.status === 403) setAccessEnded(true);
        else setError(t.family.loadFailed);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language, shareId, t.family.loadFailed, t.family.translationFailed, t.family.translationLimit]);

  async function changeTranslationLanguage(event) {
    const nextLanguage = event.target.value;
    if (!supportedLanguages.has(nextLanguage)) return;
    if (nextLanguage === report?.explanationLanguage) {
      setTranslationLanguage(nextLanguage);
      window.localStorage.setItem("hayat-shared-language", nextLanguage);
      setError("");
      return;
    }
    setTranslationLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`/api/shared/${shareId}/translate`, { language: nextLanguage });
      setShared((current) => current && ({
        ...current,
        report: {
          ...current.report,
          explanation: data,
          explanationLanguage: nextLanguage
        }
      }));
      setTranslationLanguage(nextLanguage);
      window.localStorage.setItem("hayat-shared-language", nextLanguage);
    } catch (requestError) {
      if (requestError.response?.status === 403) setAccessEnded(true);
      else if (requestError.response?.status === 429) setError(t.family.translationLimit);
      else setError(t.family.translationFailed);
    } finally {
      setTranslationLoading(false);
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(spokenText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.family.copyFailed);
    }
  }

  if (loading) return <p className="rounded-xl bg-white p-4 text-gray-900" role="status">{t.family.loading}</p>;
  if (accessEnded) return <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-gray-900" role="status">{t.family.accessEnded}</p>;
  if (error && !shared) return <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">{error}</p>;
  if (!shared || !report) return null;

  return (
    <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <p className="rounded-lg border border-hayat-100 bg-hayat-50 p-3 font-medium">
        {t.family.sharedBanner.replace("{name}", shared.ownerName)}
      </p>
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      <label className="flex min-h-[44px] items-center gap-2 text-sm">
        <span>{t.language.label}</span>
        <select
          className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-gray-900"
          value={translationLanguage}
          onChange={changeTranslationLanguage}
          aria-label={t.language.label}
          disabled={translationLoading}
        >
          <option value="en">{t.language.english}</option>
          <option value="ar">{t.language.arabic}</option>
          <option value="hi">{t.language.hindi}</option>
          <option value="ml">{t.language.malayalam}</option>
        </select>
      </label>
      {translationLoading && <p role="status">{t.family.translationLoading}</p>}
      <div className="flex flex-wrap gap-1" aria-label={t.family.viewActions}>
        <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-hayat-800 hover:bg-hayat-50" type="button" aria-label={copied ? t.chat.copied : t.chat.tooltipCopy} title={copied ? t.chat.copied : t.chat.tooltipCopy} onClick={copyReport}>
          {copied ? <Check size={19} aria-hidden="true" /> : <Copy size={19} aria-hidden="true" />}
        </button>
      </div>
      <SpeechControls
        messageId={`shared-report-${shareId}`}
        text={spokenText}
        language={report.explanationLanguage || language}
      />
      <header>
        <h2 className="text-lg font-semibold">{t.reports.typeLabels[report.type] || report.type}</h2>
        <p className="text-sm text-gray-600">{reportDate(report.createdAt, language)}</p>
      </header>
      {shared.includeOriginal && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
          {file.loading && <p role="status">{t.family.loading}</p>}
          {file.error && <p className="text-amber-900" role="alert">{file.error === "Access ended or not allowed" ? t.family.accessEnded : file.error}</p>}
          {file.url && file.type.startsWith("image/") && <img className="mx-auto max-h-96 object-contain" src={file.url} alt={t.reports.previewAlt} />}
          {file.url && file.type === "application/pdf" && <iframe className="h-[60vh] w-full" src={file.url} title={t.reports.previewTitle} />}
        </section>
      )}
      <section className="space-y-3">
        <h3 className="font-semibold">{t.reports.checkValues}</h3>
        {values.map((item, index) => (
          <div className="rounded-xl border border-slate-200 p-3" key={`${index}-${item.name}`}>
            <p className="font-medium">{item.name}: {String(item.value)} {item.unit}</p>
            {item.printedRange && <p className="text-sm text-gray-600">{t.family.printedRange}: {item.printedRange.min ?? "—"} – {item.printedRange.max ?? "—"}</p>}
            <p>{statusLabel(item.status, t.reports)}</p>
          </div>
        ))}
      </section>
      {explanation ? (
        <section className="space-y-3" dir={report.explanationLanguage === "ar" ? "rtl" : "ltr"}>
          <p className="text-sm text-gray-600">{t.family.translationNotice}</p>
          {explanation.schemaVersion === 2 ? (
            <>
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-2 font-semibold">{t.reports.inShort}</h3>
                <p className="whitespace-pre-line">{explanation.inShort}</p>
              </div>
              {explanation.mostImportant?.length > 0 && (
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-2 font-semibold">{t.reports.mostImportant}</h3>
                  <ul className="list-disc space-y-1 ps-5">{explanation.mostImportant.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ul>
                </section>
              )}
              {report.type === "lab_report" && (explanation.sections.labReport?.tests || []).map((test) => (
                <article className="space-y-1 rounded-xl border border-slate-200 p-4" key={test.name}>
                  <h3 className="font-semibold">{test.name}</h3>
                  <p>{t.reports.whatItMeasures}: {test.whatItMeasures}</p>
                  <p>{t.reports.confirmedValue}: {test.confirmedValue} {test.unit || ""}</p>
                  <p>{test.meaning}</p>
                  <p>{statusLabel(test.status, t.reports)}</p>
                </article>
              ))}
              {report.type === "prescription" && (explanation.sections.prescription?.medicines || []).map((medicine, index) => (
                <article className="space-y-1 rounded-xl border border-slate-200 p-4" key={`${index}-${medicine.name}`}>
                  <h3 className="font-semibold">{medicine.name}</h3>
                  <p>{t.reports.whatIsPrinted}: {medicine.whatIsPrinted || t.reports.informationNotVerified}</p>
                  {medicine.whatIsMissing?.length > 0 && <p>{t.reports.missingDetails}: {medicine.whatIsMissing.join(", ")}</p>}
                </article>
              ))}
              {report.type === "discharge_summary" && (
                <section className="space-y-2 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold">{t.reports.dischargeDetails}</h3>
                  <p>{t.reports.reasonForVisit}: {explanation.sections.dischargeSummary?.reasonForVisit || t.reports.informationNotVerified}</p>
                  {["events", "medicines", "followUps", "warningSigns"].map((key) => (
                    explanation.sections.dischargeSummary?.[key]?.length > 0 && <p key={key}><strong>{t.reports[key]}:</strong> {explanation.sections.dischargeSummary[key].join("; ")}</p>
                  ))}
                </section>
              )}
              {report.type === "imaging_report" && <p className="whitespace-pre-line rounded-xl border border-slate-200 p-4">{explanation.sections.imagingReport?.writtenReport || t.reports.informationNotVerified}</p>}
              {report.type === "bill" && (
                <section className="space-y-2 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold">{t.reports.billDetails}</h3>
                  {(explanation.sections.bill?.lines || []).map((line, index) => <p key={`${index}-${line.description}`}>{line.description}: {line.amount || t.reports.informationNotVerified}</p>)}
                  <p>{t.reports.insuranceText}: {explanation.sections.bill?.insuranceText || t.reports.informationNotVerified}</p>
                </section>
              )}
              {report.type === "referral_letter" && (
                <section className="space-y-2 rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold">{t.referrals.stepsTitle}</h3>
                  <p>{explanation.sections.referralLetter?.summary || t.reports.informationNotVerified}</p>
                  {(explanation.sections.referralLetter?.steps || []).map((step, index) => (
                    <article className="rounded-lg border border-slate-200 p-3" key={`${index}-${step.text}`}>
                      <p>{step.text}</p>
                      {step.documents?.length > 0 && <p>{t.referrals.documentsToBring}: {step.documents.join(", ")}</p>}
                    </article>
                  ))}
                </section>
              )}
              {report.type === "other" && <p className="whitespace-pre-line rounded-xl border border-slate-200 p-4">{explanation.sections.other?.summary || t.reports.informationNotVerified}</p>}
              {explanation.questionsForDoctor?.length > 0 && (
                <section className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-2 font-semibold">{t.reports.questionsToAsk}</h3>
                  <ol className="list-decimal space-y-1 ps-5">{explanation.questionsForDoctor.map((question, index) => <li key={`${index}-${question}`}>{question}</li>)}</ol>
                </section>
              )}
              {explanation.couldNotRead?.length > 0 && (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 font-semibold">{t.reports.couldNotRead}</h3>
                  <ul className="list-disc ps-5">{explanation.couldNotRead.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
                </section>
              )}
              {explanation.closing && <p className="rounded-xl border border-slate-200 p-4">{explanation.closing}</p>}
            </>
          ) : (
          <>
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 font-semibold">{t.reports.summary}</h3>
            <p>{explanation.summary}</p>
          </div>
          {Array.isArray(explanation.steps) && (
            <section className="space-y-3">
              <h3 className="font-semibold">{t.referrals.stepsTitle}</h3>
              {explanation.steps.map((step, index) => (
                <article className="space-y-2 rounded-xl border border-slate-200 p-4" key={`${index}-${step.text}`}>
                  <p>{step.text}</p>
                  {step.documents?.length > 0 && (
                    <div className="flex flex-wrap gap-2" aria-label={t.referrals.documentsToBring}>
                      {step.documents.map((document, documentIndex) => (
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-900" key={`${documentIndex}-${document}`}>
                          {document}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </section>
          )}
          {(explanation.items || []).map((item, index) => (
            <article className="space-y-2 rounded-xl border border-slate-200 p-4" key={`${index}-${item.name}`}>
              <h3 className="font-semibold">{item.name}</h3>
              {item.meaning && <p>{item.meaning}</p>}
              {item.statusNote && <p>{item.statusNote}</p>}
              {item.purpose && <p><strong>{t.reports.purpose}:</strong> {item.purpose}</p>}
              {item.usualUse && <p><strong>{t.reports.usualUse}:</strong> {item.usualUse}</p>}
              {item.commonSideEffects && <p><strong>{t.reports.commonSideEffects}:</strong> {item.commonSideEffects}</p>}
            </article>
          ))}
          {explanation.closing && <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-2 font-semibold">{t.reports.closing}</h3><p>{explanation.closing}</p></section>}
          <p className="text-sm text-gray-600">{t.reports.disclaimer}</p>
          </>
          )}
        </section>
      ) : <p className="text-gray-600">{t.family.noExplanation}</p>}
      <ReportQuestions
        reportId={report.id}
        reportType={t.reports.typeLabels[report.type] || report.type}
        reportDate={report.createdAt}
      />
    </article>
  );
}
