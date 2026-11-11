import { Link } from "react-router-dom";
import { MapPin, MessageCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import SpeechControls from "./SpeechControls.jsx";

export default function SpecialistCard({ item, onFindPlaces, onAskDoctorQuestion, disabled }) {
  const { t, language } = useLanguage();
  const payload = typeof item.payload === "string" ? JSON.parse(item.payload || "{}") : item.payload || {};
  const specialties = Array.isArray(item.specialties)
    ? item.specialties
    : Array.isArray(payload.specialties)
      ? payload.specialties
      : ["general_practice"];
  const speechText = [
    ...specialties.slice(0, 2).flatMap((key) => {
      const specialty = t.chat.navigator.specialties[key] || t.chat.navigator.specialties.general_practice;
      return [
        t.chat.navigator.recommendation.replace("{specialty}", specialty.name),
        specialty.description
      ];
    }),
    item.clarify,
    t.chat.navigator.diagnosisDisclaimer,
    t.chat.navigator.emergencyNotice
  ].filter(Boolean).join(". ");

  return (
    <section
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-800"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="space-y-3">
        {specialties.slice(0, 2).map((key) => {
          const specialty = t.chat.navigator.specialties[key] || t.chat.navigator.specialties.general_practice;
          return (
            <div key={key}>
              <p className="font-semibold">
                {t.chat.navigator.recommendation.replace("{specialty}", specialty.name)}
              </p>
              <p className="text-sm leading-6 text-slate-600">{specialty.description}</p>
            </div>
          );
        })}
      </div>
      <SpeechControls messageId={`specialist-${item.id || specialties.join("-")}`} text={speechText} language={language} />
      {item.clarify && <p className="border-t border-slate-100 pt-3">{item.clarify}</p>}
      <p className="border-t border-slate-100 pt-3 text-sm leading-6">
        {t.chat.navigator.diagnosisDisclaimer}
      </p>
      <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900">
        <p>{t.chat.navigator.emergencyNotice}</p>
        <Link className="font-medium underline" to="/sos">{t.chat.openSos}</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white hover:bg-hayat-900 disabled:opacity-60"
          type="button"
          disabled={disabled}
          onClick={() => onFindPlaces(specialties[0] || "general_practice")}
        >
          <MapPin size={18} aria-hidden="true" />
          {t.chat.navigator.findPlaces}
        </button>
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-hayat-700 px-4 py-2 font-medium text-gray-900 hover:bg-hayat-50 disabled:opacity-60"
          type="button"
          disabled={disabled}
          onClick={onAskDoctorQuestion}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {t.chat.navigator.questions}
        </button>
      </div>
    </section>
  );
}