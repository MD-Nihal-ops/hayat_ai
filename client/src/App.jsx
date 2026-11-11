import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import Chat from "./pages/Chat.jsx";
import About from "./pages/About.jsx";
import Care from "./pages/Care.jsx";
import ClinicPath from "./pages/ClinicPath.jsx";
import ConsentHistory from "./pages/ConsentHistory.jsx";
import Family from "./pages/Family.jsx";
import FamilyFirst from "./pages/FamilyFirst.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Map from "./pages/Map.jsx";
import Passport from "./pages/Passport.jsx";
import Providers from "./pages/Providers.jsx";
import ProviderDetail from "./pages/ProviderDetail.jsx";
import Register from "./pages/Register.jsx";
import ReferralTracker from "./pages/ReferralTracker.jsx";
import Records from "./pages/Records.jsx";
import SOS from "./pages/SOS.jsx";
import Settings from "./pages/Settings.jsx";
import Wellness from "./pages/Wellness.jsx";
import { useLanguage } from "./context/LanguageContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PublicLink from "./pages/PublicLink.jsx";
import ForOrganisations from "./pages/ForOrganisations.jsx";
import Accessibility from "./pages/Accessibility.jsx";
import SectionHub from "./components/SectionHub.jsx";
import PrivacyHub from "./components/PrivacyHub.jsx";
import Styleguide from "./components/Styleguide.jsx";

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />;
}

function LegacyRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

function LegacyCareRedirect() {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get("tab");
  const destination = tab === "tasks" ? "/family/tasks" : tab === "insurance" ? "/me/insurance" : "/my-day";
  return <Navigate to={`${destination}${location.search}${location.hash}`} replace />;
}

function LegacyProviderRedirect() {
  const { id } = useParams();
  const location = useLocation();
  return <Navigate to={`/explore/providers/${encodeURIComponent(id)}${location.search}${location.hash}`} replace />;
}

function DocumentsRedirect() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  search.set("drawer", "documents");
  return <Navigate to={`/chat?${search.toString()}`} replace />;
}

export default function App() {
  const { t } = useLanguage();

  return (
    <ErrorBoundary text={t.errorBoundary} skipToMain={t.accessibility.skipToMain}>
      <Routes>
        {import.meta.env.DEV && <Route path="/styleguide" element={<Styleguide />} />}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/link" element={<PublicLink />} />
        <Route path="/for-organisations" element={<ForOrganisations />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:metricKey" element={<Records />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="/sos" element={<SOS />} />
          <Route path="/my-day" element={<Care allowedTabs={["today", "reminders", "calendar"]} />} />
          <Route path="/explore" element={<SectionHub section="explore" />}>
            <Route index element={<Map />} />
            <Route path="wellness" element={<Wellness />} />
            <Route path="providers" element={<Providers />} />
            <Route path="providers/clinic-path" element={<ClinicPath />} />
            <Route path="providers/:id" element={<ProviderDetail />} />
          </Route>
          <Route path="/family" element={<SectionHub section="family" />}>
            <Route index element={<Family initialTab="circle" showTabs={false} showShortcuts={false} />} />
            <Route path="help" element={<Family initialTab="helping" showTabs={false} showShortcuts={false} />} />
            <Route path="tasks" element={<Care allowedTabs={["tasks"]} initialTab="tasks" showTabs={false} />} />
            <Route path="journeys" element={<FamilyFirst />} />
          </Route>
          <Route path="/me" element={<SectionHub section="me" />}>
            <Route index element={<Passport />} />
            <Route path="insurance" element={<Care allowedTabs={["insurance"]} initialTab="insurance" showTabs={false} />} />
            <Route path="language" element={<Settings section="preferences" />} />
            <Route path="accessibility" element={<Settings section="accessibility" />} />
            <Route path="about" element={<About />} />
            <Route path="privacy" element={<PrivacyHub />}>
              <Route index element={<Navigate to="consents" replace />} />
              <Route path="consents" element={<ConsentHistory />} />
              <Route path="access-log" element={<Family initialTab="log" showTabs={false} showShortcuts={false} titleKey="accessLogTitle" />} />
              <Route path="data" element={<Settings section="data" />} />
            </Route>
          </Route>
          <Route path="/documents" element={<DocumentsRedirect />} />
          <Route path="/reports" element={<DocumentsRedirect />} />
          <Route path="/map" element={<LegacyRedirect to="/explore" />} />
          <Route path="/providers" element={<LegacyRedirect to="/explore/providers" />} />
          <Route path="/providers/:id" element={<LegacyProviderRedirect />} />
          <Route path="/wellness" element={<LegacyRedirect to="/explore/wellness" />} />
          <Route path="/clinic-path" element={<LegacyRedirect to="/explore/providers/clinic-path" />} />
          <Route path="/passport" element={<LegacyRedirect to="/me" />} />
          <Route path="/care" element={<LegacyCareRedirect />} />
          <Route path="/tasks" element={<LegacyRedirect to="/family/tasks" />} />
          <Route path="/family-first" element={<LegacyRedirect to="/family/journeys" />} />
          <Route path="/consents" element={<LegacyRedirect to="/me/privacy/consents" />} />
          <Route path="/access-log" element={<LegacyRedirect to="/me/privacy/access-log" />} />
          <Route path="/insurance" element={<LegacyRedirect to="/me/insurance" />} />
          <Route path="/settings" element={<LegacyRedirect to="/me/language" />} />
          <Route path="/about" element={<LegacyRedirect to="/me/about" />} />
          <Route path="/referrals/:reportId" element={<ReferralTracker />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
