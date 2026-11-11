import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, Phone } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import providers from "../data/providers.json";
import {
  hasVerifiedProviderPhone,
  hasVerifiedProviderWebsite,
  isGoogleMapsLink
} from "../utils/groupMatch.js";

export default function ProviderDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const provider = providers.find((entry) => entry.id === id);

  if (!provider) {
    return (
      <section className="mx-auto w-full max-w-4xl space-y-4 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
        <Link className="inline-flex min-h-[44px] items-center gap-2 font-medium text-hayat-800 underline" to="/explore/providers">
          <ArrowLeft size={18} aria-hidden="true" />{t.providerDetail.back}
        </Link>
        <h1 className="text-2xl font-semibold">{t.providerDetail.notFound}</h1>
      </section>
    );
  }

  const about = t.providerDetail.aboutTemplate
    .replace("{name}", provider.name)
    .replace("{kind}", t.providers.kinds[provider.kind] || provider.kind)
    .replace("{category}", provider.category)
    .replace("{specializations}", provider.specializations.join(", "));
  const websiteVerified = hasVerifiedProviderWebsite(provider);
  const phoneVerified = hasVerifiedProviderPhone(provider);
  const mapLinkValid = isGoogleMapsLink(provider.mapLink);
  const phoneHref = provider.phone.replace(/[^\d+]/g, "");

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <Link className="inline-flex min-h-[44px] items-center gap-2 font-medium text-hayat-800 underline" to="/explore/providers">
        <ArrowLeft size={18} aria-hidden="true" />{t.providerDetail.back}
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold">{provider.name}</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {t.providers.kinds[provider.kind] || provider.kind}
          </span>
        </div>
        <p className="text-slate-700">{provider.category}</p>
      </header>

      <section className="card-surface space-y-2">
        <h2 className="text-lg font-semibold">{t.providerDetail.aboutTitle}</h2>
        <p>{about}</p>
      </section>

      {provider.specializations.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t.providerDetail.specializations}</h2>
          <div className="flex flex-wrap gap-2">
            {provider.specializations.map((specialization, index) => (
              <span className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-900" key={`${specialization}-${index}`}>
                {specialization}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t.providerDetail.branches}</h2>
        {provider.branches.length > 0 ? (
          <ul className="list-inside list-disc space-y-1">
            {provider.branches.map((branch, index) => <li key={`${branch}-${index}`}>{branch}</li>)}
          </ul>
        ) : <p className="text-slate-600">{t.providerDetail.noBranches}</p>}
      </section>

      <section className="flex flex-wrap gap-2">
        {websiteVerified ? (
          <a
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 py-2 font-medium text-white hover:bg-hayat-900"
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={18} aria-hidden="true" />{t.providerDetail.visitWebsite}
          </a>
        ) : (
          <p className="flex min-h-[44px] items-center text-sm text-slate-600">{t.providerDetail.websiteNotVerified}</p>
        )}
        {phoneVerified ? (
          <a
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-gray-900"
            href={`tel:${phoneHref}`}
          >
            <Phone size={18} aria-hidden="true" />{t.providerDetail.call}
          </a>
        ) : (
          <p className="flex min-h-[44px] items-center text-sm text-slate-600">{t.providerDetail.phoneNotVerified}</p>
        )}
        {mapLinkValid && (
          <a
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-gray-900"
            href={provider.mapLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin size={18} aria-hidden="true" />{t.providerDetail.openGoogleMaps}
          </a>
        )}
        <Link
          className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 font-medium text-hayat-800"
          to={`/explore?q=${encodeURIComponent(provider.name)}`}
        >
          {t.providerDetail.findOnHayatMap}
        </Link>
      </section>
      {mapLinkValid && <p className="text-sm text-slate-600">{t.providerDetail.mapCaveat}</p>}

      <div className="space-y-1 text-sm text-slate-700">
        <p>{t.providerDetail.dataStatus.replace("{status}", provider.dataStatus)}</p>
        <p>{t.providerDetail.lastChecked.replace("{date}", provider.lastChecked || t.providerDetail.notChecked)}</p>
      </div>

      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-gray-900">
        {t.providerDetail.fixedNote}
      </p>
    </section>
  );
}
