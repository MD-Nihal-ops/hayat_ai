import { useLanguage } from "../context/LanguageContext.jsx";
import SpeechControls from "./SpeechControls.jsx";

function displayField(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default function RegisteredMedicineCard({ query, result, source, speechId }) {
  const { t } = useLanguage();
  const matches = result?.matches || [];
  let statusText = t.reports.medicineNotFound;
  if (result?.status === "found") statusText = t.reports.medicineFound;
  if (result?.status === "possible") {
    statusText = t.reports.medicinePossible.replace(
      "{name}",
      matches[0]?.name || t.reports.toVerify
    );
  }
  const speechText = [
    query,
    statusText,
    ...matches.flatMap((match) => [
      match.name && `${t.reports.medicineName}: ${match.name}`,
      match.form && `${t.reports.medicineForm}: ${match.form}`,
      match.strength && `${t.reports.medicineStrength}: ${match.strength}`,
      match.manufacturer && `${t.reports.medicineManufacturer}: ${match.manufacturer}`,
      match.manufacturerCountry && `${t.reports.medicineCountry}: ${match.manufacturerCountry}`,
      match.mah && `${t.reports.medicineMah}: ${match.mah}`,
      match.mahCountry && `${t.reports.medicineMahCountry}: ${match.mahCountry}`
    ]),
    t.reports.medicineListNotice
      .replace("{title}", source?.title || t.reports.toVerify)
      .replace("{date}", source?.date || t.reports.toVerify)
  ].flat().filter(Boolean).join(". ");

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-gray-900">
      <h4 className="font-semibold">{query}</h4>
      <p className="font-medium">{statusText}</p>
      <SpeechControls messageId={speechId || `medicine-${query}`} text={speechText} />
      {matches.map((match, index) => (
        <article className="space-y-1 rounded-lg border border-slate-200 p-3" key={`${index}-${match.name}-${match.form}-${match.strength}`}>
          <p><strong>{t.reports.medicineName}:</strong> {displayField(match.name, t.reports.toVerify)}</p>
          <p><strong>{t.reports.medicineForm}:</strong> {displayField(match.form, t.reports.toVerify)}</p>
          <p><strong>{t.reports.medicineStrength}:</strong> {displayField(match.strength, t.reports.toVerify)}</p>
          <p><strong>{t.reports.medicineManufacturer}:</strong> {displayField(match.manufacturer, t.reports.toVerify)}</p>
          <p><strong>{t.reports.medicineCountry}:</strong> {displayField(match.manufacturerCountry, t.reports.toVerify)}</p>
          <p><strong>{t.reports.medicineMah}:</strong> {displayField(match.mah, t.reports.toVerify)}</p>
          <p><strong>{t.reports.medicineMahCountry}:</strong> {displayField(match.mahCountry, t.reports.toVerify)}</p>
        </article>
      ))}
      <p className="text-sm text-gray-700">
        {t.reports.medicineListNotice
          .replace("{title}", source?.title || t.reports.toVerify)
          .replace("{date}", source?.date || t.reports.toVerify)}
      </p>
    </section>
  );
}
