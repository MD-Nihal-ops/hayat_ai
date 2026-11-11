import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { calculateInsuranceDemo } from "../utils/insuranceDemo.js";
import InsuranceManager from "../components/InsuranceManager.jsx";
import CareTasks from "../components/CareTasks.jsx";
import { getMostRecentPolicy } from "../utils/insurancePolicies.js";
import PageSkeleton from "../components/PageSkeleton.jsx";

const tabKeys = ["today", "reminders", "calendar", "tasks", "insurance"];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromDateTime(value) {
  return String(value || "").slice(0, 10);
}

function timeFromDateTime(value) {
  return String(value || "").slice(11, 16);
}

function keyForDose(name, time) {
  return `${name.trim().toLowerCase()}|${time}`;
}

function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function amountFromReportValue(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return normalized ? Number(normalized[0]) : null;
}

function getWeekdayLabels(language) {
  const base = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(language, { weekday: "short" })
      .format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + index))
  );
}

export default function Care({ initialTab = "today", allowedTabs = tabKeys, showTabs = true }) {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const visibleTabs = tabKeys.filter((tab) => allowedTabs.includes(tab));
  const allowedTabKey = visibleTabs.join("|");
  const [activeTab, setActiveTab] = useState(() =>
    visibleTabs.includes(searchParams.get("tab"))
      ? searchParams.get("tab")
      : visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0] || "today"
  );
  const [reminders, setReminders] = useState([]);
  const [doses, setDoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dueReminders, setDueReminders] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [manualMedicine, setManualMedicine] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentPlace, setAppointmentPlace] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [sourceReportId, setSourceReportId] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");
  const notifiedReminders = useRef(new Set());

  async function loadCareData() {
    setError("");
    try {
      const today = localDateString();
      const [reminderResponse, doseResponse, medicineResponse, appointmentResponse, reportResponse, insuranceResponse] =
        await Promise.all([
          axios.get("/api/care/reminders"),
          axios.get("/api/care/doses", { params: { date: today } }),
          axios.get("/api/care/medicines"),
          axios.get("/api/care/appointments"),
          axios.get("/api/reports"),
          axios.get("/api/insurance")
        ]);
      setReminders(reminderResponse.data);
      setDoses(doseResponse.data);
      setPrescriptions(medicineResponse.data);
      setAppointments(appointmentResponse.data);
      setReports(reportResponse.data);
      setInsurancePolicies(insuranceResponse.data);
    } catch {
      setError(t.care.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCareData();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    setActiveTab(visibleTabs.includes(requestedTab)
      ? requestedTab
      : visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0] || "today");
  }, [allowedTabKey, initialTab, searchParams]);

  useEffect(() => {
    const date = searchParams.get("date");
    const tab = searchParams.get("tab");
    if (tab === "calendar") {
      setActiveTab("calendar");
      setAppointmentDate(isISODate(date) ? date : "");
      if (isISODate(date)) setMonth(new Date(`${date}T00:00:00`));
      const reportId = searchParams.get("reportId") || "";
      setSourceReportId(Number(reportId) > 0 ? reportId : "");
      setAppointmentTitle(searchParams.get("title") || "");
      setShowAppointmentForm(true);
    }
    if (tab === "tasks" && visibleTabs.includes("tasks")) setActiveTab("tasks");
  }, [allowedTabKey, searchParams]);

  const medicineByName = useMemo(() => {
    const result = new Map();
    for (const medicine of prescriptions) {
      const key = medicine.medicineName.trim().toLowerCase();
      if (!result.has(key) || (!result.get(key).printedDose && medicine.printedDose)) {
        result.set(key, medicine);
      }
    }
    return result;
  }, [prescriptions]);

  const today = localDateString();
  const todayWeekday = new Date(`${today}T00:00:00`).getDay();
  const todayReminders = reminders.filter((reminder) =>
    String(reminder.days || "0,1,2,3,4,5,6").split(",").includes(String(todayWeekday))
  );
  const doseStates = new Map(doses.map((dose) => [
    keyForDose(dose.medicineName, dose.doseTime),
    dose.taken
  ]));
  const medicineOptions = [...new Set(prescriptions.map((item) => item.medicineName.trim()).filter(Boolean))];
  const weekdayLabels = getWeekdayLabels(language);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthStartOffset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthAppointments = appointments.filter((appointment) => {
    const date = new Date(`${dateFromDateTime(appointment.dateTime)}T00:00:00`);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  });
  const billReports = reports.filter((report) => report.type === "bill" && report.status === "confirmed");
  const selectedBill = billReports.find((report) => String(report.id) === selectedBillId) || billReports[0];
  const insurancePolicy = getMostRecentPolicy(insurancePolicies);
  const billRows = (selectedBill?.extractedValues || []).map((item) => ({
    ...item,
    amount: amountFromReportValue(item.value)
  }));
  const billTotalRow = billRows.find((item) => /grand total|bill total|total amount|amount due/i.test(item.name || "") && item.amount !== null);
  const billItems = billRows.map((item) => ({
    name: item.name,
    printedValue: [item.value, item.unit].filter(Boolean).join(" "),
    amount: item.amount
  })).filter((item) => item.name && item.amount !== null && item.amount >= 0 && !/grand total|bill total|total amount|amount due/i.test(item.name));
  const billTotal = billTotalRow?.amount ?? billItems.reduce((sum, item) => sum + item.amount, 0);
  const insuranceResult = insurancePolicy?.coveragePercent != null
    ? calculateInsuranceDemo(billTotal, billItems, {
      coveragePercent: insurancePolicy.coveragePercent,
      deductible: insurancePolicy.deductible
    })
    : null;

  useEffect(() => {
    function checkDueReminders() {
      const now = new Date();
      const date = localDateString(now);
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const weekday = String(now.getDay());
      const due = reminders.filter((reminder) => {
        const scheduledDays = String(reminder.days || "0,1,2,3,4,5,6").split(",");
        const alreadyTaken = doseStates.get(keyForDose(reminder.medicineName, reminder.time)) === true;
        return reminder.time === currentTime && scheduledDays.includes(weekday) && !alreadyTaken;
      });
      setDueReminders(due);
      if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
        for (const reminder of due) {
          const reminderKey = `${date}|${reminder.id}`;
          if (!notifiedReminders.current.has(reminderKey)) {
            new Notification(t.care.timeToTake.replace("{medicine}", reminder.medicineName));
            notifiedReminders.current.add(reminderKey);
          }
        }
      }
    }
    checkDueReminders();
    const intervalId = window.setInterval(checkDueReminders, 30000);
    return () => window.clearInterval(intervalId);
  }, [reminders, doses, notificationsEnabled, t.care.timeToTake]);

  async function updateDose(medicineName, time, taken) {
    const key = keyForDose(medicineName, time);
    const previous = doseStates.get(key) === true;
    setDoses((current) => {
      const updated = current.filter((dose) => keyForDose(dose.medicineName, dose.doseTime) !== key);
      return [...updated, { medicineName, doseTime: time, date: today, taken }];
    });
    try {
      await axios.put("/api/care/doses", {
        medicineName,
        doseTime: time,
        date: today,
        taken
      });
      setError("");
    } catch {
      setDoses((current) => [
        ...current.filter((dose) => keyForDose(dose.medicineName, dose.doseTime) !== key),
        { medicineName, doseTime: time, date: today, taken: previous }
      ]);
      setError(t.care.saveFailed);
    }
  }

  async function addReminder(event) {
    event.preventDefault();
    const medicineName = selectedMedicine === "__manual__" ? manualMedicine.trim() : selectedMedicine;
    setBusy(true);
    try {
      const { data } = await axios.post("/api/care/reminders", {
        medicineName,
        time: reminderTime,
        days: selectedDays
      });
      setReminders((current) => [...current, data].sort((a, b) => a.time.localeCompare(b.time)));
      setSelectedMedicine("");
      setManualMedicine("");
      setReminderTime("");
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || t.care.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReminder(id) {
    try {
      await axios.delete(`/api/care/reminders/${id}`);
      setReminders((current) => current.filter((reminder) => reminder.id !== id));
      setError("");
    } catch {
      setError(t.care.saveFailed);
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotificationMessage(t.care.notificationsUnavailable);
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    setNotificationMessage(permission === "granted"
      ? t.care.notificationsEnabled
      : t.care.notificationsDenied);
  }

  async function addAppointment(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post("/api/care/appointments", {
        title: appointmentTitle,
        date: appointmentDate,
        time: appointmentTime,
        place: appointmentPlace,
        notes: appointmentNotes,
        sourceReportId: sourceReportId ? Number(sourceReportId) : null
      });
      setAppointments((current) => [...current, data].sort((a, b) => a.dateTime.localeCompare(b.dateTime)));
      setAppointmentTitle("");
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentPlace("");
      setAppointmentNotes("");
      setSourceReportId("");
      setShowAppointmentForm(false);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || t.care.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAppointment(id) {
    try {
      await axios.delete(`/api/care/appointments/${id}`);
      setAppointments((current) => current.filter((appointment) => appointment.id !== id));
      setError("");
    } catch {
      setError(t.care.saveFailed);
    }
  }

  function toggleDay(day) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort()
    );
  }

  const inputClass = "min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-gray-900";
  const buttonClass = "min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-hayat-50";

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
        <PageSkeleton label={t.care.loading} rows={4} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          {initialTab === "tasks" ? t.sectionTabs.tasks : initialTab === "insurance" ? t.sectionTabs.insurance : t.home.myDayTitle}
        </h1>
      </header>
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      {showTabs && visibleTabs.length > 1 && <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist" aria-label={t.navigation.care}>
        {visibleTabs.map((key) => (
          <button
            className={`min-h-[44px] rounded-lg px-4 py-2 font-medium ${activeTab === key ? "bg-hayat-700 text-white" : buttonClass}`}
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
          >
            {t.care.tabs[key]}
          </button>
        ))}
      </div>}
      {dueReminders.length > 0 && (
        <div className="mb-5 space-y-2" aria-live="polite">
          {dueReminders.map((reminder) => (
            <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400 bg-amber-50 p-4 text-gray-900" key={reminder.id} role="status">
              <span className="font-medium">{t.care.timeToTake.replace("{medicine}", reminder.medicineName)}</span>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white" type="button" onClick={() => updateDose(reminder.medicineName, reminder.time, true)}>
                {t.care.taken}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "today" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
          <h2 className="text-lg font-semibold">{t.care.todayTitle}</h2>
          <p className="rounded-lg bg-amber-50 p-3 text-gray-900">{t.care.doseDisclaimer}</p>
          {todayReminders.length === 0 ? (
            <p className="text-sm text-gray-600">{t.home.illustrativeDemoData}</p>
          ) : (
            <ul className="space-y-3">
              {todayReminders.map((reminder) => {
                const taken = doseStates.get(keyForDose(reminder.medicineName, reminder.time)) === true;
                const prescription = medicineByName.get(reminder.medicineName.trim().toLowerCase());
                return (
                  <li className="rounded-xl border border-slate-200 p-3" key={reminder.id}>
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input
                        className="h-6 w-6 accent-hayat-700"
                        type="checkbox"
                        checked={taken}
                        onChange={(event) => updateDose(reminder.medicineName, reminder.time, event.target.checked)}
                      />
                      <span className="font-medium">{reminder.medicineName}</span>
                      <span className="ms-auto">{reminder.time}</span>
                    </label>
                    {prescription?.printedDose && (
                      <p className="mt-1 text-sm text-gray-700">
                        {t.care.printedDose.replace("{dose}", prescription.printedDose)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-sm text-gray-700">{t.care.reminderNote}</p>
        </section>
      )}

      {activeTab === "reminders" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t.care.remindersTitle}</h2>
              <button className={buttonClass} type="button" onClick={enableNotifications}>
                {t.care.enableNotifications}
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-700">{notificationMessage || t.care.reminderNote}</p>
            <form className="space-y-4" onSubmit={addReminder}>
              <label className="block space-y-1">
                <span>{t.care.medicineLabel}</span>
                <select
                  className={inputClass}
                  required
                  value={selectedMedicine}
                  onChange={(event) => setSelectedMedicine(event.target.value)}
                >
                  <option value="">{t.care.chooseMedicine}</option>
                  {medicineOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  <option value="__manual__">{t.care.typeMedicine}</option>
                </select>
              </label>
              {selectedMedicine === "__manual__" && (
                <label className="block space-y-1">
                  <span>{t.care.medicineName}</span>
                  <input className={inputClass} required value={manualMedicine} onChange={(event) => setManualMedicine(event.target.value)} />
                </label>
              )}
              <label className="block space-y-1">
                <span>{t.care.timeLabel}</span>
                <input className={inputClass} type="time" required value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} />
              </label>
              <fieldset>
                <legend className="mb-2">{t.care.weekdaysLabel}</legend>
                <div className="flex flex-wrap gap-2">
                  {weekdayLabels.map((label, day) => (
                    <label className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-3" key={day}>
                      <input type="checkbox" checked={selectedDays.includes(day)} onChange={() => toggleDay(day)} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={busy || selectedDays.length === 0}>
                {t.care.addReminder}
              </button>
            </form>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
            <h2 className="mb-4 text-lg font-semibold">{t.care.savedReminders}</h2>
            {reminders.length === 0 ? <p>{t.care.noReminders}</p> : (
              <ul className="space-y-2">
                {reminders.map((reminder) => (
                  <li className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3" key={reminder.id}>
                    <span>{reminder.medicineName} · {reminder.time} · {String(reminder.days).split(",").map((day) => weekdayLabels[Number(day)]).join(", ")}</span>
                    <button className={buttonClass} type="button" onClick={() => deleteReminder(reminder.id)}>{t.care.delete}</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button className={buttonClass} type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{t.care.previousMonth}</button>
              <h2 className="text-lg font-semibold">{new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(month)}</h2>
              <button className={buttonClass} type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{t.care.nextMonth}</button>
              <button className={buttonClass} type="button" onClick={() => { setAppointmentDate(""); setAppointmentTime(""); setSourceReportId(""); setShowAppointmentForm(true); }}>{t.care.addAppointment}</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdayLabels.map((label, index) => <div className="p-2 text-xs font-medium text-gray-600" key={`weekday-${index}`}>{label}</div>)}
              {Array.from({ length: monthStartOffset }, (_, index) => <div className="min-h-12" key={`blank-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasAppointment = monthAppointments.some((appointment) => dateFromDateTime(appointment.dateTime) === date);
                return (
                  <button
                    className={`min-h-[44px] rounded-lg border text-gray-900 ${hasAppointment ? "border-hayat-700 bg-hayat-50 font-semibold" : "border-transparent hover:bg-slate-100"}`}
                    key={date}
                    type="button"
                    aria-label={`${date}${hasAppointment ? `, ${t.care.appointment}` : ""}`}
                    onClick={() => { setAppointmentDate(date); setShowAppointmentForm(true); }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>
          {showAppointmentForm && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
              <h2 className="mb-4 text-lg font-semibold">{t.care.addAppointment}</h2>
              {sourceReportId && <p className="mb-3 text-sm text-gray-700">{t.care.confirmDateNote}</p>}
              <form className="space-y-4" onSubmit={addAppointment}>
                <label className="block space-y-1"><span>{t.care.titleLabel}</span><input className={inputClass} required value={appointmentTitle} onChange={(event) => setAppointmentTitle(event.target.value)} /></label>
                <label className="block space-y-1"><span>{t.care.dateLabel}</span><input className={inputClass} type="date" required value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} /></label>
                <label className="block space-y-1"><span>{t.care.timeLabel}</span><input className={inputClass} type="time" required value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} /></label>
                <label className="block space-y-1"><span>{t.care.placeLabel}</span><input className={inputClass} value={appointmentPlace} onChange={(event) => setAppointmentPlace(event.target.value)} /></label>
                <label className="block space-y-1"><span>{t.care.notesLabel}</span><textarea className={`${inputClass} min-h-24`} value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} /></label>
                <div className="flex flex-wrap gap-2">
                  <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 py-2 font-medium text-white disabled:opacity-60" disabled={busy} type="submit">{t.care.saveAppointment}</button>
                  <button className={buttonClass} type="button" onClick={() => setShowAppointmentForm(false)}>{t.care.cancel}</button>
                </div>
              </form>
            </section>
          )}
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
            <h2 className="mb-4 text-lg font-semibold">{t.care.appointmentsTitle}</h2>
            {monthAppointments.length === 0 ? <p>{t.care.noAppointments}</p> : (
              <ul className="space-y-3">
                {monthAppointments.map((appointment) => (
                  <li className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 p-3" key={appointment.id}>
                    <div>
                      <p className="font-medium">{appointment.title}</p>
                      <p>{appointment.dateTime.replace("T", " ")}</p>
                      {appointment.place && <p>{appointment.place}</p>}
                      {appointment.notes && <p>{appointment.notes}</p>}
                    </div>
                    <button className={buttonClass} type="button" onClick={() => deleteAppointment(appointment.id)}>{t.care.delete}</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {activeTab === "tasks" && (
        <CareTasks autoAdd={searchParams.get("add") === "1"} />
      )}

      {activeTab === "insurance" && (
        <div className="space-y-5 text-gray-900">
          <InsuranceManager policies={insurancePolicies} onPoliciesChange={setInsurancePolicies} />
          {insurancePolicy?.coveragePercent != null && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold">{t.care.calculatorTitle}</h2>
            <p className="mb-4 rounded-lg bg-amber-50 p-3">{t.care.estimateDisclaimer}</p>
            {billReports.length === 0 ? <p>{t.care.noBillReport}</p> : (
              <>
                <label className="mb-4 block space-y-1">
                  <span>{t.care.chooseBill}</span>
                  <select className={inputClass} value={selectedBill?.id || ""} onChange={(event) => setSelectedBillId(event.target.value)}>
                    {billReports.map((report) => <option key={report.id} value={report.id}>{t.care.billReport} #{report.id}</option>)}
                  </select>
                </label>
                <p className="mb-3 font-medium">{t.care.billTotal}: {billTotal.toFixed(2)}</p>
                <ul className="mb-4 space-y-1">
                  {billItems.map((item, index) => <li key={`${item.name}-${index}`}>{item.name}: {item.printedValue}</li>)}
                </ul>
                <h3 className="mb-2 font-semibold">{t.care.working}</h3>
                <ol className="list-inside list-decimal space-y-1">
                  <li>{t.care.deductibleStep}: {insuranceResult?.deductibleApplied.toFixed(2)}</li>
                  <li>{t.care.remainingStep}: {insuranceResult.amountAfterDeductible.toFixed(2)}</li>
                  <li>{t.care.coveredStep.replace("{percent}", String(insurancePolicy.coveragePercent))}: {insuranceResult.covered.toFixed(2)}</li>
                  <li>{t.care.patientPaysStep}: {insuranceResult.patientPays.toFixed(2)}</li>
                </ol>
              </>
            )}
          </section>
          )}
        </div>
      )}
    </section>
  );
}
