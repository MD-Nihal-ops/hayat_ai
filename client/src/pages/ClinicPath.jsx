import { useState } from "react";
import { Accessibility, Ear, Eye, Languages, MessageCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import SpeechControls from "../components/SpeechControls.jsx";

const needOptions = [
  ["wheelchair", Accessibility],
  ["hearing", Ear],
  ["vision", Eye],
  ["simple", MessageCircle],
  ["interpreter", Languages]
];
const visitOptions = ["general", "test", "specialist"];
const pathStages = ["before", "arriving", "inside", "after"];

export default function ClinicPath() {
  const { t, language } = useLanguage();
  const [screen, setScreen] = useState(0);
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [visit, setVisit] = useState("");
  const clinic = t.clinicPath.sampleClinic;
  const options = t.clinicPath.deskSentences;

  function toggleNeed(key) {
    setSelectedNeeds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{t.clinicPath.title}</h1>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 font-medium text-amber-950">{t.clinicPath.banner}</p>
      </header>
      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t.clinicPath.screens}>
        {t.clinicPath.screenNames.map((name, index) => (
          <button className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium ${screen === index ? "border-hayat-700 bg-hayat-50 text-hayat-900" : "border-slate-300 bg-white"}`} type="button" aria-current={screen === index ? "step" : undefined} onClick={() => setScreen(index)} key={name}>
            {index + 1}. {name}
          </button>
        ))}
      </nav>
      <section className="min-h-80 rounded-xl border border-slate-200 bg-white p-5">
        {screen === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{t.clinicPath.needsTitle}</h2>
              <p className="mt-1 text-gray-600">{t.clinicPath.needsHint}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {needOptions.map(([key, Icon]) => (
                <button className={`flex min-h-24 items-center gap-3 rounded-xl border p-4 text-start ${selectedNeeds.includes(key) ? "border-hayat-700 bg-hayat-50" : "border-slate-300 bg-white"}`} type="button" aria-pressed={selectedNeeds.includes(key)} onClick={() => toggleNeed(key)} key={key}>
                  {key === "wheelchair" ? <Accessibility size={24} aria-hidden="true" /> : <Icon size={24} aria-hidden="true" />}
                  <span className="font-medium">{t.clinicPath.needs[key]}</span>
                </button>
              ))}
            </div>
            {selectedNeeds.length > 0 && <p className="text-sm text-gray-600">{t.clinicPath.notSaved}</p>}
          </div>
        )}
        {screen === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t.clinicPath.visitTitle}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {visitOptions.map((key) => (
                <button className={`min-h-24 rounded-xl border p-4 text-start font-medium ${visit === key ? "border-hayat-700 bg-hayat-50" : "border-slate-300 bg-white"}`} type="button" aria-pressed={visit === key} onClick={() => setVisit(key)} key={key}>
                  {t.clinicPath.visits[key]}
                </button>
              ))}
            </div>
            <p className="rounded-xl bg-slate-50 p-4">{clinic}</p>
          </div>
        )}
        {screen === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t.clinicPath.pathTitle}</h2>
            <p className="rounded-xl bg-teal-50 p-4 font-medium">{clinic}</p>
            <ol className="space-y-3">
              {pathStages.map((stage, index) => (
                <li className="flex gap-3 rounded-xl border border-slate-200 p-4" key={stage}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hayat-100 font-semibold text-hayat-900">{index + 1}</span>
                  <div><h3 className="font-semibold">{t.clinicPath.stages[stage]}</h3><p className="mt-1">{t.clinicPath.stageDetails[stage]}</p></div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {screen === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t.clinicPath.deskTitle}</h2>
            </div>
            <SpeechControls messageId="clinic-path-desk" text={options.join("\n")} language={language} />
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {options.map((sentence) => <p className="rounded-xl bg-white p-4 text-lg" key={sentence}>“{sentence}”</p>)}
            </div>
            <p className="text-sm text-gray-600">{clinic}</p>
          </div>
        )}
      </section>
      <div className="flex justify-between gap-3">
        <button className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 disabled:opacity-50" type="button" disabled={screen === 0} onClick={() => setScreen((current) => current - 1)}>{t.clinicPath.previous}</button>
        <button className="min-h-[44px] rounded-lg bg-hayat-700 px-5 font-medium text-white disabled:opacity-50" type="button" disabled={screen === 3} onClick={() => setScreen((current) => current + 1)}>{t.clinicPath.next}</button>
      </div>
      <p className="text-center text-sm text-gray-600">{t.clinicPath.notSaved}</p>
    </section>
  );
}
