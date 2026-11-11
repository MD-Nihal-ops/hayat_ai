import { useLanguage } from "../context/LanguageContext.jsx";
import { evaluateValue } from "../utils/valueChecker.js";

function valueForStatus(status, t) {
  if (status.startsWith("DANGER:")) {
    return { text: t.reports.statuses.danger, className: "text-red-600" };
  }
  const statusTranslations = {
    high: t.reports.statuses.high,
    low: t.reports.statuses.low,
    "within range": t.reports.statuses.withinRange,
    "no range printed, not judged": t.reports.statuses.notJudged
  };
  const className = status === "within range"
    ? "text-green-700"
    : status === "high" || status === "low"
      ? "text-amber-800"
      : "text-gray-500";
  return { text: statusTranslations[status] || t.reports.statuses.notJudged, className };
}

export default function ReviewTable({ values, onChange, multiplePatients = false, readOnly = false, documentDate = "", onDocumentDateChange, reportType }) {
  const { t } = useLanguage();

  function updateValue(index, field, value) {
    onChange((currentValues) => currentValues.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === "min" || field === "max") {
        return { ...item, printedRange: { ...item.printedRange, [field]: value } };
      }
      return { ...item, [field]: value };
    }));
  }

  const hasDanger = values.some((item) =>
    evaluateValue(item.name, item.value, item.printedRange).startsWith("DANGER:")
  );

  return (
    <div className="space-y-4">
      {hasDanger && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 font-semibold text-red-700" role="alert">
          {t.reports.statuses.danger}
        </p>
      )}
      {multiplePatients && (
        <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-gray-900">
          {t.reports.multiplePatientsNotice}
        </p>
      )}
      <h3 className="text-lg font-semibold text-slate-900">
        {readOnly ? t.reports.valuesConfirmed : t.reports.checkValues}
      </h3>
      <label className="block max-w-xs space-y-1 text-sm font-medium text-slate-800">
        <span>{t.reports.testDate}</span>
        <input
          className="min-h-[44px] w-full rounded border border-gray-400 bg-white px-3 py-2 text-gray-900 disabled:bg-slate-50"
          type="date"
          value={documentDate}
          disabled={readOnly}
          onChange={(event) => onDocumentDateChange?.(event.target.value)}
        />
      </label>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="p-2 font-medium">{t.reports.fields.name}</th>
              <th className="p-2 font-medium">{t.reports.fields.value}</th>
              <th className="p-2 font-medium">{t.reports.fields.unit}</th>
              <th className="p-2 font-medium">{t.reports.fields.min}</th>
              <th className="p-2 font-medium">{t.reports.fields.max}</th>
              <th className="p-2 font-medium">{t.reports.fields.status}</th>
            </tr>
          </thead>
          <tbody>
            {values.map((item, index) => {
              const status = evaluateValue(item.name, item.value, item.printedRange);
              const displayStatus = valueForStatus(status, t);
              const inputClass = "w-full min-h-[44px] rounded border border-gray-400 bg-white px-2 py-1 text-gray-900 disabled:border-transparent disabled:bg-transparent";
              return (
                <tr className="border-b border-slate-100 align-top last:border-b-0" key={`${index}-${item.name}`}>
                  <td className="p-2">
                    <input className={`${inputClass} min-w-[160px]`} aria-label={t.reports.fields.name} value={item.name ?? ""} disabled={readOnly} onChange={(event) => updateValue(index, "name", event.target.value)} />
                    {reportType === "prescription" && (
                      <label className="mt-2 block min-w-[180px] space-y-1">
                        <span className="text-xs font-medium text-slate-700">{t.reports.printedInstructions}</span>
                        <textarea className={`${inputClass} min-h-20`} value={item.instructions ?? ""} disabled={readOnly} maxLength={500} onChange={(event) => updateValue(index, "instructions", event.target.value)} />
                      </label>
                    )}
                  </td>
                  <td className="p-2">
                    <input className={inputClass} aria-label={t.reports.fields.value} value={item.value ?? ""} disabled={readOnly} onChange={(event) => updateValue(index, "value", event.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className={inputClass} aria-label={t.reports.fields.unit} value={item.unit ?? ""} disabled={readOnly} onChange={(event) => updateValue(index, "unit", event.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className={inputClass} aria-label={t.reports.fields.min} type="number" value={item.printedRange?.min ?? ""} disabled={readOnly} onChange={(event) => updateValue(index, "min", event.target.value)} />
                  </td>
                  <td className="p-2">
                    <input className={inputClass} aria-label={t.reports.fields.max} type="number" value={item.printedRange?.max ?? ""} disabled={readOnly} onChange={(event) => updateValue(index, "max", event.target.value)} />
                  </td>
                  <td className={`whitespace-normal break-words p-2 font-medium ${displayStatus.className}`} role="status">{displayStatus.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
