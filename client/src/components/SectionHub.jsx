import { Link, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

const sectionTabs = {
  explore: [
    { path: "/explore", key: "places" },
    { path: "/explore/wellness", key: "wellness" },
    { path: "/explore/providers", key: "providers" }
  ],
  family: [
    { path: "/family", key: "myCircle" },
    { path: "/family/help", key: "familyIHelp" },
    { path: "/family/tasks", key: "tasks" },
    { path: "/family/journeys", key: "journeys" }
  ],
  me: [
    { path: "/me", key: "passport" },
    { path: "/me/insurance", key: "insurance" },
    { path: "/me/language", key: "languageDisplay" },
    { path: "/me/privacy", key: "privacyConsent" },
    { path: "/me/accessibility", key: "accessibility" },
    { path: "/me/about", key: "about" }
  ]
};

function isTabActive(pathname, tabPath) {
  if (pathname === tabPath) return true;
  return tabPath !== "/explore" && tabPath !== "/family" && tabPath !== "/me" && pathname.startsWith(`${tabPath}/`);
}

export default function SectionHub({ section }) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const tabs = sectionTabs[section] || [];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5">
      <nav className="section-hub-tabs" aria-label={t.navigation[section]}>
        {tabs.map(({ path, key }) => {
          const active = isTabActive(pathname, path);
          return (
            <Link
              key={path}
              className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 font-medium ${
                active ? "bg-hayat-700 text-white" : "border border-slate-300 bg-white text-gray-900 hover:bg-hayat-50"
              }`}
              to={path}
              aria-current={active ? "page" : undefined}
            >
              {t.sectionTabs[key]}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </section>
  );
}
