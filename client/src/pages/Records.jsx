import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Plus, Trash2 } from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import Modal from "../components/Modal.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { evaluateValue } from "../utils/valueChecker.js";

const metricGroups = {
  blood: ["hemoglobin", "creatinine", "wbc", "rbc", "platelets"],
  heart: ["blood_pressure", "heart_rate"],
  sugar: ["glucose", "hba1c"],
  cholesterol: ["cholesterol_total", "ldl", "hdl", "triglycerides"],
  body: ["weight"]
};

const defaultUnits = {
  heart_rate: "bpm",
  blood_pressure: "mmHg",
  glucose: "mg/dL",
  weight: "kg"
};

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value, language) {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(language);
}

function displayValue(reading) {
  const value = reading.value2 == null ? reading.value : `${reading.value}/${reading.value2}`;
  return `${value}${reading.unit ? ` ${reading.unit}` : ""}`;
}

function valueStatus(reading, t) {
  if (reading.source === "self") return t.records.selfNotChecked;
  const status = evaluateValue(reading.label, reading.value, {
    min: reading.rangeMin,
    max: reading.rangeMax
  });
  if (status === "no range printed, not judged") return t.records.noRangePrinted;
  if (status.startsWith("DANGER:")) return t.reports.statuses.danger;
  if (status === "within range") return t.reports.statuses.withinRange;
  return t.reports.statuses[status] || t.records.noRangePrinted;
}

function Sparkline({ readings }) {
  return (
    <div className="h-12 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={readings || []}>
          <Line dataKey="value" type="monotone" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AddReadingModal({ open, onClose, onSaved }) {
  const { t, language } = useLanguage();
  const [metric, setMetric] = useState("heart_rate");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [unit, setUnit] = useState(defaultUnits.heart_rate);
  const [date, setDate] = useState(localDateString());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function changeMetric(nextMetric) {
    setMetric(nextMetric);
    setUnit(defaultUnits[nextMetric]);
    setValue("");
    setValue2("");
  }

  async function submitReading(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/records/self", {
        metric,
        value,
        ...(metric === "blood_pressure" && value2 !== "" ? { value2 } : {}),
        unit,
        date
      });
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError.response?.data?.error || t.records.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={t.records.addReading}
      closeLabel={t.chat.closeHistory}
      onClose={onClose}
      direction={language === "ar" ? "rtl" : "ltr"}
      footer={(
        <div className="flex flex-wrap justify-end gap-2">
          <button className="min-h-[44px] rounded-lg border border-slate-400 px-4" type="button" onClick={onClose} disabled={saving}>
            {t.records.cancel}
          </button>
          <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white disabled:opacity-60" type="submit" form="health-reading-form" disabled={saving}>
            {saving ? t.records.saving : t.records.save}
          </button>
        </div>
      )}
    >
      <form id="health-reading-form" className="space-y-4" onSubmit={(event) => void submitReading(event)}>
        <label className="block space-y-1 text-sm font-medium">
          <span>{t.records.metric}</span>
          <select className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3" value={metric} onChange={(event) => changeMetric(event.target.value)}>
            {["heart_rate", "blood_pressure", "glucose", "weight"].map((key) => (
              <option value={key} key={key}>{t.records.metrics[key]}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>{metric === "blood_pressure" ? t.records.systolic : t.records.value}</span>
          <input className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3" type="number" step="any" required value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        {metric === "blood_pressure" && (
          <label className="block space-y-1 text-sm font-medium">
            <span>{t.records.diastolic}</span>
            <input className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3" type="number" step="any" value={value2} onChange={(event) => setValue2(event.target.value)} />
          </label>
        )}
        <label className="block space-y-1 text-sm font-medium">
          <span>{t.records.unit}</span>
          <input className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3" maxLength={24} required value={unit} onChange={(event) => setUnit(event.target.value)} />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          <span>{t.records.date}</span>
          <input className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

function MetricDetail({ metricKey, readings, loading, onDelete }) {
  const { t, language } = useLanguage();
  const chartData = useMemo(() => readings.map((reading) => ({
    ...reading,
    timestamp: new Date(`${reading.recordedAt}T00:00:00`).getTime()
  })), [readings]);
  const hasSecondValue = chartData.some((reading) => reading.value2 != null);
  const newest = readings.at(-1);
  const previous = readings.at(-2);
  const chartSummary = newest
    ? t.records.chartSummary
      .replace("{count}", String(readings.length))
      .replace("{metric}", t.records.metrics[metricKey] || metricKey)
      .replace("{value}", displayValue(newest))
      .replace("{date}", formatDate(newest.recordedAt, language))
    : "";

  if (loading) return <PageSkeleton label={t.records.loading} rows={2} />;

  return (
    <div className="records-print space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link className="records-no-print inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-hayat-800 underline" to="/records">
            <ArrowLeft size={18} aria-hidden="true" />{t.records.backToRecords}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{t.records.metrics[metricKey] || metricKey}</h1>
        </div>
        <button
          className="records-no-print inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-slate-800 hover:bg-slate-50"
          type="button"
          aria-label={t.records.print}
          title={t.records.print}
          onClick={() => window.print()}
        >
          <Printer size={19} aria-hidden="true" />
          <span className="sr-only">{t.records.print}</span>
        </button>
      </header>

      {readings.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5">{t.records.noReadings}</p>
      ) : (
        <>
          <section className="card-surface space-y-3">
            <h2 className="text-lg font-semibold">{t.records.historyChart}</h2>
            <p className="text-sm leading-6 text-slate-700" aria-live="polite">
              {chartSummary}
            </p>
            <div className="h-64 min-w-0 w-full rounded-lg border border-slate-100 bg-slate-50 p-2 sm:h-72" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    ticks={chartData.length === 1 ? [chartData[0].timestamp] : undefined}
                    tickFormatter={(value) => formatDate(value, language)}
                  />
                  <YAxis width={52} />
                  <Tooltip labelFormatter={(value) => formatDate(value, language)} />
                  {chartData.map((reading) => reading.source === "report" && Number.isFinite(reading.rangeMin) && Number.isFinite(reading.rangeMax) && (
                    <ReferenceArea
                      key={`range-${reading.id}`}
                      x1={reading.timestamp - 43200000}
                      x2={reading.timestamp + 43200000}
                      y1={reading.rangeMin}
                      y2={reading.rangeMax}
                      fill="#0f766e"
                      fillOpacity={0.12}
                      strokeOpacity={0}
                    />
                  ))}
                  <Line dataKey="value" name={metricKey === "blood_pressure" ? t.records.systolic : t.records.value} type="monotone" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  {hasSecondValue && <Line dataKey="value2" name={t.records.diastolic} type="monotone" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm leading-6 text-slate-700">{t.records.rangeNote}</p>
            {newest && previous && newest.value !== previous.value && (
              <p className="text-sm text-slate-700">
                {newest.value > previous.value ? t.records.higherThanPrevious : t.records.lowerThanPrevious}
              </p>
            )}
            {newest?.value2 != null && previous?.value2 != null && newest.value2 !== previous.value2 && (
              <p className="text-sm text-slate-700">
                {t.records.diastolic}: {newest.value2 > previous.value2 ? t.records.higherThanPrevious : t.records.lowerThanPrevious}
              </p>
            )}
            <p className="text-sm font-medium text-slate-800">{t.records.discussChanges}</p>
          </section>

          <section className="card-surface space-y-3">
            <h2 className="text-lg font-semibold" id="readings-table-title">{t.records.readings}</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[600px] border-collapse text-start text-sm" aria-labelledby="readings-table-title">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="p-2 font-medium">{t.records.date}</th>
                    <th className="p-2 font-medium">{t.records.value}</th>
                    <th className="p-2 font-medium">{t.records.reportRange}</th>
                    <th className="p-2 font-medium">{t.records.source}</th>
                    <th className="p-2 font-medium">{t.records.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((reading) => (
                    <tr className="border-b border-slate-100 last:border-b-0" key={reading.id}>
                      <td className="p-2">{formatDate(reading.recordedAt, language)}</td>
                      <td className="p-2">{displayValue(reading)}</td>
                      <td className="p-2">
                        {reading.source === "report" && Number.isFinite(reading.rangeMin) && Number.isFinite(reading.rangeMax)
                          ? `${reading.rangeMin}–${reading.rangeMax}${reading.unit ? ` ${reading.unit}` : ""}`
                          : t.records.noRangePrinted}
                      </td>
                      <td className="p-2">
                        {reading.source === "self" ? t.records.selfEntered : (
                          <Link className="text-hayat-800 underline" to={`/chat?drawer=documents&reportId=${encodeURIComponent(reading.reportId)}`}>
                            {t.records.fromReport}
                          </Link>
                        )}
                      </td>
                      <td className="p-1">
                        {reading.source === "self" && (
                          <button
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                            type="button"
                            aria-label={t.records.deleteReading}
                            title={t.records.deleteReading}
                            onClick={() => void onDelete(reading)}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function Records() {
  const { t, language } = useLanguage();
  const { metricKey } = useParams();
  const [latest, setLatest] = useState([]);
  const [readings, setReadings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const request = metricKey
      ? axios.get(`/api/records/${encodeURIComponent(metricKey)}`).then(({ data }) => {
        if (active) setReadings(data);
      })
      : Promise.all([axios.get("/api/records"), axios.get("/api/profile")]).then(([recordsResponse, profileResponse]) => {
        if (active) {
          setLatest(recordsResponse.data);
          setProfile(profileResponse.data);
        }
      });
    request.catch((loadError) => {
      if (active) setError(loadError.response?.data?.error || t.records.loadFailed);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [metricKey, refreshKey, t.records.loadFailed]);

  const latestByMetric = useMemo(() => new Map(latest.map((reading) => [reading.metricKey, reading])), [latest]);

  async function deleteReading(reading) {
    if (!window.confirm(t.records.deleteConfirm)) return;
    setError("");
    try {
      await axios.delete(`/api/records/self/${reading.id}`);
      setRefreshKey((current) => current + 1);
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || t.records.deleteFailed);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      {!metricKey ? (
        <>
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{t.records.title}</h1>
            <button
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white hover:bg-hayat-900"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={19} aria-hidden="true" />{t.records.addReading}
            </button>
          </header>

          <section className="card-surface flex flex-wrap items-center gap-3" aria-label={t.records.bloodType}>
            <span className="font-medium">{t.records.bloodType}</span>
            <span className="text-lg font-semibold">{profile?.bloodType || t.records.notProvided}</span>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{t.records.selfReported}</span>
          </section>

          {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
          {loading && <PageSkeleton label={t.records.loading} rows={3} />}
          {!loading && latest.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5">{t.records.noReadings}</p>}
          {!loading && Object.entries(metricGroups).map(([group, metricKeys]) => {
            const groupReadings = metricKeys.map((key) => latestByMetric.get(key)).filter(Boolean);
            if (!groupReadings.length) return null;
            return (
              <section className="space-y-3" key={group}>
                <h2 className="text-lg font-semibold text-slate-900">{t.records.categories[group]}</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {groupReadings.map((reading) => (
                    <Link
                      className="card-surface block min-w-0 space-y-2 transition hover:border-hayat-700"
                      to={`/records/${encodeURIComponent(reading.metricKey)}`}
                      key={reading.metricKey}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold">{t.records.metrics[reading.metricKey] || reading.label}</h3>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {reading.source === "self" ? t.records.selfEntered : t.records.fromReport}
                        </span>
                      </div>
                      <p className="text-xl font-semibold text-slate-900">{displayValue(reading)}</p>
                      <p className="text-sm text-slate-600">{formatDate(reading.recordedAt, language)}</p>
                      {reading.source === "self" ? (
                        <p className="text-sm text-slate-600">{t.records.selfNotChecked}</p>
                      ) : (
                        <p className="text-sm text-slate-600">{valueStatus(reading, t)}</p>
                      )}
                      <Sparkline readings={reading.recentReadings} />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : (
        <>
          {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
          <MetricDetail metricKey={metricKey} readings={readings} loading={loading} onDelete={deleteReading} />
          <button
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white hover:bg-hayat-900"
            type="button"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={19} aria-hidden="true" />{t.records.addReading}
          </button>
        </>
      )}
      <AddReadingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => setRefreshKey((current) => current + 1)}
      />
    </section>
  );
}
