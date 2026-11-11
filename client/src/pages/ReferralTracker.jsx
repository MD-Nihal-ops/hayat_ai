import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";

function stepDate(text) {
  const date = String(text || "").match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : "";
}

export default function ReferralTracker() {
  const { reportId } = useParams();
  const { t, language } = useLanguage();
  const [steps, setSteps] = useState([]);
  const [newStep, setNewStep] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    axios.post(`/api/referrals/from-report/${encodeURIComponent(reportId)}`, { language })
      .then(({ data }) => {
        if (active) setSteps(data);
      })
      .catch(() => {
        if (active) setError(t.referrals.loadFailed);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [language, reportId, t.referrals.loadFailed]);

  const completed = useMemo(() => steps.filter((step) => step.done).length, [steps]);
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  async function toggleStep(step) {
    setError("");
    try {
      const { data } = await axios.put(`/api/referrals/steps/${step.id}`, { done: !step.done });
      setSteps((current) => current.map((item) => item.id === data.id ? data : item));
    } catch {
      setError(t.referrals.saveFailed);
    }
  }

  async function addStep(event) {
    event.preventDefault();
    const text = newStep.trim();
    if (!text) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await axios.post(`/api/referrals/${encodeURIComponent(reportId)}/steps`, { text, documents: [] });
      setSteps((current) => [...current, data]);
      setNewStep("");
    } catch {
      setError(t.referrals.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function createTasksFromSteps() {
    setCreatingTasks(true);
    setError("");
    setTaskMessage("");
    try {
      const { data } = await axios.post(`/api/tasks/from-referral/${encodeURIComponent(reportId)}`);
      setTaskMessage(
        t.referrals.tasksCreated
          .replace("{created}", String(data.created))
          .replace("{skipped}", String(data.skipped))
      );
    } catch {
      setError(t.referrals.tasksCreateFailed);
    } finally {
      setCreatingTasks(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.referrals.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{t.referrals.subtitle}</p>
        </div>
        <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4" to="/chat">{t.referrals.backToChat}</Link>
      </header>
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
      {loading ? <PageSkeleton label={t.referrals.loading} rows={3} /> : (
        <>
          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between gap-3 text-sm font-medium">
              <span>{t.referrals.progress}</span>
              <span>{t.referrals.completed.replace("{done}", String(completed)).replace("{total}", String(steps.length))}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={t.referrals.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-hayat-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </section>
          {steps.length > 0 && (
            <div className="space-y-2">
              <button className="min-h-[44px] rounded-lg border border-hayat-700 bg-white px-4 font-medium text-hayat-900 disabled:opacity-60" type="button" disabled={creatingTasks} onClick={() => void createTasksFromSteps()}>
                {creatingTasks ? t.referrals.creatingTasks : t.referrals.turnStepsIntoTasks}
              </button>
              {taskMessage && <p className="rounded-lg bg-teal-50 p-3 text-teal-950" role="status">{taskMessage}</p>}
            </div>
          )}
          {!steps.length && <p className="rounded-xl bg-white p-4">{t.referrals.noSteps}</p>}
          <ul className="space-y-3">
            {steps.map((step) => {
              const date = stepDate(step.text);
              return (
                <li className="rounded-2xl border border-slate-200 bg-white p-4" key={step.id}>
                  <label className="flex min-h-[48px] items-start gap-3">
                    <input className="mt-1 h-6 w-6 shrink-0 accent-hayat-700" type="checkbox" checked={step.done} onChange={() => toggleStep(step)} />
                    <span className={step.done ? "text-gray-500 line-through" : "font-medium"}>{step.text}</span>
                  </label>
                  {step.documents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-sm font-medium">{t.referrals.documentsToBring}:</span>
                      {step.documents.map((document, index) => (
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-900" key={`${index}-${document}`}>{document}</span>
                      ))}
                    </div>
                  )}
                  {date && (
                    <Link
                      className="mt-2 inline-flex min-h-[44px] items-center text-sm font-medium text-hayat-800 underline"
                      to={`/my-day?tab=calendar&date=${encodeURIComponent(date)}&reportId=${encodeURIComponent(reportId)}&title=${encodeURIComponent(step.text.slice(0, 100))}`}
                    >
                      {t.reports.addToCalendar}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <form className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row" onSubmit={addStep}>
            <input className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={newStep} maxLength={500} onChange={(event) => setNewStep(event.target.value)} aria-label={t.referrals.addStep} placeholder={t.referrals.stepPlaceholder} />
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 font-medium text-white disabled:opacity-60" type="submit" disabled={!newStep.trim() || saving}>{saving ? t.referrals.saving : t.referrals.addStep}</button>
          </form>
          <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-950">{t.referrals.notice}</p>
        </>
      )}
    </section>
  );
}
