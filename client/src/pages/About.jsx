import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function About() {
  const { t, language } = useLanguage();
  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"} aria-labelledby="about-title">
      <header className="card-surface space-y-2">
        <h1 id="about-title" className="text-2xl font-semibold">{t.about.title}</h1>
        <p className="text-lg text-slate-700">{t.about.summary}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-surface space-y-2" aria-labelledby="about-does-title">
          <h2 id="about-does-title" className="text-lg font-semibold">{t.about.doesTitle}</h2>
          <p className="text-slate-700">{t.about.does}</p>
        </section>
        <section className="card-surface space-y-2" aria-labelledby="about-not-title">
          <h2 id="about-not-title" className="text-lg font-semibold">{t.about.notTitle}</h2>
          <p className="text-slate-700">{t.about.not}</p>
          <p className="font-semibold">{t.reports.disclaimer}</p>
        </section>
      </div>
      <section className="card-surface space-y-3" aria-labelledby="about-sources-title">
        <h2 id="about-sources-title" className="text-lg font-semibold">{t.about.sourcesTitle}</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-700">
          <li><a className="inline-flex min-h-[44px] items-center text-hayat-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hayat-700" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">{t.about.sources.osm}</a></li>
          <li><a className="inline-flex min-h-[44px] items-center text-hayat-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hayat-700" href="https://mohap.gov.ae/en/open-data" target="_blank" rel="noopener noreferrer">{t.about.sources.mohap}</a></li>
          <li><a className="inline-flex min-h-[44px] items-center text-hayat-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hayat-700" href="https://mohap.gov.ae/en/w/registered-medications-list" target="_blank" rel="noopener noreferrer">{t.about.sources.medicines}</a></li>
        </ul>
        <p className="text-sm text-slate-700">{t.about.sourceNote}</p>
        <p className="text-sm text-slate-700">{t.about.providerDirectory}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-surface space-y-2" aria-labelledby="about-stored-title">
          <h2 id="about-stored-title" className="text-lg font-semibold">{t.about.storedTitle}</h2>
          <p className="text-slate-700">{t.about.stored}</p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-outline min-h-[44px]" to="/me/language">{t.navigation.settings}</Link>
            <Link className="btn-outline min-h-[44px]" to="/for-organisations">{t.publicLink.forOrganisations}</Link>
          </div>
        </section>
        <section className="card-surface space-y-3" aria-labelledby="about-verify-title">
          <h2 id="about-verify-title" className="text-lg font-semibold">{t.about.verifyTitle}</h2>
          <ul className="list-inside list-disc space-y-2 text-slate-700">
            {t.about.verifyItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
    </section>
  );
}
