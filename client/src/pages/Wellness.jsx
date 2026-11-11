import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const emptyGoals = {
  stepsTarget: 0,
  activityMinutesTarget: 0,
  waterGlassesTarget: 0,
  sleepHoursTarget: 0,
  habitText: ""
};

const goalFields = [
  ["stepsTarget", "steps", 150000, 1],
  ["activityMinutesTarget", "activityMinutes", 1440, 1],
  ["waterGlassesTarget", "waterGlasses", 100, 1],
  ["sleepHoursTarget", "sleepHours", 24, 0.25]
];

function sumLogs(logs, key) {
  return logs.reduce((sum, log) => sum + (Number(log[key]) || 0), 0);
}

export default function Wellness() {
  const { t, language } = useLanguage();
  const today = localDateString();
  const [overview, setOverview] = useState(null);
  const [challenges, setChallenges] = useState({ owned: [], incoming: [] });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [goalDraft, setGoalDraft] = useState(emptyGoals);
  const [logDraft, setLogDraft] = useState({ date: today, steps: "", activityMinutes: "", waterGlasses: "", sleepHours: "", habitDone: false });
  const [preventionDraft, setPreventionDraft] = useState({ kind: "checkup", title: "", remindOn: "" });
  const [challengeKey, setChallengeKey] = useState("");
  const [selectedFamilyIds, setSelectedFamilyIds] = useState([]);
  const [joinChoices, setJoinChoices] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [overviewResponse, challengeResponse, familyResponse] = await Promise.all([
        axios.get("/api/wellness", { params: { date: today } }),
        axios.get("/api/wellness/challenges"),
        axios.get("/api/family-circle")
      ]);
      setOverview(overviewResponse.data);
      setChallenges(challengeResponse.data);
      setFamilyMembers(familyResponse.data.filter((member) => member.status === "active" && member.role === "caregiver"));
      setGoalDraft(overviewResponse.data.goals || emptyGoals);
      setLogDraft({
        date: today,
        steps: overviewResponse.data.todayLog?.steps ?? "",
        activityMinutes: overviewResponse.data.todayLog?.activityMinutes ?? "",
        waterGlasses: overviewResponse.data.todayLog?.waterGlasses ?? "",
        sleepHours: overviewResponse.data.todayLog?.sleepHours ?? "",
        habitDone: overviewResponse.data.todayLog?.habitDone === 1
      });
    } catch {
      setError(t.wellness.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.wellness.loadFailed, today]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action) {
    setSaving(true);
    setActionError("");
    setSaved(false);
    try {
      await action();
      await load();
      setSaved(true);
    } catch (actionFailure) {
      setActionError(actionFailure.response?.data?.error || t.wellness.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function updateGoal(field, value) {
    setGoalDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleFamilyMember(id) {
    setSelectedFamilyIds((current) => current.includes(id)
      ? current.filter((memberId) => memberId !== id)
      : [...current, id]);
  }

  function updateJoinChoice(challengeId, field, value) {
    setJoinChoices((current) => ({
      ...current,
      [challengeId]: { shareTotals: false, shareHabit: false, ...current[challengeId], [field]: value }
    }));
  }

  const sources = overview?.sources || [];
  const sampleChallenges = sources.filter((source) => source.kind === "sample");
  const weeklyLogs = overview?.weeklyLogs || [];
  const totals = {
    steps: sumLogs(weeklyLogs, "steps"),
    activityMinutes: sumLogs(weeklyLogs, "activityMinutes"),
    waterGlasses: sumLogs(weeklyLogs, "waterGlasses"),
    sleepHours: sumLogs(weeklyLogs, "sleepHours")
  };

  if (loading) return <PageSkeleton label={t.wellness.loading} rows={5} />;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.wellness.title}</h1>
          <p className="mt-1 text-sm text-slate-700">{t.wellness.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 font-medium text-hayat-900 underline" to="/explore?cat=wellness">
            {t.wellness.wellnessCentres}
          </Link>
          <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 font-medium text-hayat-900 underline" to="/explore?cat=restaurant">
            {t.wellness.healthyFood}
          </Link>
        </div>
      </header>

      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{error}</p>}
      {actionError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="alert">{actionError}</p>}
      {saved && <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-900" role="status">{t.wellness.saved}</p>}

      <section id="challenges" className="space-y-4">
        <h2 className="text-xl font-semibold">{t.wellness.challengesTitle}</h2>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-gray-900" role="note">{t.wellness.linkOnly}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((source) => {
            const sample = t.wellness.sampleChallenges[source.id];
            return (
            <article key={source.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold">{sample?.name || source.name}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{source.kind === "sample" ? t.wellness.sampleStatus : t.wellness.sourceStatuses[source.status] || source.status}</span>
              </div>
              <p><strong>{t.wellness.organiser}:</strong> {source.kind === "sample" ? t.wellness.sampleSource : source.organiser}</p>
              <p>{t.wellness.sourceSummaries[source.id] || sample?.summary || source.summary}</p>
              <p className="text-sm">
                {source.sourceUrl ? (
                  <a className="min-h-[44px] text-hayat-900 underline" href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {t.wellness.source}: {source.sourceName}
                  </a>
                ) : <><strong>{t.wellness.source}:</strong> {t.wellness.sampleSource}</>}
              </p>
              {source.officialUrl && source.verified === true && (
                <a className="inline-flex min-h-[44px] items-center text-hayat-900 underline" href={source.officialUrl} target="_blank" rel="noopener noreferrer">
                  {t.wellness.openOfficialPage}
                </a>
              )}
            </article>
            );
          })}
        </div>

        <section id="family-challenges" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-semibold">{t.wellness.familyChallenge}</h3>
            <Link className="inline-flex min-h-[44px] items-center text-hayat-900 underline" to="/family/journeys">{t.familyFirst.openFamilyFirst}</Link>
          </div>
          <p className="text-sm text-slate-700">{t.wellness.aggregateOnly}</p>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            void runAction(async () => {
              await axios.post("/api/wellness/challenges", { challengeKey, familyMemberIds: selectedFamilyIds });
              setSelectedFamilyIds([]);
            });
          }}>
            <label className="block space-y-1">
              <span className="font-medium">{t.wellness.chooseSample}</span>
              <select className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={challengeKey} onChange={(event) => setChallengeKey(event.target.value)} required>
                <option value="">{t.wellness.chooseSample}</option>
                {sampleChallenges.map((sample) => <option key={sample.id} value={sample.id}>{t.wellness.sampleChallenges[sample.id]?.name || sample.name}</option>)}
              </select>
            </label>
            {familyMembers.length > 0 ? (
              <fieldset className="space-y-1">
                <legend className="font-medium">{t.wellness.inviteFamily}</legend>
                {familyMembers.map((member) => (
                  <label className="flex min-h-[44px] items-center gap-3" key={member.id}>
                    <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={selectedFamilyIds.includes(member.id)} onChange={() => toggleFamilyMember(member.id)} />
                    <span>{member.name}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="text-sm text-slate-700">{t.wellness.noFamilyMembers} <Link className="underline" to="/family">{t.navigation.family}</Link></p>
            )}
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={saving || !challengeKey}>
              {t.wellness.startFamilyChallenge}
            </button>
          </form>

          {challenges.owned.length === 0 && challenges.incoming.length === 0 && (
            <p className="text-sm text-slate-700" role="status">{t.wellness.noChallenges}</p>
          )}
          {(challenges.owned.length > 0 || challenges.incoming.length > 0) && challenges.incoming.length === 0 && (
            <p className="text-sm text-slate-700" role="status">{t.wellness.noInvitations}</p>
          )}

          {challenges.incoming.map((challenge) => {
            const choices = joinChoices[challenge.id] || { shareTotals: false, shareHabit: false };
            const sample = t.wellness.sampleChallenges[challenge.challengeKey];
            return (
              <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" key={`incoming-${challenge.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-semibold">{sample?.name || challenge.name}</h4>
                  <span className="text-sm">{challenge.ownerName}</span>
                </div>
                <p>{challenge.startDate} - {challenge.endDate}</p>
                {challenge.memberStatus === "invited" ? (
                  <>
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={choices.shareTotals} onChange={(event) => updateJoinChoice(challenge.id, "shareTotals", event.target.checked)} />
                      <span>{t.wellness.shareTotals}</span>
                    </label>
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={choices.shareHabit} onChange={(event) => updateJoinChoice(challenge.id, "shareHabit", event.target.checked)} />
                      <span>{t.wellness.shareHabit}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white" type="button" disabled={saving} onClick={() => void runAction(() => axios.post(`/api/wellness/challenges/${challenge.id}/join`, choices))}>{t.wellness.joinChallenge}</button>
                      <button className="min-h-[44px] rounded-lg border border-slate-400 px-4 py-2" type="button" disabled={saving} onClick={() => void runAction(() => axios.post(`/api/wellness/challenges/${challenge.id}/decline`))}>{t.wellness.declineInvite}</button>
                    </div>
                  </>
                ) : challenge.familyLinkActive === false ? (
                  <>
                    <p className="text-sm text-slate-700">{t.wellness.familyAccessEnded}</p>
                    <button className="min-h-[44px] rounded-lg border border-slate-400 px-4 py-2" type="button" disabled={saving} onClick={() => void runAction(() => axios.post(`/api/wellness/challenges/${challenge.id}/leave`))}>{t.wellness.leaveChallenge}</button>
                  </>
                ) : (
                  <>
                    {challenge.sharedTotals && <p>{t.wellness.sharedTotalsSummary.replace("{steps}", String(challenge.sharedTotals.steps)).replace("{minutes}", String(challenge.sharedTotals.activityMinutes)).replace("{water}", String(challenge.sharedTotals.waterGlasses)).replace("{sleep}", String(challenge.sharedTotals.sleepHours))}</p>}
                    {challenge.sharedHabitTicks !== null && challenge.sharedHabitTicks !== undefined && <p>{t.wellness.sharedHabitSummary.replace("{count}", String(challenge.sharedHabitTicks))}</p>}
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={challenge.shareTotals} onChange={(event) => void runAction(() => axios.patch(`/api/wellness/challenges/${challenge.id}/sharing`, { shareTotals: event.target.checked, shareHabit: challenge.shareHabit }))} />
                      <span>{t.wellness.shareTotals}</span>
                    </label>
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={challenge.shareHabit} onChange={(event) => void runAction(() => axios.patch(`/api/wellness/challenges/${challenge.id}/sharing`, { shareTotals: challenge.shareTotals, shareHabit: event.target.checked }))} />
                      <span>{t.wellness.shareHabit}</span>
                    </label>
                    <button className="min-h-[44px] rounded-lg border border-slate-400 px-4 py-2" type="button" disabled={saving} onClick={() => void runAction(() => axios.post(`/api/wellness/challenges/${challenge.id}/leave`))}>{t.wellness.leaveChallenge}</button>
                  </>
                )}
              </article>
            );
          })}

          {challenges.owned.map((challenge) => {
            const sample = t.wellness.sampleChallenges[challenge.challengeKey];
            return (
            <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" key={`owned-${challenge.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold">{sample?.name || challenge.name}</h4>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{t.wellness.challengeStatuses[challenge.status]}</span>
              </div>
              <p>{challenge.startDate} - {challenge.endDate}</p>
              {challenge.invitedMembers.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {challenge.invitedMembers.map((member) => <li key={member.id}>{member.name}: {t.wellness.memberStatuses[member.status]}</li>)}
                </ul>
              )}
              {challenge.sharedTotals && <p>{t.wellness.sharedTotalsSummary.replace("{steps}", String(challenge.sharedTotals.steps)).replace("{minutes}", String(challenge.sharedTotals.activityMinutes)).replace("{water}", String(challenge.sharedTotals.waterGlasses)).replace("{sleep}", String(challenge.sharedTotals.sleepHours))}</p>}
              {challenge.sharedHabitTicks !== null && challenge.sharedHabitTicks !== undefined && <p>{t.wellness.sharedHabitSummary.replace("{count}", String(challenge.sharedHabitTicks))}</p>}
              {challenge.memberStatus === "joined" && (
                <>
                  <label className="flex min-h-[44px] items-center gap-3">
                    <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={challenge.shareTotals} onChange={(event) => void runAction(() => axios.patch(`/api/wellness/challenges/${challenge.id}/sharing`, { shareTotals: event.target.checked, shareHabit: challenge.shareHabit }))} />
                    <span>{t.wellness.shareTotals}</span>
                  </label>
                  <label className="flex min-h-[44px] items-center gap-3">
                    <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={challenge.shareHabit} onChange={(event) => void runAction(() => axios.patch(`/api/wellness/challenges/${challenge.id}/sharing`, { shareTotals: challenge.shareTotals, shareHabit: event.target.checked }))} />
                    <span>{t.wellness.shareHabit}</span>
                  </label>
                </>
              )}
            </article>
            );
          })}
        </section>
      </section>

      <section id="goals" className="space-y-4">
        <h2 className="text-xl font-semibold">{t.wellness.goalsTitle}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={(event) => {
            event.preventDefault();
            void runAction(() => axios.put("/api/wellness/goals", goalDraft));
          }}>
            <h3 className="font-semibold">{t.wellness.dailyGoals}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {goalFields.map(([field, labelKey, maximum, step]) => (
                <label className="block space-y-1" key={field}>
                  <span>{t.wellness[labelKey]}</span>
                  <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="number" min="0" max={maximum} step={step} value={goalDraft[field]} onChange={(event) => updateGoal(field, event.target.value)} required />
                </label>
              ))}
            </div>
            <label className="block space-y-1">
              <span>{t.wellness.habitLabel}</span>
              <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" maxLength={60} value={goalDraft.habitText} onChange={(event) => updateGoal("habitText", event.target.value)} />
            </label>
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white" type="submit" disabled={saving}>{t.wellness.saveGoals}</button>
          </form>

          <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={(event) => {
            event.preventDefault();
            void runAction(() => axios.put("/api/wellness/logs", {
              ...logDraft,
              steps: logDraft.steps === "" ? null : Number(logDraft.steps),
              activityMinutes: logDraft.activityMinutes === "" ? null : Number(logDraft.activityMinutes),
              waterGlasses: logDraft.waterGlasses === "" ? null : Number(logDraft.waterGlasses),
              sleepHours: logDraft.sleepHours === "" ? null : Number(logDraft.sleepHours)
            }));
          }}>
            <h3 className="font-semibold">{t.wellness.dailyCheckIn}</h3>
            <p className="text-sm text-slate-700">{t.wellness.manualOnly}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {goalFields.map(([field, labelKey, maximum, step]) => {
                const logField = field.replace("Target", "");
                return (
                  <label className="block space-y-1" key={logField}>
                    <span>{t.wellness[labelKey]}</span>
                    <input className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="number" min="0" max={maximum} step={step} value={logDraft[logField]} onChange={(event) => setLogDraft((current) => ({ ...current, [logField]: event.target.value }))} />
                  </label>
                );
              })}
            </div>
            <label className="flex min-h-[48px] items-center gap-3">
              <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={logDraft.habitDone} onChange={(event) => setLogDraft((current) => ({ ...current, habitDone: event.target.checked }))} />
              <span>{goalDraft.habitText || t.wellness.habitTick}</span>
            </label>
            <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white" type="submit" disabled={saving}>{t.wellness.saveCheckIn}</button>
          </form>
        </div>
        <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">{t.wellness.weeklySummaryTitle}</h3>
          <p>{t.wellness.streakSummary.replace("{count}", String(overview?.streak || 0))}</p>
          <p>{t.wellness.weeklySummary.replace("{days}", String(weeklyLogs.length)).replace("{steps}", String(totals.steps)).replace("{minutes}", String(totals.activityMinutes)).replace("{water}", String(totals.waterGlasses)).replace("{sleep}", String(totals.sleepHours))}</p>
        </section>
      </section>

      <section id="prevention" className="space-y-4">
        <h2 className="text-xl font-semibold">{t.wellness.preventionTitle}</h2>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="note">{t.wellness.preventionAdvice}</p>
        <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          void runAction(async () => {
            await axios.post("/api/wellness/prevention", preventionDraft);
            setPreventionDraft({ kind: "checkup", title: "", remindOn: "" });
          });
        }}>
          <label className="block space-y-1">
            <span>{t.wellness.reminderType}</span>
            <select className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" value={preventionDraft.kind} onChange={(event) => setPreventionDraft((current) => ({ ...current, kind: event.target.value }))}>
              <option value="checkup">{t.wellness.checkup}</option>
              <option value="vaccination">{t.wellness.vaccination}</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span>{t.wellness.reminderName}</span>
            <input className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" maxLength={100} value={preventionDraft.title} onChange={(event) => setPreventionDraft((current) => ({ ...current, title: event.target.value }))} required />
          </label>
          <label className="block space-y-1">
            <span>{t.wellness.reminderDate}</span>
            <input className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900" type="date" value={preventionDraft.remindOn} onChange={(event) => setPreventionDraft((current) => ({ ...current, remindOn: event.target.value }))} required />
          </label>
          <button className="min-h-[44px] self-end rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white" type="submit" disabled={saving}>{t.wellness.addReminder}</button>
        </form>
        {(overview?.preventionReminders || []).length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4" role="status">{t.wellness.noReminders}</p>
        ) : (
          <ul className="space-y-2">
            {overview.preventionReminders.map((reminder) => (
              <li className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3" key={reminder.id}>
                <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3">
                  <input className="h-5 w-5 accent-hayat-700" type="checkbox" checked={reminder.done === 1} onChange={(event) => void runAction(() => axios.patch(`/api/wellness/prevention/${reminder.id}`, { done: event.target.checked }))} />
                  <span className="min-w-0"><strong>{reminder.title}</strong><span className="ms-2 text-sm text-slate-700">{t.wellness.reminderKinds[reminder.kind]}</span></span>
                </label>
                <time className="text-sm text-slate-700" dateTime={reminder.remindOn}>{new Date(`${reminder.remindOn}T00:00:00`).toLocaleDateString(language)}</time>
                <button className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 text-slate-800" type="button" aria-label={t.wellness.removeReminder} title={t.wellness.removeReminder} disabled={saving} onClick={() => {
                  if (window.confirm(t.wellness.deleteReminderConfirm)) void runAction(() => axios.delete(`/api/wellness/prevention/${reminder.id}`));
                }}>
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
