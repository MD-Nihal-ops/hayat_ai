import { useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LanguageSelector, useLanguage } from "../context/LanguageContext.jsx";

export default function Register() {
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
      await axios.post("/api/auth/register", { email, password });
      const { data } = await axios.post("/api/auth/login", { email, password });
      saveAuth({ token: data.token });
      navigate(returnToLink ? "/link" : "/", { replace: true });
    } catch (registerError) {
      setError(registerError.response?.data?.error || t.messages.requestFailed);
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
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">{t.auth.registerTitle}</h1>
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
              autoComplete="new-password"
              required
              minLength={8}
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
            {t.auth.register}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {t.auth.haveAccount}{" "}
          <Link className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-medium text-hayat-700 underline" to={returnToLink ? "/login?returnTo=%2Flink" : "/login"}>
            {t.auth.login}
          </Link>
        </p>
      </section>
    </main>
    </>
  );
}
