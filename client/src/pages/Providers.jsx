import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import providers from "../data/providers.json";

const kinds = ["all", "private", "government", "government-linked"];
const categoryGroups = ["all", "group", "hospital", "clinic", "pharmacy", "diagnostics", "specialty", "other"];

export default function Providers() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const filteredProviders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return providers.filter((provider) => {
      const searchableText = [provider.name, ...provider.branches, ...provider.specializations]
        .join(" ")
        .toLocaleLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesKind = selectedKind === "all" || provider.kind === selectedKind;
      const matchesCategory = selectedCategory === "all" || provider.categoryGroup === selectedCategory;
      return matchesQuery && matchesKind && matchesCategory;
    });
  }, [query, selectedKind, selectedCategory]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header>
        <h1 className="text-2xl font-semibold">{t.navigation.providers}</h1>
        <Link className="mt-2 inline-flex min-h-[44px] items-center text-hayat-900 underline" to="/explore/providers/clinic-path">
          {t.navigation.clinicPath}
        </Link>
      </header>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-gray-900" role="note">
        {t.providers.banner}
      </p>

      <label className="relative block">
        <span className="sr-only">{t.providers.searchLabel}</span>
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} aria-hidden="true" />
        <input
          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white ps-10 pe-3 text-gray-900"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.providers.searchPlaceholder}
        />
      </label>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.providers.kindFilterLabel}>
          {kinds.map((kind) => (
            <button
              className={`min-h-[44px] rounded-lg border px-4 py-2 font-medium ${selectedKind === kind ? "border-hayat-700 bg-hayat-700 text-white" : "border-slate-300 bg-white text-gray-900 hover:bg-slate-50"}`}
              key={kind}
              type="button"
              aria-pressed={selectedKind === kind}
              onClick={() => setSelectedKind(kind)}
            >
              {t.providers.kindFilters[kind]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.providers.categoryFilterLabel}>
          {categoryGroups.map((category) => (
            <button
              className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium ${selectedCategory === category ? "border-hayat-700 bg-hayat-700 text-white" : "border-slate-300 bg-white text-gray-900 hover:bg-slate-50"}`}
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {t.providers.categoryFilters[category]}
            </button>
          ))}
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700" role="status">
          {t.providers.noResults}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredProviders.map((provider) => (
            <Link
              className="block min-w-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-hayat-700"
              key={provider.id}
              to={`/explore/providers/${encodeURIComponent(provider.id)}`}
            >
              <article className="h-full min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-hayat-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 font-semibold text-slate-900">{provider.name}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {t.providers.kinds[provider.kind]}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{provider.category}</p>
                {provider.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {provider.specializations.slice(0, 3).map((specialization, index) => (
                      <span className="rounded-md bg-teal-50 px-2 py-1 text-sm text-teal-900" key={`${specialization}-${index}`}>
                        {specialization}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
