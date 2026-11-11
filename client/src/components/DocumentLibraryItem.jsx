import { FileText } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import useAuthedBlobUrl from "../hooks/useAuthedBlobUrl.js";

export default function DocumentLibraryItem({ report, date, onOpen, onDelete }) {
  const { t } = useLanguage();
  const file = useAuthedBlobUrl(`/api/reports/${report.id}/file`, true, t.reports.historyFailed);

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-gray-900">
      <div className="flex min-w-[180px] flex-1 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {file.type.startsWith("image/") && file.url ? (
            <img className="h-full w-full object-cover" src={file.url} alt={t.reports.previewAlt} />
          ) : (
            <FileText size={28} className="text-hayat-700" aria-hidden="true" />
          )}
        </div>
        <div>
          <h2 className="font-semibold">{t.reports.typeLabels[report.type] || report.type}</h2>
          <p className="text-sm text-slate-600">{date}</p>
          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">
            {t.reports.statusLabels[report.status] || report.status}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {file.url && file.type === "application/pdf" && (
          <a className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4 font-medium text-hayat-800 underline" href={file.url} target="_blank" rel="noopener noreferrer">
            {t.reports.openDocument}
          </a>
        )}
        <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white hover:bg-hayat-800" type="button" onClick={onOpen}>
          {t.reports.openInChat}
        </button>
        <button className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-100" type="button" onClick={onDelete}>
          {t.reports.delete}
        </button>
      </div>
    </article>
  );
}
