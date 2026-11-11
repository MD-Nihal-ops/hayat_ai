import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AlertCircle, Check, CheckCircle2, CircleHelp, Copy, ListPlus, MessageCircle, Printer, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { evaluateValue } from "../utils/valueChecker.js";
import Modal from "./Modal.jsx";
import ReportQuestions from "./ReportQuestions.jsx";
import RegisteredMedicineCard from "./RegisteredMedicineCard.jsx";
import SpeechControls from "./SpeechControls.jsx";

function speechTextForExplanation(explanation) {
  if (!explanation) return "";
  if (explanation.schemaVersion === 2) {
    const text = [
      explanation.inShort,
      ...(explanation.mostImportant || []),
      ...(explanation.questionsForDoctor || []),
      ...(explanation.couldNotRead || []),
      explanation.closing
    ];
    for (const [sectionKey, section] of Object.entries(explanation.sections || {})) {
      if (typeof section?.summary === "string") text.push(section.summary);
      if (typeof section?.writtenReport === "string") text.push(section.writtenReport);
      if (typeof section?.reasonForVisit === "string") text.push(section.reasonForVisit);
      for (const value of Object.values(section || {})) {
        if (typeof value === "string") text.push(value);
        else if (Array.isArray(value)) {
          for (const entry of value) {
            if (typeof entry === "string") text.push(entry);
            else if (entry && typeof entry === "object") {
              text.push(...Object.values(entry).filter((part) => typeof part === "string"));
              if (entry.confirmedValue !== undefined) text.push(String(entry.confirmedValue), entry.unit);
              if (entry.status) text.push(String(entry.status));
            }
          }
        }
      }
      if (sectionKey === "prescription") {
        text.push(...(section.medicines || []).map((medicine) => medicine.registeredResult?.matches
          ?.map((match) => [match.name, match.form, match.strength, match.manufacturer, match.manufacturerCountry].filter(Boolean).join(", "))
          .join(". ")));
      }
    }
    return text.filter(Boolean).join(". ");
  }
  return [
    explanation.summary,
    ...(explanation.steps || []).flatMap((step) => [step.text, ...(step.documents || [])]),
    ...(explanation.items || []).flatMap((item) => Object.values(item).map((value) => String(value || ""))),
    explanation.closing
  ].filter(Boolean).join(". ");
}

function confirmedISODate(values) {
  const date = values
    .map((item) => `${item.name || ""} ${item.value || ""} ${item.unit || ""}`)
    .join(" ")
    .match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

function dateFromText(text) {
  const date = String(text || "").match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : "";
}

function ExplanationV2Content({ explanation, reportType, reportId, t, medicineListCheck, onCopyQuestions, questionsCopied }) {
  const sections = explanation.sections || {};
  const statusLabel = (status) => {
    if (String(status).startsWith("DANGER:")) return t.reports.statuses.danger;
    if (status === "high") return t.reports.statuses.high;
    if (status === "low") return t.reports.statuses.low;
    if (status === "within range") return t.reports.statuses.withinRange;
    if (status === "no range printed, not judged") return t.reports.statuses.notJudged;
    return status;
  };
  const StatusIcon = (status) => status === "within range"
    ? CheckCircle2
    : status === "high" || status === "low" || String(status).startsWith("DANGER:")
      ? AlertCircle
      : CircleHelp;
  const lists = (values) => values?.length > 0 && (
    <ul className="list-disc space-y-1 ps-5">{values.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}</ul>
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-2 font-semibold">{t.reports.inShort}</h3>
        <p className="whitespace-pre-line">{explanation.inShort}</p>
      </section>
      {explanation.mostImportant?.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 font-semibold">{t.reports.mostImportant}</h3>
          <ul className="list-disc space-y-1 ps-5">{explanation.mostImportant.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ul>
        </section>
      )}
      {reportType === "lab_report" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.reports.labResults}</summary>
          <div className="space-y-3">
            {(sections.labReport?.tests || []).map((test) => (
              <article className="rounded-lg bg-slate-50 p-3" key={test.name}>
                <h4 className="font-semibold">{test.name}</h4>
                <p>{t.reports.whatItMeasures}: {test.whatItMeasures}</p>
                <p>{t.reports.confirmedValue}: {test.confirmedValue} {test.unit || ""}</p>
                <p>{test.meaning}</p>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {(() => {
                    const Icon = StatusIcon(test.status);
                    return <Icon size={17} aria-hidden="true" />;
                  })()}
                  {t.reports.fields.status}: {statusLabel(test.status)}
                </p>
              </article>
            ))}
          </div>
        </details>
      )}
      {reportType === "prescription" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.reports.prescriptionDetails}</summary>
          <div className="space-y-3">
            {(sections.prescription?.medicines || []).map((medicine, index) => (
              <article className="space-y-2 rounded-lg bg-slate-50 p-3" key={`${index}-${medicine.name}`}>
                <h4 className="font-semibold">{medicine.name}</h4>
                <p>{t.reports.whatIsPrinted}: {medicine.whatIsPrinted || t.reports.informationNotVerified}</p>
                {medicine.whatIsMissing?.length > 0 && <p>{t.reports.missingDetails}: {medicine.whatIsMissing.join(", ")}</p>}
                <RegisteredMedicineCard speechId={`explanation-medicine-${reportId}-${index}`} query={medicine.name} result={medicine.registeredResult} source={medicineListCheck?.source} />
              </article>
            ))}
          </div>
        </details>
      )}
      {reportType === "discharge_summary" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.reports.dischargeDetails}</summary>
          <p>{t.reports.reasonForVisit}: {sections.dischargeSummary?.reasonForVisit || t.reports.informationNotVerified}</p>
          {[
            ["events", t.reports.events],
            ["medicines", t.reports.medicines],
            ["followUps", t.reports.followUps],
            ["warningSigns", t.reports.warningSigns]
          ].map(([key, title]) => sections.dischargeSummary?.[key]?.length > 0 && (
            <section className="mt-3" key={key}>
              <h4 className="font-medium">{title}</h4>
              {lists(sections.dischargeSummary[key])}
            </section>
          ))}
        </details>
      )}
      {reportType === "imaging_report" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.reports.writtenReport}</summary>
          <p className="whitespace-pre-line">{sections.imagingReport?.writtenReport || t.reports.informationNotVerified}</p>
        </details>
      )}
      {reportType === "bill" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.reports.billDetails}</summary>
          <ul className="space-y-2">
            {(sections.bill?.lines || []).map((line, index) => (
              <li className="flex justify-between gap-3 border-b border-slate-200 py-2" key={`${index}-${line.description}`}>
                <span>{line.description}</span><span>{line.amount || t.reports.informationNotVerified}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">{t.reports.insuranceText}: {sections.bill?.insuranceText || t.reports.informationNotVerified}</p>
        </details>
      )}
      {reportType === "referral_letter" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.referrals.stepsTitle}</summary>
          <p>{sections.referralLetter?.summary || t.reports.informationNotVerified}</p>
          {(sections.referralLetter?.steps || []).map((step, index) => {
            const date = dateFromText(step.text);
            return (
              <article className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3" key={`${index}-${step.text}`}>
                <p>{step.text}</p>
                {step.documents?.length > 0 && <p>{t.referrals.documentsToBring}: {step.documents.join(", ")}</p>}
                {date && (
                  <Link className="inline-flex min-h-[44px] items-center text-sm font-medium text-hayat-800 underline" to={`/my-day?tab=calendar&date=${encodeURIComponent(date)}&reportId=${encodeURIComponent(reportId)}&title=${encodeURIComponent(step.text.slice(0, 100))}`}>
                    {t.reports.addToCalendar}
                  </Link>
                )}
              </article>
            );
          })}
        </details>
      )}
      {reportType === "other" && (
        <details open className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">{t.reports.documentDetails}</summary>
          <p className="whitespace-pre-line">{sections.other?.summary || t.reports.informationNotVerified}</p>
        </details>
      )}
      {explanation.questionsForDoctor?.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">{t.reports.questionsToAsk}</h3>
            <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-teal-50" type="button" aria-label={t.chat.tooltipCopy} title={t.chat.tooltipCopy} onClick={onCopyQuestions}>
              {questionsCopied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            </button>
          </div>
          <ol className="list-decimal space-y-1 ps-5">{explanation.questionsForDoctor.map((question, index) => <li key={`${index}-${question}`}>{question}</li>)}</ol>
        </section>
      )}
      {explanation.couldNotRead?.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 font-semibold">{t.reports.couldNotRead}</h3>
          {lists(explanation.couldNotRead)}
        </section>
      )}
      {explanation.closing && <p className="rounded-xl border border-slate-200 bg-white p-4">{explanation.closing}</p>}
    </div>
  );
}

export default function ExplanationCard({
  report,
  explanation,
  selectedLanguage,
  easyRead = false,
  hideDanger = false,
  copied = false,
  loading = false,
  error = "",
  onRetry,
  onLanguageChange,
  onEasyReadChange,
  onCopy,
  onDownloadPdf
}) {
  const { t, language } = useLanguage();
  const [medicineListCheck, setMedicineListCheck] = useState(null);
  const [familyMessageOpen, setFamilyMessageOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMemberEmail, setFamilyMemberEmail] = useState("");
  const [familyMessageLanguage, setFamilyMessageLanguage] = useState(selectedLanguage || language);
  const [familyMessagePreview, setFamilyMessagePreview] = useState("");
  const [familyMessageLoading, setFamilyMessageLoading] = useState(false);
  const [familyMessageError, setFamilyMessageError] = useState("");
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const [questionsCopyError, setQuestionsCopyError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [includeOriginal, setIncludeOriginal] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [consent, setConsent] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState("");
  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationCopied, setInvitationCopied] = useState(false);
  const values = report.extractedValues || [];
  const hasDanger = values.some((item) =>
    evaluateValue(item.name, item.value, item.printedRange).startsWith("DANGER:")
  );
  const reportType = report.type || report.reportType;
  const reportId = report.id || report.reportId;
  const medicineChecksByName = useMemo(() => new Map(
    (medicineListCheck?.results || []).map((result) => [result.query.trim().toLowerCase(), result])
  ), [medicineListCheck]);
  const appointmentDate = useMemo(() => confirmedISODate([
    ...values,
    ...(report.documentDetails?.followUps || []).map((value) => ({ value }))
  ]), [values, report.documentDetails]);
  const invitationText = t.family.invitation.replace("{email}", invitationEmail);

  useEffect(() => {
    if (!familyMessageOpen) return undefined;
    let active = true;
    setFamilyMessageError("");
    axios.get("/api/family-circle")
      .then(({ data }) => {
        if (active) setFamilyMembers(data.filter((member) => member.status === "active"));
      })
      .catch(() => {
        if (active) setFamilyMessageError(t.family.loadFailed);
      });
    return () => { active = false; };
  }, [familyMessageOpen, t.family.loadFailed]);

  async function generateFamilyMessagePreview() {
    setFamilyMessageError("");
    setFamilyMessagePreview("");
    if (!familyMemberEmail) {
      setFamilyMessageError(t.chat.actionNeedsDetails);
      return;
    }
    setFamilyMessageLoading(true);
    try {
      const { data } = await axios.post("/api/chat/family-message-preview", {
        email: familyMemberEmail,
        reportId: Number(reportId),
        language: familyMessageLanguage
      });
      setFamilyMessagePreview(data.message);
    } catch (requestError) {
      setFamilyMessageError(requestError.response?.data?.detail || requestError.response?.data?.error || t.chat.actionFailed);
    } finally {
      setFamilyMessageLoading(false);
    }
  }

  async function copyQuestions(questions) {
    try {
      await navigator.clipboard.writeText(questions.join("\n"));
      setQuestionsCopied(true);
      setQuestionsCopyError("");
      window.setTimeout(() => setQuestionsCopied(false), 2000);
    } catch {
      setQuestionsCopyError(t.chat.copyFailed);
    }
  }

  async function submitShare(event) {
    event.preventDefault();
    if (!consent) return;
    setShareBusy(true);
    setShareError("");
    try {
      const dataCategories = ["health_report_values", "health_report_explanation"];
      if (includeOriginal) dataCategories.push("original_medical_document");
      const { data: ledgerEntry } = await axios.post("/api/consents", {
        action: "grant",
        dataCategories,
        resourceId: Number(reportId),
        recipientType: "person",
        recipient: shareEmail.trim().toLowerCase(),
        purpose: "family_report_sharing",
        optional: true,
        expiresAt: expiresAt || undefined
      });
      await axios.post("/api/shares", {
        email: shareEmail,
        reportId,
        includeOriginal,
        consentId: ledgerEntry.consentId,
        expiresAt: expiresAt || undefined
      });
      setInvitationEmail(shareEmail.trim().toLowerCase());
    } catch {
      setShareError(t.family.shareFailed);
    } finally {
      setShareBusy(false);
    }
  }

  async function denyShare() {
    setShareBusy(true);
    setShareError("");
    try {
      const dataCategories = ["health_report_values", "health_report_explanation"];
      if (includeOriginal) dataCategories.push("original_medical_document");
      await axios.post("/api/consents", {
        action: "deny",
        dataCategories,
        resourceId: Number(reportId),
        recipientType: "person",
        recipient: shareEmail.trim().toLowerCase(),
        purpose: "family_report_sharing",
        optional: true
      });
      closeShare();
    } catch {
      setShareError(t.family.consentFailed);
    } finally {
      setShareBusy(false);
    }
  }

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(invitationText);
      setInvitationCopied(true);
      window.setTimeout(() => setInvitationCopied(false), 2000);
    } catch {
      setShareError(t.family.copyFailed);
    }
  }

  function closeShare() {
    setShareOpen(false);
    setShareEmail("");
    setIncludeOriginal(false);
    setExpiresAt("");
    setConsent(false);
    setInvitationEmail("");
    setShareError("");
  }

  useEffect(() => {
    let active = true;
    if (reportType !== "prescription") {
      setMedicineListCheck(null);
      return () => { active = false; };
    }
    const names = [...new Set(values
      .map((item) => String(item.name || "").trim())
      .filter((name) => name && name.length <= 200))];
    if (!names.length) {
      setMedicineListCheck({ results: [], source: null });
      return () => { active = false; };
    }
    setMedicineListCheck({ results: [], source: null, loading: true });
    const batches = [];
    for (let index = 0; index < names.length; index += 5) batches.push(names.slice(index, index + 5));
    Promise.all(batches.map(async (batch) => {
      const { data } = await axios.post("/api/medicines/search", { names: batch });
      return data;
    }))
      .then((responses) => {
        if (active) {
          setMedicineListCheck({
            results: responses.flatMap((response) => response.results.map((result) => ({
              ...result,
              sourceDate: response.source?.date
            }))),
            source: responses[0]?.source ?? null
          });
        }
      })
      .catch(() => {
        if (active) {
          setMedicineListCheck({ results: [], source: null, error: true });
        }
      });
    return () => { active = false; };
  }, [reportId, reportType, values]);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-gray-900">
      {hasDanger && !hideDanger && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 font-semibold text-red-700" role="alert">
          {t.reports.statuses.danger}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t.reports.explanationTitle}</h2>
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <span>{t.language.label}</span>
          <select
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-gray-900"
            value={selectedLanguage || language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            <option value="en">{t.language.english}</option>
            <option value="ar">{t.language.arabic}</option>
            <option value="hi">{t.language.hindi}</option>
            <option value="ml">{t.language.malayalam}</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-1" aria-label={t.reports.explanationActions}>
        <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-teal-50" type="button" aria-label={copied ? t.chat.copied : t.chat.tooltipCopy} title={copied ? t.chat.copied : t.chat.tooltipCopy} onClick={onCopy}>{copied ? <Check size={19} aria-hidden="true" /> : <Copy size={19} aria-hidden="true" />}</button>
        <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-teal-50" type="button" aria-label={t.reports.downloadPdf} title={t.reports.downloadPdf} onClick={onDownloadPdf}><Printer size={19} aria-hidden="true" /></button>
        <label className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm">
          <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={easyRead} onChange={(event) => onEasyReadChange(event.target.checked)} />
          {t.reports.easyRead}
        </label>
        <button className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm text-hayat-800 hover:bg-teal-50" type="button" onClick={() => setFamilyMessageOpen(true)}>
          <MessageCircle size={18} aria-hidden="true" />{t.chat.familyMessage}
        </button>
        <button
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-teal-50"
          type="button"
          aria-label={t.family.shareButton}
          title={t.family.shareButton}
          onClick={() => {
            setShareError("");
            setInvitationEmail("");
            setShareOpen(true);
          }}
        >
          <Users size={19} aria-hidden="true" />
        </button>
        <Link
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-teal-50"
          to="/family/tasks?add=1"
          aria-label={t.care.addTask}
          title={t.care.addTask}
        >
          <ListPlus size={19} aria-hidden="true" />
        </Link>
        {reportType === "prescription" && (
          <Link className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm text-hayat-800 underline hover:bg-teal-50" to={`/explore?cat=pharmacy&reportId=${encodeURIComponent(reportId)}`}>
            {t.reports.pharmaciesForMedicines}
          </Link>
        )}
        {reportType === "referral_letter" && (
          <Link className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm text-hayat-800 underline hover:bg-teal-50" to={`/referrals/${encodeURIComponent(reportId)}`}>
            {t.reports.trackSteps}
          </Link>
        )}
        {reportType === "discharge_summary" && (
          <Link
            className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm text-hayat-800 underline hover:bg-teal-50"
            to={`/my-day?tab=calendar${appointmentDate ? `&date=${encodeURIComponent(appointmentDate)}` : ""}&reportId=${encodeURIComponent(reportId)}`}
          >
            {t.reports.addToCalendar}
          </Link>
        )}
      </div>
      <SpeechControls
        messageId={`explanation-${reportId}`}
        text={speechTextForExplanation(explanation)}
        language={selectedLanguage || language}
      />
      {loading && <p role="status">{t.reports.explanationLoading}</p>}
      {error && (
        <div>
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>
          <button className="mt-2 min-h-[44px] rounded-lg border border-hayat-700 px-4 font-medium text-hayat-800" type="button" onClick={onRetry}>
            {t.reports.tryAgain}
          </button>
        </div>
      )}
      {easyRead && explanation?.schemaVersion === 2 && (
        <p className="text-sm font-medium text-teal-800">{t.reports.simplifiedByAI}</p>
      )}
      {explanation && !loading && (
        <>
          {explanation.schemaVersion === 2 ? (
            <>
            <ExplanationV2Content
              explanation={explanation}
              reportType={reportType}
              reportId={reportId}
              t={t}
              medicineListCheck={medicineListCheck}
              onCopyQuestions={() => void copyQuestions(explanation.questionsForDoctor)}
              questionsCopied={questionsCopied}
            />
            {questionsCopyError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">{questionsCopyError}</p>}
            </>
          ) : (
          <>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">{t.reports.summary}</h3>
            <p>{explanation.summary}</p>
          </section>
          {reportType === "referral_letter" ? (
            <section className="space-y-3">
              <h3 className="font-semibold">{t.referrals.stepsTitle}</h3>
              {(explanation.steps || []).map((step, index) => (
                (() => {
                  const date = dateFromText(step.text);
                  return (
                    <article className="space-y-2 rounded-xl border border-slate-200 bg-white p-4" key={`${index}-${step.text}`}>
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
                      {date && (
                        <Link
                          className="inline-flex min-h-[44px] items-center text-sm font-medium text-hayat-800 underline"
                          to={`/my-day?tab=calendar&date=${encodeURIComponent(date)}&reportId=${encodeURIComponent(reportId)}&title=${encodeURIComponent(step.text.slice(0, 100))}`}
                        >
                          {t.reports.addToCalendar}
                        </Link>
                      )}
                    </article>
                  );
                })()
              ))}
            </section>
          ) : (explanation.items || []).map((item, index) => (
            <article className="space-y-2 rounded-xl border border-slate-200 bg-white p-4" key={`${index}-${item.name}`}>
              <h3 className="font-semibold">{item.name}</h3>
              {item.meaning && <p>{item.meaning}</p>}
              {item.statusNote && <p>{item.statusNote}</p>}
              {item.purpose && <p><strong>{t.reports.purpose}:</strong> {item.purpose}</p>}
              {item.usualUse && <p><strong>{t.reports.usualUse}:</strong> {item.usualUse}</p>}
              {item.commonSideEffects && <p><strong>{t.reports.commonSideEffects}:</strong> {item.commonSideEffects}</p>}
              {item.source && <p><strong>{t.reports.source}:</strong> {item.source}</p>}
              {reportType === "prescription" && (
                medicineChecksByName.has(String(item.name || "").trim().toLowerCase())
                  ? <RegisteredMedicineCard
                    speechId={`legacy-medicine-${reportId}-${index}`}
                    query={item.name}
                    result={medicineChecksByName.get(String(item.name || "").trim().toLowerCase())}
                    source={medicineListCheck?.source}
                  />
                  : medicineListCheck?.loading
                    ? <p className="text-sm text-gray-600" role="status">{t.reports.medicineLookupLoading}</p>
                    : medicineListCheck?.error
                      ? <p className="text-sm text-gray-600" role="status">{t.reports.medicineUnavailable}</p>
                      : null
              )}
              {item.covered && <p><strong>{t.reports.covered}:</strong> {item.covered}</p>}
              {item.patientPays && <p><strong>{t.reports.patientPays}:</strong> {item.patientPays}</p>}
              {item.covered && <p className="text-xs text-gray-600">{t.reports.billDemo}</p>}
            </article>
          ))}
          {explanation.closing && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 font-semibold">{t.reports.closing}</h3>
              <p>{explanation.closing}</p>
            </section>
          )}
          <p className="text-sm text-gray-600">{t.reports.disclaimer}</p>
          {medicineListCheck?.loading && <p className="text-sm text-gray-600" role="status">{t.reports.medicineUnavailable}</p>}
          </>
          )}
        </>
      )}
      {Number.isInteger(Number(reportId)) && Number(reportId) > 0 && (
        <ReportQuestions
          reportId={reportId}
          reportType={t.reports.typeLabels[reportType] || reportType}
          reportDate={report.createdAt}
          canResolve
        />
      )}
      <div className="print-only">
        <h1>{t.reports.printTitle}</h1>
        <p>{new Date(report.createdAt).toLocaleDateString(selectedLanguage || language)}</p>
        {explanation && <><h2>{explanation.schemaVersion === 2 ? t.reports.inShort : t.reports.summary}</h2><p>{explanation.inShort || explanation.summary}</p>
          {explanation.schemaVersion === 2
            ? <><h2>{t.reports.questionsToAsk}</h2><ol>{explanation.questionsForDoctor.map((question) => <li key={question}>{question}</li>)}</ol>
              <h2>{t.reports.couldNotRead}</h2><ul>{explanation.couldNotRead.map((item) => <li key={item}>{item}</li>)}</ul></>
            : reportType === "referral_letter"
            ? (explanation.steps || []).map((step, index) => <article key={`${index}-${step.text}`}><p>{step.text}</p><p>{step.documents.join(", ")}</p></article>)
            : (explanation.items || []).map((item, index) => <article key={`${index}-${item.name}`}><h2>{item.name}</h2><p>{item.meaning}</p><p>{item.statusNote}</p></article>)}
          <h2>{t.reports.closing}</h2><p>{explanation.closing}</p><p>{t.reports.disclaimer}</p>
        </>}
      </div>
      <Modal
        open={shareOpen}
        title={t.family.shareTitle}
        closeLabel={t.family.close}
        onClose={closeShare}
        direction={language === "ar" ? "rtl" : "ltr"}
        footer={invitationEmail ? null : (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="min-h-[44px] rounded-lg border border-slate-400 px-4" type="button" onClick={closeShare}>
              {t.family.cancel}
            </button>
            <button className="min-h-[44px] rounded-lg border border-slate-400 px-4 font-medium disabled:opacity-60" type="button" onClick={() => void denyShare()} disabled={shareBusy || !shareEmail.trim()}>
              {t.family.denyConsent}
            </button>
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 font-semibold text-white disabled:opacity-60" type="submit" form="share-report-form" disabled={shareBusy || !consent}>
              {shareBusy ? t.family.sharing : t.family.grantAndShare}
            </button>
          </div>
        )}
      >
        {shareError && <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{shareError}</p>}
        {invitationEmail ? (
          <div className="space-y-4">
            <p>{t.family.shared}</p>
            <p className="break-words rounded-xl bg-slate-50 p-3">{invitationText}</p>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4" type="button" onClick={copyInvitation}>
                {invitationCopied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                {invitationCopied ? t.chat.copied : t.family.copyInvitation}
              </button>
              <a className="inline-flex min-h-[44px] items-center rounded-lg bg-green-700 px-4 font-medium text-white" href={`https://wa.me/?text=${encodeURIComponent(invitationText)}`} target="_blank" rel="noopener noreferrer">
                {t.family.whatsapp}
              </a>
            </div>
            <p className="text-sm text-gray-600">{t.family.inviteNote}</p>
          </div>
        ) : (
          <form id="share-report-form" className="space-y-4" onSubmit={submitShare}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t.family.email}</span>
              <input className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="email" autoComplete="email" required value={shareEmail} onChange={(event) => { setShareEmail(event.target.value); setConsent(false); }} />
            </label>
            <label className="flex min-h-[44px] items-center gap-3">
              <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={includeOriginal} onChange={(event) => { setIncludeOriginal(event.target.checked); setConsent(false); }} />
              <span>{t.family.includeOriginal}</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t.family.endDate}</span>
              <input className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="date" min={new Date().toISOString().slice(0, 10)} value={expiresAt} onChange={(event) => { setExpiresAt(event.target.value); setConsent(false); }} />
            </label>
            <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p><strong>{t.family.consentData}:</strong> {t.family.consentReportData}{includeOriginal ? `, ${t.family.consentOriginalData}` : ""}</p>
              <p><strong>{t.family.consentReceiver}:</strong> {shareEmail || t.family.consentReceiverPlaceholder}</p>
              <p><strong>{t.family.consentPurpose}:</strong> {t.family.consentPurposeDescription}</p>
              <p><strong>{t.family.consentUse}:</strong> {t.family.consentUseDescription}</p>
              <p><strong>{t.family.consentOptional}:</strong> {t.family.consentOptionalDescription}</p>
              <p>{t.family.consentRevocation} <Link className="underline" to="/me/privacy/consents" onClick={() => setShareOpen(false)}>{t.family.consentHistoryLink}</Link>.</p>
            </section>
            <label className="flex min-h-[44px] items-start gap-3">
              <input className="mt-1 h-5 w-5 shrink-0 accent-hayat-700" type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>{t.family.consent}</span>
            </label>
            <p className="text-sm text-gray-600">{t.family.inviteNote}</p>
          </form>
        )}
      </Modal>
      <Modal
        open={familyMessageOpen}
        title={t.chat.familyMessage}
        closeLabel={t.family.close}
        onClose={() => {
          setFamilyMessageOpen(false);
          setFamilyMessagePreview("");
          setFamilyMessageError("");
        }}
        direction={language === "ar" ? "rtl" : "ltr"}
      >
        <div className="space-y-4">
          {!familyMembers.length && <p>{t.family.noMembers}</p>}
          {familyMembers.length > 0 && (
            <>
              <label className="block space-y-1">
                <span>{t.chat.recipient}</span>
                <select className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={familyMemberEmail} onChange={(event) => {
                  const email = event.target.value;
                  const member = familyMembers.find((item) => item.email === email);
                  setFamilyMemberEmail(email);
                  setFamilyMessagePreview("");
                  if (["en", "ar", "hi", "ml"].includes(member?.language)) setFamilyMessageLanguage(member.language);
                }}>
                  <option value="">{t.chat.actionNeedsDetails}</option>
                  {familyMembers.map((member) => <option key={member.id} value={member.email}>{member.name}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span>{t.chat.recipientLanguage}</span>
                <select className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={familyMessageLanguage} onChange={(event) => { setFamilyMessageLanguage(event.target.value); setFamilyMessagePreview(""); }}>
                  <option value="en">{t.chat.languageEnglish}</option>
                  <option value="ar">{t.chat.languageArabic}</option>
                  <option value="hi">{t.chat.languageHindi}</option>
                  <option value="ml">{t.chat.languageMalayalam}</option>
                </select>
              </label>
              <button className="min-h-[44px] rounded-lg border border-hayat-700 px-4 font-medium text-hayat-800 disabled:opacity-60" type="button" disabled={familyMessageLoading || !familyMemberEmail} onClick={() => void generateFamilyMessagePreview()}>
                {familyMessageLoading ? t.chat.previewLoading : t.chat.generatePreview}
              </button>
            </>
          )}
          {familyMessageError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{familyMessageError}</p>}
          {familyMessagePreview && (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap">{familyMessagePreview}</p>
              <a className="inline-flex min-h-[44px] items-center rounded-lg bg-green-700 px-4 font-medium text-white" href={`https://wa.me/?text=${encodeURIComponent(familyMessagePreview)}`} target="_blank" rel="noopener noreferrer">
                {t.chat.whatsappSend}
              </a>
            </section>
          )}
        </div>
      </Modal>
    </section>
  );
}
