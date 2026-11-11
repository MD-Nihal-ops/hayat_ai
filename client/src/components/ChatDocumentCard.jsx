import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileText, Pencil, Check, ListTodo, Plus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { evaluateValue } from "../utils/valueChecker.js";
import useAuthedBlobUrl from "../hooks/useAuthedBlobUrl.js";
import ExplanationCard from "./ExplanationCard.jsx";
import ReviewTable from "./ReviewTable.jsx";

function finiteNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function spokenExplanation(explanation) {
  if (explanation?.schemaVersion === 2) {
    return [
      explanation.inShort,
      ...explanation.mostImportant,
      JSON.stringify(explanation.sections),
      ...explanation.questionsForDoctor,
      ...explanation.couldNotRead,
      explanation.closing
    ].filter(Boolean).join(". ");
  }
  return [
    explanation?.summary,
    ...(explanation?.items || []).flatMap((item) => [
      item.name, item.meaning, item.statusNote, item.purpose, item.usualUse,
      item.commonSideEffects, item.source, item.covered, item.patientPays
    ]),
    explanation?.closing
  ].filter(Boolean).join(". ");
}

export default function ChatDocumentCard({ item, multiplePatients = false, onPersist }) {
  const { t, language } = useLanguage();
  const payload = typeof item.payload === "string" ? JSON.parse(item.payload || "{}") : item.payload || {};
  const reportId = Number(payload.reportId);
  const documentFile = useAuthedBlobUrl(
    Number.isInteger(reportId) && reportId > 0 ? `/api/reports/${reportId}/file` : "",
    Number.isInteger(reportId) && reportId > 0,
    t.reports.historyFailed
  );
  const [report, setReport] = useState(null);
  const [values, setValues] = useState([]);
  const [documentDate, setDocumentDate] = useState(
    isValidDate(payload.documentDate) ? payload.documentDate : localDateString()
  );
  const [explanation, setExplanation] = useState(null);
  const [cardLanguage, setCardLanguage] = useState(payload.language || language);
  const [easyRead, setEasyRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [explanationFailed, setExplanationFailed] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskSaved, setTaskSaved] = useState(false);
  const hasDanger = useMemo(() => values.some((value) =>
    evaluateValue(value.name, value.value, value.printedRange).startsWith("DANGER:")
  ), [values]);

  async function loadReport() {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`/api/reports/${encodeURIComponent(reportId)}`);
      setReport(data);
      setValues(data.extractedValues || []);
      if (data.status === "confirmed" && item.messageType === "explanation") {
        const savedExplanation = data.explanations?.[easyRead ? `${cardLanguage}_easy` : cardLanguage] ||
          (!easyRead ? data.explanations?.[cardLanguage] : null);
        if (savedExplanation) {
          setExplanation(savedExplanation);
        } else {
          await requestExplanation(data, cardLanguage, false);
        }
      } else {
        setExplanation(null);
      }
    } catch (loadError) {
      if (loadError.response?.status === 404) {
        setReport({ deleted: true });
        setError("");
      } else {
        setError(loadError.response?.data?.error || t.reports.historyFailed);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isInteger(reportId) || reportId <= 0) {
      setReport({ deleted: true });
      setLoading(false);
      return;
    }
    void loadReport();
  // Loading is tied to the persisted message reference, not to the render-time language.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, item.messageType]);

  async function requestExplanation(currentReport, targetLanguage, persist = true, targetEasyRead = easyRead) {
    if (!currentReport || currentReport.status !== "confirmed") return;
    setExplaining(true);
    setError("");
    try {
      const { data } = await axios.post(`/api/reports/${currentReport.id}/explain`, {
        language: targetLanguage,
        easyRead: targetEasyRead
      });
      setExplanation(data);
      setExplanationFailed(false);
      if (persist) {
        await onPersist("explanation", currentReport.id, targetLanguage);
        await onPersist("text", null, targetLanguage, t.chat.explainMore, "explanation_followup");
      }
    } catch (requestError) {
      setExplanationFailed(true);
      setError(requestError.response?.data?.detail || t.reports.explanationFailed);
    } finally {
      setExplaining(false);
    }
  }

  async function confirmAndExplain() {
    setError("");
    setExplaining(true);
    const confirmedValues = values.map((value) => ({
      ...value,
      value: value.value === "" ? "" : (finiteNumber(value.value) ?? value.value),
      unit: value.unit === "" ? null : value.unit,
      printedRange: {
        min: finiteNumber(value.printedRange?.min),
        max: finiteNumber(value.printedRange?.max)
      }
    }));
    try {
      await axios.post(`/api/reports/${report.id}/confirm`, {
        extractedValues: confirmedValues,
        documentDate
      });
      const confirmedReport = { ...report, status: "confirmed", extractedValues: confirmedValues };
      setReport(confirmedReport);
      setValues(confirmedValues);
      setEditing(false);
      await requestExplanation(confirmedReport, cardLanguage, true, easyRead);
    } catch (confirmError) {
      setError(confirmError.response?.data?.detail || confirmError.response?.data?.error || t.reports.confirmFailed);
    } finally {
      setExplaining(false);
    }
  }

  async function changeLanguage(nextLanguage) {
    setCardLanguage(nextLanguage);
    if (report?.status === "confirmed") {
      const saved = report.explanations?.[easyRead ? `${nextLanguage}_easy` : nextLanguage] ||
        (!easyRead ? report.explanations?.[nextLanguage] : null);
      setExplanation(saved || null);
      if (!saved) await requestExplanation(report, nextLanguage, true, easyRead);
    }
  }

  async function changeEasyRead(enabled) {
    setEasyRead(enabled);
    if (report?.status !== "confirmed") return;
    const key = enabled ? `${cardLanguage}_easy` : cardLanguage;
    const saved = report.explanations?.[key] || (!enabled ? report.explanations?.[cardLanguage] : null);
    setExplanation(saved || null);
    if (!saved) await requestExplanation(report, cardLanguage, true, enabled);
  }

  async function copyExplanation() {
    try {
      await navigator.clipboard.writeText(spokenExplanation(explanation));
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError(t.chat.copyFailed);
    }
  }

  if (loading) return <p className="rounded-xl bg-white p-4 text-slate-600" role="status">{t.reports.historyLoading}</p>;
  if (report?.deleted) return <p className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900">{t.chat.documentDeleted}</p>;
  if (error && !report) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <p role="alert">{error}</p>
        <button className="mt-2 min-h-[44px] rounded-lg border border-amber-700 px-4 text-amber-950" type="button" onClick={() => void loadReport()}>{t.chat.retry}</button>
      </div>
    );
  }

  const isConfirmed = report.status === "confirmed";
  const showExplanation = item.messageType === "explanation" && isConfirmed;
  const previewPanel = (
    <div className="min-w-0">
      <h3 className="mb-2 font-semibold">{t.reports.previewTitle}</h3>
      {documentFile.type === "application/pdf" && documentFile.url ? (
        <a className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-hayat-800 underline" href={documentFile.url} target="_blank" rel="noopener noreferrer">
          <FileText size={32} aria-hidden="true" />
          {t.reports.openDocument}
        </a>
      ) : documentFile.type.startsWith("image/") && documentFile.url ? (
        <img className="max-h-72 w-full rounded-xl border border-slate-200 object-contain" src={documentFile.url} alt={t.reports.previewAlt} />
      ) : documentFile.loading ? (
        <p className="flex min-h-40 items-center justify-center" role="status">{t.reports.historyLoading}</p>
      ) : documentFile.error ? (
        <p className="flex min-h-40 items-center justify-center text-amber-900" role="alert">{documentFile.error}</p>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-xl bg-slate-100">{t.reports.demoReport}</div>
      )}
    </div>
  );
  const reviewPanel = (
    <div className="min-w-0">
      <ReviewTable
        values={values}
        onChange={setValues}
        multiplePatients={report.multiplePatients || multiplePatients}
        readOnly={isConfirmed && !editing}
        documentDate={documentDate}
        onDocumentDateChange={setDocumentDate}
        reportType={report.type}
      />
      {isConfirmed && !editing && (
        <button className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-hayat-700 px-4 font-medium text-hayat-800" type="button" onClick={() => setEditing(true)}>
          <Pencil size={17} aria-hidden="true" />{t.reports.editValues}
        </button>
      )}
      {(!isConfirmed || editing) && (
        <button className="mt-3 min-h-[44px] rounded-lg bg-hayat-700 px-5 font-semibold text-white disabled:opacity-60" type="button" disabled={explaining} onClick={() => void confirmAndExplain()}>
          {explaining ? t.reports.confirming : t.reports.confirm}
        </button>
      )}
    </div>
  );
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-gray-900">
      {showExplanation && hasDanger && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold text-gray-900" role="alert">
          {t.reports.statuses.danger}
        </p>
      )}
      {!showExplanation && <div className="grid gap-4 md:grid-cols-2">{previewPanel}{reviewPanel}</div>}
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      {explaining && isConfirmed && <p className="text-gray-700" role="status">{t.reports.explanationLoading}</p>}
      {explanationFailed && !showExplanation && (
        <button className="min-h-[44px] rounded-lg border border-amber-700 px-4 font-medium text-amber-950" type="button" onClick={() => void requestExplanation(report, cardLanguage)}>
          {t.reports.tryAgain}
        </button>
      )}
      {showExplanation && (
        <>
          <div className="grid items-start gap-4 md:grid-cols-2">
          {previewPanel}
          <div className="min-w-0 space-y-4">
          {reviewPanel}
          <ExplanationCard
            report={report}
            explanation={explanation}
            selectedLanguage={cardLanguage}
            easyRead={easyRead}
            hideDanger={hasDanger}
            copied={copyDone}
            loading={explaining}
            error={error}
            onRetry={() => void requestExplanation(report, cardLanguage)}
            onLanguageChange={(nextLanguage) => void changeLanguage(nextLanguage)}
            onEasyReadChange={(enabled) => void changeEasyRead(enabled)}
            onCopy={() => void copyExplanation()}
            onDownloadPdf={() => window.print()}
          />
          {isConfirmed && (
            <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-gray-900">
              {taskSaved ? (
                <p className="text-sm font-medium text-emerald-800" role="status">{t.chat.taskAdded}</p>
              ) : (
                <>
                  {!addingTask && (
                    <button
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-hayat-700 px-3 font-medium text-hayat-800"
                      type="button"
                      onClick={() => {
                        setTaskTitle("");
                        setAddingTask(true);
                      }}
                    >
                      <ListTodo size={18} aria-hidden="true" />
                      <Plus size={16} aria-hidden="true" />
                      {t.chat.addTask}
                    </button>
                  )}
                  {addingTask && (
                    <form
                      className="flex flex-wrap gap-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const title = taskTitle.trim();
                        if (!title) return;
                        setTaskError("");
                        try {
                          await axios.post("/api/tasks", { title, reportId });
                          setTaskSaved(true);
                          setAddingTask(false);
                        } catch (saveError) {
                          setTaskError(saveError.response?.data?.error || t.chat.taskAddFailed);
                        }
                      }}
                    >
                      <label className="min-w-[220px] flex-1">
                        <span className="sr-only">{t.chat.taskTitle}</span>
                        <input
                          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900"
                          value={taskTitle}
                          maxLength={120}
                          required
                          onChange={(event) => setTaskTitle(event.target.value)}
                          aria-label={t.chat.taskTitle}
                        />
                      </label>
                      <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white" type="submit">
                        {t.chat.confirmAction}
                      </button>
                    </form>
                  )}
                  {taskError && <p className="text-sm text-amber-900" role="alert">{taskError}</p>}
                </>
              )}
            </section>
          )}
          </div>
          </div>
        </>
      )}
      {copyDone && <p className="text-sm text-green-700" role="status"><Check size={16} className="inline" aria-hidden="true" /> {t.chat.copied}</p>}
      {hasDanger && !showExplanation && <p className="sr-only">{t.reports.statuses.danger}</p>}
    </div>
  );
}
