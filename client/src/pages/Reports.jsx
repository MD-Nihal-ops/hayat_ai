import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import DocumentLibraryItem from "../components/DocumentLibraryItem.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";

function reportDate(value, language) {
  return value ? new Date(`${value.replace(" ", "T")}Z`).toLocaleDateString(language) : "";
}

export default function Reports() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/reports");
      setReports(data);
    } catch (loadError) {
      setError(loadError.response?.data?.error || t.reports.historyFailed);
    } finally {
      setLoading(false);
    }
  }, [t.reports.historyFailed]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    const reportId = searchParams.get("reportId");
    if (!reportId || loading || !reports.length) return;
    const report = reports.find((item) => String(item.id) === reportId);
    setSearchParams({}, { replace: true });
    if (report) void openInChat(report);
  }, [loading, reports, searchParams, setSearchParams]);

  async function openInChat(report) {
    setError("");
    try {
      const { data: conversation } = await axios.post("/api/conversations");
      const messageType = report.status === "confirmed" ? "explanation" : "review";
      await axios.post(`/api/conversations/${conversation.id}/messages`, {
        role: "assistant",
        content: "",
        language,
        messageType,
        payload: {
          reportId: Number(report.id),
          language,
          ...(messageType === "review" ? { documentDate: report.documentDate || "" } : {})
        }
      });
      navigate(`/chat/${conversation.id}`);
    } catch (openError) {
      setError(openError.response?.data?.error || t.reports.historyFailed);
    }
  }

  async function deleteReport(report) {
    if (!window.confirm(t.reports.deleteConfirm)) return;
    setError("");
    try {
      await axios.delete(`/api/reports/${report.id}`);
      setReports((current) => current.filter((item) => item.id !== report.id));
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || t.reports.deleteFailed);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 text-gray-900" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold text-slate-900">{t.navigation.reports}</h1>
      </header>
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      {loading && <PageSkeleton label={t.reports.historyLoading} rows={3} />}
      {!loading && reports.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-gray-900">{t.reports.historyEmpty}</p>
      )}
      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <DocumentLibraryItem
              key={report.id}
              report={report}
              date={reportDate(report.createdAt, language)}
              onOpen={() => void openInChat(report)}
              onDelete={() => void deleteReport(report)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
