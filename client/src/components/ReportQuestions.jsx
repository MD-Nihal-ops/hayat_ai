import { useEffect, useState } from "react";
import axios from "axios";
import { Printer } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

function formattedDate(value, language) {
  if (!value) return "";
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(language);
}

function printQuestions() {
  const clearPrintMode = () => document.body.classList.remove("questions-print-mode");
  document.body.classList.add("questions-print-mode");
  window.addEventListener("afterprint", clearPrintMode, { once: true });
  window.print();
  window.setTimeout(clearPrintMode, 60000);
}

export default function ReportQuestions({ reportId, reportType, reportDate, canResolve = false }) {
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    axios.get(`/api/questions/report/${encodeURIComponent(reportId)}`)
      .then(({ data }) => {
        if (active) setQuestions(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.status === 403
            ? t.family.accessEnded
            : t.family.questionsLoadFailed);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reportId, t.family.questionsLoadFailed]);

  async function addQuestion(event) {
    event.preventDefault();
    const questionText = text.trim();
    if (!questionText || questionText.length > 300 || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`/api/questions/report/${encodeURIComponent(reportId)}`, {
        text: questionText
      });
      setQuestions((current) => [...current, data]);
      setText("");
    } catch (requestError) {
      setError(requestError.response?.status === 403
        ? t.family.accessEnded
        : requestError.response?.status === 409
          ? t.family.questionLimitReached
          : t.family.questionAddFailed);
    } finally {
      setBusy(false);
    }
  }

  async function setResolved(question, resolved) {
    setError("");
    try {
      await axios.patch(`/api/questions/${question.id}`, { resolved });
      setQuestions((current) => current.map((item) =>
        item.id === question.id ? { ...item, resolved } : item
      ));
    } catch {
      setError(t.family.questionUpdateFailed);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{t.family.questionsTitle}</h3>
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-gray-900 hover:bg-slate-50"
          type="button"
          onClick={printQuestions}
          aria-label={t.family.printQuestions}
          title={t.family.printQuestions}
        >
          <Printer size={18} aria-hidden="true" />
          {t.family.printQuestions}
        </button>
      </div>
      {loading && <p role="status">{t.family.loading}</p>}
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      {!loading && !questions.length && <p className="text-sm text-gray-600">{t.family.noQuestions}</p>}
      <ul className="space-y-2">
        {questions.map((question) => (
          <li className="rounded-lg border border-slate-200 p-3" key={question.id}>
            <p className="text-sm text-gray-600">{question.authorName}</p>
            <p className="whitespace-pre-wrap">{question.text}</p>
            {canResolve && (
              <label className="mt-2 inline-flex min-h-[44px] items-center gap-2">
                <input
                  type="checkbox"
                  role="switch"
                  checked={question.resolved}
                  onChange={(event) => void setResolved(question, event.target.checked)}
                />
                <span>{t.family.markAsAsked}</span>
              </label>
            )}
            {question.resolved && <p className="mt-1 text-sm text-gray-600">{t.family.questionAsked}</p>}
          </li>
        ))}
      </ul>
      <form className="space-y-2" onSubmit={(event) => void addQuestion(event)}>
        <label className="block font-medium" htmlFor={`question-${reportId}`}>{t.family.addQuestion}</label>
        <textarea
          id={`question-${reportId}`}
          className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-900"
          value={text}
          maxLength={300}
          onChange={(event) => setText(event.target.value)}
          aria-describedby={`question-counter-${reportId}`}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-gray-600" id={`question-counter-${reportId}`}>{text.length}/300</span>
          <button
            className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white disabled:opacity-50"
            type="submit"
            disabled={!text.trim() || text.trim().length > 300 || busy}
          >
            {busy ? t.family.questionAdding : t.family.addQuestion}
          </button>
        </div>
      </form>
      <div className="questions-print-only">
        <h1>{t.family.questionsTitle}</h1>
        <h2>{reportType}</h2>
        <p>{formattedDate(reportDate, language)}</p>
        {questions.map((question) => (
          <article key={question.id}>
            <p><strong>{question.authorName}</strong></p>
            <p>{question.text}</p>
            {question.resolved && <p>{t.family.questionAsked}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
