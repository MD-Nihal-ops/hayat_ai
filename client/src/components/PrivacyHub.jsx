import { Link, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

const tabs = [
  { path: "/me/privacy/consents", key: "consentLedger" },
  { path: "/me/privacy/access-log", key: "accessLog" },
  { path: "/me/privacy/data", key: "dataControls" }
];

export default function PrivacyHub() {
  const { t } = useLanguage();
  const { pathname } = useLocation();

  return (
    <section className="space-y-5">
      <nav className="flex flex-wrap gap-2" aria-label={t.sectionTabs.privacyConsent}>
        {tabs.map(({ path, key }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              className={`inline-flex min-h-[44px] items-center rounded-lg px-4 py-2 font-medium ${
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
