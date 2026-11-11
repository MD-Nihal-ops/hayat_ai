import { useLanguage } from "../context/LanguageContext.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ItemList({ items }) {
  return (
    <ul className="list-disc space-y-2 ps-6">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function Accessibility() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const page = t.accessibility.page;

  return (
    <>
    <a className="skip-link" href="#main-content">{t.accessibility.skipToMain}</a>
    <main id="main-content" tabIndex={-1} className="mx-auto min-h-screen w-full max-w-3xl space-y-6 bg-white px-4 py-6 text-gray-900 sm:py-10" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="space-y-3">
        <Link className="inline-flex min-h-[44px] items-center text-hayat-800 underline" to={isAuthenticated ? "/chat" : "/login"}>
          {isAuthenticated ? t.navigation.askHayat : t.auth.login}
        </Link>
        <h1 className="text-2xl font-semibold">{page.title}</h1>
        <p>{page.intro}</p>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 font-medium text-gray-900">
          {page.targetStatement}
        </p>
      </header>

      <section className="card-surface space-y-3">
        <h2 className="text-lg font-semibold">{page.supportedTitle}</h2>
        <ItemList items={page.supportedItems} />
      </section>

      <section className="card-surface space-y-3">
        <h2 className="text-lg font-semibold">{page.notSupportedTitle}</h2>
        <ItemList items={page.notSupportedItems} />
      </section>

      <section className="card-surface space-y-3">
        <h2 className="text-lg font-semibold">{page.notTestedTitle}</h2>
        <ItemList items={page.notTestedItems} />
      </section>

      <section className="card-surface space-y-3">
        <h2 className="text-lg font-semibold">{page.limitationsTitle}</h2>
        <ItemList items={page.limitationsItems} />
      </section>

      <section className="card-surface space-y-3">
        <h2 className="text-lg font-semibold">{page.feedbackTitle}</h2>
        <p>{page.feedbackBody}</p>
      </section>
    </main>
    </>
  );
}
