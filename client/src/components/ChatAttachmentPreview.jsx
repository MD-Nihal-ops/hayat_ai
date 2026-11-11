import { FileText } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import useAuthedBlobUrl from "../hooks/useAuthedBlobUrl.js";

export default function ChatAttachmentPreview({ item, localPreviewUrl = "", localPreviewType = "" }) {
  const { t } = useLanguage();
  const payload = typeof item.payload === "string" ? JSON.parse(item.payload || "{}") : item.payload || {};
  const reportId = Number(payload.reportId);
  const file = useAuthedBlobUrl(
    Number.isInteger(reportId) && reportId > 0 ? `/api/reports/${reportId}/file` : "",
    !localPreviewUrl,
    t.reports.historyFailed
  );
  const previewUrl = localPreviewUrl || file.url;
  const type = localPreviewUrl ? localPreviewType : file.type;

  return (
    <div className="space-y-2 rounded-2xl bg-hayat-700 px-4 py-3 text-white shadow-sm">
      {previewUrl && type.startsWith("image/") ? (
        <img className="max-h-48 max-w-full rounded-xl object-contain" src={previewUrl} alt={item.content} />
      ) : previewUrl && type === "application/pdf" ? (
        <a className="flex min-h-[44px] items-center gap-2 text-white underline" href={previewUrl} target="_blank" rel="noopener noreferrer">
          <FileText size={22} aria-hidden="true" />{t.reports.openDocument}
        </a>
      ) : file.loading ? (
        <p role="status">{t.chat.readingDocument}</p>
      ) : (
        <span className="flex items-center gap-2"><FileText size={22} aria-hidden="true" />{item.content}</span>
      )}
      <p className="break-all text-sm">{item.content}</p>
    </div>
  );
}
