import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  FileText,
  HeartPulse,
  House,
  Info,
  Map,
  MessageCircle,
  Settings,
  Siren,
  UserRound,
  Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage, LanguageSelector } from "../context/LanguageContext.jsx";
import ThemeSelector from "../components/ThemeSelector.jsx";

const navigation = [
  { to: "/home", key: "home", Icon: House },
  { to: "/explore", key: "explore", Icon: Map },
  { to: "/chat", key: "askHayat", Icon: MessageCircle },
  { to: "/family", key: "family", Icon: Users },
  { to: "/me", key: "me", Icon: UserRound }
];

const quickLinks = [
  { to: "/my-day", key: "care", Icon: HeartPulse },
  { to: "/documents", key: "reports", Icon: FileText },
  { to: "/explore/wellness", key: "wellness", Icon: Activity },
  { to: "/explore/providers", key: "providers", Icon: Map }
];

function titleForPath(pathname, t) {
  if (pathname === "/" || pathname.startsWith("/home")) return t.navigation.home;
  if (pathname.startsWith("/chat")) return t.navigation.askHayat;
  if (pathname.startsWith("/explore/wellness")) return t.sectionTabs.wellness;
  if (pathname.startsWith("/explore/providers")) return t.navigation.providers;
  if (pathname.startsWith("/explore")) return t.navigation.explore;
  if (pathname.startsWith("/family")) return t.navigation.family;
  if (pathname.startsWith("/my-day")) return t.navigation.care;
  if (pathname.startsWith("/me")) return t.navigation.me;
  if (pathname.startsWith("/records")) return t.records.title;
  if (pathname.startsWith("/sos")) return t.sos.title;
  return t.appName;
}

export default function AppLayout() {
  const { t } = useLanguage();
  const { logout, isDemoSession } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell min-h-screen text-gray-900">
      <a className="skip-link" href="#main-content">{t.accessibility.skipToMain}</a>
      <aside className="app-sidebar">
        <Link className="app-brand" to="/home">
          <img src="/assets/hayat-ai-logo.png" alt="" aria-hidden="true" />
          <span>{t.appName}</span>
        </Link>
        <nav className="app-sidebar-nav" aria-label={t.appName}>
          <p className="app-sidebar-label">{t.navigation.primaryNavigation}</p>
          {navigation.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `app-nav-link${isActive || (to === "/home" && pathname === "/") ? " is-active" : ""}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{t.navigation[key]}</span>
            </NavLink>
          ))}
          <p className="app-sidebar-label app-sidebar-label--quick">{t.navigation.quickLinks}</p>
          {quickLinks.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `app-nav-link app-nav-link--secondary${isActive ? " is-active" : ""}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{key === "wellness" ? t.sectionTabs.wellness : t.navigation[key]}</span>
            </NavLink>
          ))}
          <NavLink to="/me/language" className={({ isActive }) => `app-nav-link app-nav-link--secondary${isActive ? " is-active" : ""}`}>
            <Settings size={20} aria-hidden="true" />
            <span>{t.navigation.settings}</span>
          </NavLink>
          <NavLink to="/me/about" className={({ isActive }) => `app-nav-link app-nav-link--secondary${isActive ? " is-active" : ""}`}>
            <Info size={20} aria-hidden="true" />
            <span>{t.sectionTabs.about}</span>
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Link className="app-brand app-brand--mobile" to="/home">
            <img src="/assets/hayat-ai-logo.png" alt="" aria-hidden="true" />
            <span>{t.appName}</span>
          </Link>
          <h1 className="app-page-title">{titleForPath(pathname, t)}</h1>
          <div className="app-topbar-controls">
            {isDemoSession && (
              <span className="demo-profile-badge" role="status">{t.auth.demoProfile}</span>
            )}
            <LanguageSelector className="app-language-selector" />
            <ThemeSelector compact className="app-theme-selector" />
            <Link
              className="app-sos-trigger"
              to="/sos"
              aria-label={t.sos.button}
            >
              {t.sos.button}
            </Link>
            <button className="app-signout" type="button" onClick={handleSignOut}>
              {t.auth.signOut}
            </button>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="app-content">
          <Outlet />
        </main>
      </div>

      <nav className="app-bottom-nav" aria-label={t.appName}>
        {navigation.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `app-bottom-nav-link${isActive || (to === "/home" && pathname === "/") ? " is-active" : ""}${key === "askHayat" ? " is-chat" : ""}`}
          >
            {key === "askHayat" ? (
              <span className="app-chat-shortcut"><Icon size={22} aria-hidden="true" /></span>
            ) : <Icon size={20} aria-hidden="true" />}
            <span>{t.navigation[key]}</span>
          </NavLink>
        ))}
      </nav>
      <Link className="app-sos-fab" to="/sos">
        <Siren size={19} aria-hidden="true" />
        <span>{t.sos.button}</span>
      </Link>
    </div>
  );
}
