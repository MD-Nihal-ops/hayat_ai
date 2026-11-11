import { useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Gavel } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { LanguageSelector, useLanguage } from "../context/LanguageContext.jsx";

const judgeDemoEnabled = import.meta.env.VITE_JUDGE_DEMO_ENABLED === "true";

export default function Login() {
  const { saveAuth, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnToLink = searchParams.get("returnTo") === "/link";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={returnToLink ? "/link" : "/"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      saveAuth({ token: data.token });
      navigate(returnToLink ? "/link" : "/", { replace: true });
    } catch (loginError) {
      setError(loginError.response?.status === 401
        ? t.auth.invalidCredentials
        : loginError.response?.data?.error || t.messages.requestFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJudgeDemo() {
    setError("");
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/auth/demo");
      saveAuth({ token: data.token });
      navigate("/home", { replace: true });
    } catch (demoError) {
      setError(demoError.response?.data?.error || t.messages.requestFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <a className="skip-link" href="#main-content">{t.accessibility.skipToMain}</a>
    <main id="main-content" tabIndex={-1} className="auth-shell">
      <aside className="auth-brand-panel">
        <img src="/branding/hayat-logo-192.png" alt="" aria-hidden="true" />
        <span>{t.appName}</span>
      </aside>
      <section className="auth-form-panel w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <LanguageSelector />
        </div>
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">{t.auth.loginTitle}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">{t.auth.email}</label>
            <input
              className="w-full min-h-[44px] bg-white text-gray-900 border border-gray-400 rounded px-3 py-2"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">{t.auth.password}</label>
            <input
              className="w-full min-h-[44px] bg-white text-gray-900 border border-gray-400 rounded px-3 py-2"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-gray-900" role="alert">{error}</p>}
          <button
            className="min-h-[44px] w-full min-w-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white hover:bg-hayat-900 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {t.auth.login}
          </button>
        </form>
        {judgeDemoEnabled && (
          <button
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-hayat-700 bg-hayat-50 px-4 py-2 font-medium text-hayat-900 hover:bg-hayat-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hayat-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={submitting}
            onClick={handleJudgeDemo}
          >
            <Gavel size={18} aria-hidden="true" />
            {t.auth.judgeDemoLogin}
          </button>
        )}
        <p className="mt-6 text-center text-sm text-slate-600">
          {t.auth.noAccount}{" "}
          <Link className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-medium text-hayat-700 underline" to={returnToLink ? "/register?returnTo=%2Flink" : "/register"}>
            {t.auth.register}
          </Link>
        </p>
      </section>
    </main>
    </>
  );
}
