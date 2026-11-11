import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertTriangle,
  FileUp,
  FileText,
  HeartPulse,
  MessageSquareText,
  Pill,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  Users
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { evaluateValue } from "../utils/valueChecker.js";
import PageSkeleton from "../components/PageSkeleton.jsx";

function reportDate(value, language) {
  return value ? new Date(`${value.replace(" ", "T")}Z`).toLocaleDateString(language) : "";
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [healthMetricsLoading, setHealthMetricsLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [doses, setDoses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [familyJourneys, setFamilyJourneys] = useState([]);
  const [familyJourneysLoading, setFamilyJourneysLoading] = useState(true);
  const [familyJourneysError, setFamilyJourneysError] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get("/api/reports")
      .then(({ data }) => {
        if (active) setReports(data);
      })
      .catch(() => {
        if (active) setError(t.home.loadFailed);
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });
    return () => { active = false; };
  }, [t.home.loadFailed]);

  useEffect(() => {
    let active = true;
    axios.get("/api/profile")
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setError(t.home.loadFailed);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => { active = false; };
  }, [t.home.loadFailed]);

  useEffect(() => {
    let active = true;
    axios.get("/api/records")
      .then(({ data }) => {
        if (active) setHealthMetrics(data);
      })
      .catch(() => {
        if (active) setError(t.home.loadFailed);
      })
      .finally(() => {
        if (active) setHealthMetricsLoading(false);
      });
    return () => { active = false; };
  }, [t.home.loadFailed]);

  useEffect(() => {
    let active = true;
    const today = localDateString();
    Promise.all([
      axios.get("/api/care/reminders"),
      axios.get("/api/care/doses", { params: { date: today } }),
      axios.get("/api/care/appointments"),
      axios.get("/api/insurance")
    ]).then(([reminderResponse, doseResponse, appointmentResponse, insuranceResponse]) => {
      if (!active) return;
      setReminders(reminderResponse.data);
      setDoses(doseResponse.data);
      setAppointments(appointmentResponse.data);
      setInsurancePolicy(insuranceResponse.data[0] || null);
    }).catch(() => {
      if (active) setError(t.home.loadFailed);
    }).finally(() => {
      if (active) setSummaryLoading(false);
    });
    return () => { active = false; };
  }, [t.home.loadFailed]);

  useEffect(() => {
    let active = true;
    axios.get("/api/tasks/mine")
      .then(({ data }) => {
        if (active) setTasks(data);
      })
      .catch(() => {
        if (active) setTasksError(t.home.tasksLoadFailed);
      })
      .finally(() => {
        if (active) setTasksLoading(false);
      });
    return () => { active = false; };
  }, [t.home.tasksLoadFailed]);

  useEffect(() => {
    let active = true;
    axios.get("/api/family-first")
      .then(({ data }) => {
        if (active) setFamilyJourneys(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setFamilyJourneysError(t.home.familyJourneysLoadFailed);
      })
      .finally(() => {
        if (active) setFamilyJourneysLoading(false);
      });
    return () => { active = false; };
  }, [t.home.familyJourneysLoadFailed]);

  const todayDate = new Date();
  const todayString = localDateString(todayDate);
  const dateSegment = todayDate.toLocaleDateString(language, { weekday: "long", month: "long", day: "numeric" });
  const greetingTime = todayDate.getHours() < 12 ? "morning" : todayDate.getHours() < 18 ? "afternoon" : "evening";
  const firstName = String(profile?.fullName || "").trim().split(/\s+/)[0];
  const greeting = profileLoading
    ? t.home.welcome
    : firstName
    ? t.home[`greeting${greetingTime[0].toUpperCase()}${greetingTime.slice(1)}`].replace("{name}", firstName)
    : t.home.welcome;

  const recentReports = reports.slice(0, 3);
  const flags = reports
    .filter((report) => report.status === "confirmed")
    .flatMap((report) => (report.extractedValues || [])
      .map((item) => ({
        ...item,
        reportId: report.id,
        status: evaluateValue(item.name, item.value, item.printedRange)
      }))
      .filter((item) => ["high", "low"].includes(item.status) || item.status.startsWith("DANGER:")));
  const todayReminders = reminders.filter((reminder) =>
    String(reminder.days || "0,1,2,3,4,5,6").split(",").includes(String(todayDate.getDay()))
  );
  const nextAppointment = appointments
    .filter((appointment) => new Date(appointment.dateTime) >= todayDate)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
  const openTaskCount = tasks.filter((task) => task.status === "open").length;
  const nextTaskDue = tasks
    .filter((task) => task.status !== "done" && task.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const nextTaskIsOverdue = nextTaskDue?.dueDate.slice(0, 10) < todayString;
  const insuranceStatus = !insurancePolicy?.endDate
    ? "datesNotListed"
    : new Date(`${insurancePolicy.endDate}T00:00:00`) < new Date(`${todayString}T00:00:00`)
      ? "expired"
      : "active";
  const doseStates = useMemo(() => new Map(doses.map((dose) => [
    `${dose.medicineName.trim().toLowerCase()}|${dose.doseTime}`,
    dose.taken
  ])), [doses]);

  async function toggleDose(reminder, taken) {
    const key = `${reminder.medicineName.trim().toLowerCase()}|${reminder.time}`;
    setDoses((current) => [
      ...current.filter((dose) => `${dose.medicineName.trim().toLowerCase()}|${dose.doseTime}` !== key),
      { medicineName: reminder.medicineName, doseTime: reminder.time, date: todayString, taken }
    ]);
    try {
      await axios.put("/api/care/doses", {
        medicineName: reminder.medicineName,
        doseTime: reminder.time,
        date: todayString,
        taken
      });
    } catch {
      setError(t.home.loadFailed);
      setDoses((current) => [
        ...current.filter((dose) => `${dose.medicineName.trim().toLowerCase()}|${dose.doseTime}` !== key),
        { medicineName: reminder.medicineName, doseTime: reminder.time, date: todayString, taken: !taken }
      ]);
    }
  }

  async function openReportInChat(report) {
    try {
      const { data: conversation } = await axios.post("/api/conversations");
      await axios.post(`/api/conversations/${conversation.id}/messages`, {
        role: "assistant",
        content: "",
        language,
        messageType: report.status === "confirmed" ? "explanation" : "review",
        payload: { reportId: Number(report.id), language }
      });
      navigate(`/chat/${conversation.id}`);
    } catch {
      setError(t.home.loadFailed);
    }
  }

  function submitQuestion(event) {
    event.preventDefault();
    const message = question.trim();
    if (!message) return;
    navigate(`/chat?message=${encodeURIComponent(message)}`);
  }

  const quickActions = [
    { key: "upload", Icon: FileUp, to: "/chat?upload=1", primary: true },
    { key: "records", Icon: Activity, to: "/records" },
    { key: "doctor", Icon: Stethoscope, to: "/explore?cat=hospital" },
    { key: "pharmacy", Icon: Search, to: "/explore?cat=pharmacy" },
    { key: "medicines", Icon: Pill, to: "/my-day" },
    { key: "questions", Icon: MessageSquareText, to: `/chat?message=${encodeURIComponent(t.chat.starters.doctorQuestions)}` },
    { key: "family", Icon: Users, to: "/family" },
    { key: "wellness", Icon: Activity, to: "/explore/wellness" },
    { key: "sos", Icon: HeartPulse, to: "/sos", danger: true }
  ];

  const cardClass = "card-surface min-w-0";
  const cardTitleClass = "mb-3 text-base font-semibold text-slate-900 sm:text-lg";
  const emptyClass = "text-sm leading-6 text-slate-700";

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="home-hero">
        <p className="home-hero-date">{dateSegment}</p>
        <h1>{greeting}</h1>
        <p className="home-hero-prompt">{t.home.askHayat}</p>
        <form className="home-hero-form" onSubmit={submitQuestion}>
          <label className="sr-only" htmlFor="ask-hayat">{t.home.askPlaceholder}</label>
          <input
            id="ask-hayat"
            className="min-h-[48px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-gray-900"
            type="text"
            maxLength={500}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t.home.askPlaceholder}
          />
          <button className="btn-primary min-h-[48px] gap-2" type="submit" disabled={!question.trim()}>
            <Send size={18} aria-hidden="true" />
            {t.home.askSend}
          </button>
        </form>
      </header>

      <section className="home-quick-actions" aria-label={t.home.quickActions}>
        <h2>{t.home.quickActions}</h2>
        <div className="home-quick-actions-grid">
          {quickActions.map(({ key, Icon, to, primary, danger }) => (
            <Link
              key={key}
              to={to}
              className={`home-action-card${primary ? " is-primary" : ""}${danger ? " is-danger" : ""}`}
            >
              <span className="home-action-icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span>{t.home.actions[key]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitleClass}>{t.home.healthSnapshot}</h2>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/records">
            {t.home.viewHealthRecords}
          </Link>
        </div>
        {healthMetricsLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : healthMetrics.length === 0 ? (
          <p className={emptyClass}>{t.home.noHealthMetrics}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {healthMetrics.slice(0, 4).map((reading) => (
              <li className="min-w-0 rounded-lg border border-slate-200 p-3" key={reading.metricKey}>
                <Link className="font-medium text-hayat-900 underline" to={`/records/${encodeURIComponent(reading.metricKey)}`}>
                  {t.records.metrics[reading.metricKey] || reading.label}
                </Link>
                <p className="mt-1 text-lg font-semibold">{reading.value2 == null ? reading.value : `${reading.value}/${reading.value2}`} {reading.unit}</p>
                <p className="text-sm text-slate-600">{reportDate(reading.recordedAt, language)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitleClass}>{t.home.tasksCardTitle}</h2>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/family/tasks">{t.home.viewTasks}</Link>
        </div>
        {tasksLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : tasksError ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{tasksError}</p>
        ) : (
          <>
            <p className={emptyClass}>{t.home.openTasksCount.replace("{count}", String(openTaskCount))}</p>
            {nextTaskDue ? (
              <p className={`inline-flex items-center gap-2 text-sm ${nextTaskIsOverdue ? "font-semibold text-amber-900" : "text-slate-700"}`}>
                {nextTaskIsOverdue && <AlertTriangle size={17} aria-hidden="true" />}
                {nextTaskIsOverdue ? `${t.care.overdue} · ` : ""}
                {t.home.nextTaskDue.replace("{date}", new Date(`${nextTaskDue.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString(language))}
              </p>
            ) : <p className={emptyClass}>{t.home.noTaskDueDate}</p>}
          </>
        )}
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitleClass}>{t.home.familyJourneysTitle}</h2>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/family/journeys">
            {t.home.openFamilyJourneys}
          </Link>
        </div>
        {familyJourneysLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : familyJourneysError ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{familyJourneysError}</p>
        ) : familyJourneys.length === 0 ? (
          <p className={emptyClass}>{t.home.noFamilyJourneys}</p>
        ) : (
          <ul className="space-y-2">
            {familyJourneys.slice(0, 3).map((journey) => {
              const eventTitle = t.familyFirst.events[journey.eventKey]?.title || t.familyFirst.title;
              const progress = journey.progress || { completed: 0, total: 0 };
              return (
                <li className="rounded-lg border border-slate-200 p-3" key={journey.id}>
                  <Link
                    className="font-medium text-hayat-900 underline"
                    to={`/family/journeys?journeyId=${encodeURIComponent(journey.id)}`}
                  >
                    {eventTitle}
                  </Link>
                  {progress.total > 0 && (
                    <p className="mt-1 text-sm text-slate-700">
                      {t.home.journeyProgress
                        .replace("{completed}", String(progress.completed))
                        .replace("{total}", String(progress.total))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitleClass}>{t.wellness.preventionTitle}</h2>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/explore/wellness">
            {t.wellness.openWellness}
          </Link>
        </div>
        <p className={emptyClass}>{t.wellness.preventionAdvice}</p>
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={cardTitleClass}>{t.home.myDayTitle}</h2>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/my-day">
            {t.home.openMyDay}
          </Link>
        </div>
        {summaryLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : (
          <div className="space-y-2">
            {todayReminders.length ? (
              <ul className="space-y-1">
                {todayReminders.slice(0, 3).map((reminder) => (
                  <li className="flex flex-wrap justify-between gap-2 text-sm" key={reminder.id}>
                    <span className="font-medium">{reminder.medicineName}</span>
                    <span className="text-slate-700">{reminder.time}</span>
                  </li>
                ))}
              </ul>
            ) : <p className={emptyClass}>{t.home.noMedicinesToday}</p>}
            <p className={emptyClass}>
              {nextAppointment
                ? `${t.home.nextAppointment}: ${nextAppointment.title} · ${new Date(nextAppointment.dateTime).toLocaleString(language)}`
                : t.home.noAppointment}
            </p>
          </div>
        )}
      </section>

      <button
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-medium text-hayat-900 hover:bg-hayat-50"
        type="button"
        aria-expanded={showMore}
        aria-controls="home-more-content"
        onClick={() => setShowMore((expanded) => !expanded)}
      >
        {showMore ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        {showMore ? t.home.showLess : t.navigation.more}
      </button>

      {error && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="alert">{error}</p>}

      <div id="home-more-content" className="space-y-6" hidden={!showMore}>
      <div className="grid min-w-0 gap-4 md:grid-cols-12 md:gap-6">
        <section className={`${cardClass} md:col-span-8 md:row-start-1`}>
          <h2 className={cardTitleClass}>{t.home.todaysMedicines}</h2>
          {summaryLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : todayReminders.length === 0 ? (
            <div className="space-y-3">
              <p className={emptyClass}>{t.home.noMedicinesToday}</p>
              <Link className="btn-outline min-h-[44px]" to="/my-day?tab=reminders">{t.home.addMedicineReminder}</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayReminders.map((reminder) => (
                <li className="rounded-xl border border-slate-200 p-3" key={reminder.id}>
                  <label className="flex min-h-[44px] items-center gap-3">
                    <input
                      className="h-6 w-6 accent-hayat-700"
                      type="checkbox"
                      checked={doseStates.get(`${reminder.medicineName.trim().toLowerCase()}|${reminder.time}`) === true}
                      onChange={(event) => void toggleDose(reminder, event.target.checked)}
                    />
                    <span className="min-w-0 flex-1 font-medium">{reminder.medicineName}</span>
                    <span className="shrink-0 text-sm text-slate-700">{reminder.time}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Link className="mt-3 inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/my-day">
            {t.home.viewMedicines}
          </Link>
        </section>

        <section className={`${cardClass} md:col-span-4 md:row-start-1`}>
          <h2 className={cardTitleClass}>{t.home.nextAppointment}</h2>
          {summaryLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : nextAppointment ? (
            <div className="space-y-1">
              <p className="font-semibold">{nextAppointment.title}</p>
              <p className={emptyClass}>{new Date(nextAppointment.dateTime).toLocaleString(language)}</p>
              {nextAppointment.place && <p className={emptyClass}>{nextAppointment.place}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <p className={emptyClass}>{t.home.noAppointment}</p>
              <Link className="btn-outline min-h-[44px]" to="/my-day?tab=calendar">{t.home.addAppointment}</Link>
            </div>
          )}
          {nextAppointment && (
            <Link className="mt-3 inline-flex min-h-[44px] items-center gap-2 font-medium text-hayat-900 underline" to="/my-day?tab=calendar">
              <CalendarDays size={18} aria-hidden="true" />
              {t.home.openCalendar}
            </Link>
          )}
        </section>

        <section className={`${cardClass} md:col-span-8 md:row-start-2`}>
          <h2 className={cardTitleClass}>{t.home.recentDocuments}</h2>
          {reportsLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : recentReports.length === 0 ? (
            <div className="space-y-3">
              <p className={emptyClass}>{t.home.noDocuments}</p>
              <Link className="btn-outline min-h-[44px]" to="/chat?upload=1">{t.home.uploadAction}</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentReports.map((report) => (
                <li key={report.id}>
                  <button
                    className="flex min-h-[52px] w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-start transition-colors hover:border-hayat-700 hover:bg-hayat-50"
                    type="button"
                    onClick={() => void openReportInChat(report)}
                  >
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <FileText size={18} className="shrink-0 text-hayat-900" aria-hidden="true" />
                      {t.reports.typeLabels[report.type] || report.type}
                    </span>
                    <span className="text-sm text-slate-700">{reportDate(report.createdAt, language)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cardClass} md:col-span-8 md:row-start-3`}>
          <h2 className={cardTitleClass}>{t.home.needsAttention}</h2>
          {reportsLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : flags.length === 0 ? (
            <div className="space-y-3">
              <p className={emptyClass}>{t.home.noAttention}</p>
              <Link className="btn-outline min-h-[44px]" to="/chat">{t.home.askHayatAction}</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {flags.map((flag, index) => {
                const isDanger = flag.status.startsWith("DANGER:");
                return (
                  <li
                    className={`rounded-xl border p-3 ${isDanger ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-slate-900"}`}
                    key={`${flag.reportId}-${index}`}
                  >
                    <p className="font-semibold">{flag.name}: {String(flag.value)} {flag.unit}</p>
                    <p className="mt-1 text-sm">
                      {isDanger
                        ? t.reports.statuses.danger
                        : `${t.reports.statuses[flag.status === "high" ? "high" : "low"]} — ${t.home.outsidePrintedRange}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={`${cardClass} md:col-span-4 md:row-start-2`}>
          <h2 className={cardTitleClass}>{t.home.insurance}</h2>
          {summaryLoading ? <PageSkeleton label={t.home.loading} rows={1} /> : insurancePolicy ? (
            <>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-hayat-900" size={22} aria-hidden="true" />
                <div>
                  <p className="font-semibold">{insurancePolicy.insurerName || t.passport.insurerNotListed}</p>
                  <p className="mt-1 text-sm text-slate-700">{t.passport.policyStatuses[insuranceStatus]}</p>
                </div>
              </div>
              <Link className="mt-3 inline-flex min-h-[44px] items-center font-medium text-hayat-900 underline" to="/me/insurance">
                {t.passport.viewInsurance}
              </Link>
            </>
          ) : (
            <div className="space-y-3">
              <p className={emptyClass}>{t.home.noInsurance}</p>
              <Link className="btn-outline min-h-[44px]" to="/me/insurance">{t.home.addInsurance}</Link>
            </div>
          )}
        </section>
      </div>
      </div>
    </section>
  );
}
