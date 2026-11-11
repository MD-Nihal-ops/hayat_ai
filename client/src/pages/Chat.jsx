import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Bot,
  Check,
  Clock3,
  Copy,
  FileUp,
  History,
  ImagePlus,
  MapPin,
  Mic,
  Plus,
  Pill,
  Send,
  Users,
  X
} from "lucide-react";
import ConversationHistory from "../components/ConversationHistory.jsx";
import Reports from "./Reports.jsx";
import ChatAttachmentPreview from "../components/ChatAttachmentPreview.jsx";
import ChatDocumentCard from "../components/ChatDocumentCard.jsx";
import PlacesCard from "../components/PlacesCard.jsx";
import SpecialistCard from "../components/SpecialistCard.jsx";
import ReviewTable from "../components/ReviewTable.jsx";
import RegisteredMedicineCard from "../components/RegisteredMedicineCard.jsx";
import SpeechControls from "../components/SpeechControls.jsx";
import { EMERGENCY_NUMBERS } from "../config/emergency.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAccessibility } from "../context/AccessibilityContext.jsx";
import PageSkeleton from "../components/PageSkeleton.jsx";
import { stopSpeech } from "../utils/speech.js";
import { groupFromQuestion } from "../utils/groupMatch.js";

const languageLocales = {
  en: "en-US",
  ar: "ar-SA",
  hi: "hi-IN",
  ml: "ml-IN"
};
const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

function messageTime(value, language) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString(language, { hour: "numeric", minute: "2-digit" });
}

function ChatHistoryPanel({ mobile, tab, onTabChange, conversations, activeId, onSelect, onNew, onRename, onDelete, onClose, t }) {
  return (
    <div className={`flex min-h-0 flex-col bg-white ${mobile ? "h-full w-[min(88vw,360px)] shadow-xl" : "w-72 shrink-0 rounded-xl border border-slate-200"}`}>
      <div className="flex items-center gap-1 border-b border-slate-100 p-3">
        <nav className="flex flex-1 gap-2" role="tablist" aria-label={t.chat.history}>
          {[
            ["history", t.chat.history],
            ["documents", t.navigation.reports]
          ].map(([key, label]) => (
            <button
              key={key}
              className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                tab === key ? "bg-hayat-700 text-white" : "text-slate-700 hover:bg-hayat-50"
              }`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        {mobile && tab === "documents" && (
          <button
            className="min-h-[44px] min-w-[44px] rounded-lg text-slate-700 hover:bg-slate-100"
            type="button"
            aria-label={t.chat.closeHistory}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      {tab === "history" ? (
        <ConversationHistory
          mobile={mobile}
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onNew={onNew}
          onRename={onRename}
          onDelete={onDelete}
          onClose={onClose}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <Reports />
        </div>
      )}
    </div>
  );
}

function ChatActionCard({ action, item, onComplete }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    title: action.params.title || "",
    medicineName: action.params.medicineName || "",
    time: action.params.time || "",
    date: action.params.date || "",
    dueDate: action.params.dueDate || "",
    place: action.params.place || "",
    notes: action.params.notes || ""
  });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [familyMessageLanguage, setFamilyMessageLanguage] = useState("");
  const [familyMessagePreview, setFamilyMessagePreview] = useState("");

  const labels = {
    add_reminder: t.chat.addReminder,
    add_appointment: t.chat.addAppointment,
    create_task: t.chat.createTask,
    share_report: t.chat.shareReport,
    family_message: t.chat.familyMessage,
    open_journey: t.chat.openJourney,
    prepare_visit: t.chat.prepareVisit,
    wellness_goal: t.wellness.actionSetGoal,
    family_challenge: t.wellness.actionFamilyChallenge
  };
  const actionLabel = labels[action.type] || t.chat.confirmAction;
  const sourceReport = item.payload?.sourceReports?.find((source) => source.reportId === action.params.reportId);

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function confirm() {
    if (action.type === "wellness_goal") {
      navigate("/explore/wellness#goals");
      onComplete();
      return;
    }
    if (action.type === "family_challenge") {
      navigate("/explore/wellness#family-challenges");
      onComplete();
      return;
    }
    setError("");
    try {
      if (action.type === "prepare_visit") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) throw new Error(t.chat.actionFailed);
        printWindow.opener = null;
        const heading = printWindow.document.createElement("h1");
        heading.textContent = t.chat.prepareVisit;
        const style = printWindow.document.createElement("style");
        style.textContent = "@page { margin: 12mm; } body { font: 11pt Arial, sans-serif; color: #111827; } h1 { font-size: 18pt; } h2 { font-size: 13pt; margin-top: 14px; } ul { margin-top: 4px; padding-inline-start: 20px; } li { margin-bottom: 4px; }";
        const summary = item.payload?.visitSummary || {};
        const sections = [
          ["documents", t.chat.visitDocuments, (entry) => {
            const values = (Array.isArray(entry.values) ? entry.values : []).slice(0, 5)
              .map((value) => `${value.name}: ${value.value} ${value.unit} (${value.status})`).join("; ");
            return `${entry.type} — ${entry.date}${values ? `: ${values}` : ""}`;
          }],
          ["readings", t.chat.visitReadings, (entry) => `${entry.name}: ${entry.value} ${entry.unit} (${entry.recordedAt})`],
          ["medicines", t.chat.visitMedicines, (entry) => `${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`],
          ["questions", t.chat.visitQuestions, (entry) => entry]
        ];
        const nodes = [style, heading];
        for (const [key, title, format] of sections) {
          const section = printWindow.document.createElement("section");
          const sectionTitle = printWindow.document.createElement("h2");
          sectionTitle.textContent = title;
          section.appendChild(sectionTitle);
          const list = printWindow.document.createElement("ul");
          for (const entry of (Array.isArray(summary[key]) ? summary[key] : []).slice(0, 10)) {
            const line = printWindow.document.createElement("li");
            line.textContent = format(entry);
            list.appendChild(line);
          }
          section.appendChild(list);
          nodes.push(section);
        }
        printWindow.document.body.replaceChildren(...nodes);
        printWindow.print();
        onComplete();
        return;
      }
      if (action.type === "open_journey") {
        navigate(`/family/journeys?event=${encodeURIComponent(action.params.eventKey)}`);
        onComplete();
        return;
      }
      if (action.type === "share_report" && !consent) {
        setError(t.chat.actionNeedsDetails);
        return;
      }
      setBusy(true);
      if (action.type === "add_reminder") {
        if (!values.medicineName.trim() || !values.time) throw new Error(t.chat.actionNeedsDetails);
        await axios.post("/api/care/reminders", { medicineName: values.medicineName.trim(), time: values.time });
      } else if (action.type === "add_appointment") {
        if (!values.title.trim() || !values.date || !values.time) throw new Error(t.chat.actionNeedsDetails);
        await axios.post("/api/care/appointments", {
          title: values.title.trim(), date: values.date, time: values.time,
          place: values.place.trim(), notes: values.notes.trim()
        });
      } else if (action.type === "create_task") {
        if (!values.title.trim()) throw new Error(t.chat.actionNeedsDetails);
        await axios.post("/api/tasks", { title: values.title.trim(), dueDate: values.dueDate });
      } else if (action.type === "share_report") {
        const { data: granted } = await axios.post("/api/consents", {
          action: "grant",
          dataCategories: ["health_report_values", "health_report_explanation"],
          resourceId: action.params.reportId,
          recipientType: "person",
          recipient: action.params.email,
          purpose: "family_report_sharing",
          optional: true
        });
        await axios.post("/api/shares", {
          email: action.params.email,
          reportId: action.params.reportId,
          includeOriginal: false,
          expiresAt: "",
          consentId: granted.consentId
        });
      }
      onComplete();
    } catch (actionError) {
      setError(actionError.response?.data?.error || actionError.message || t.chat.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function generateFamilyMessage() {
    setError("");
    if (!familyMessageLanguage) {
      setError(t.chat.actionNeedsDetails);
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post("/api/chat/family-message-preview", {
        email: action.params.email,
        reportId: action.params.reportId,
        language: familyMessageLanguage
      });
      setFamilyMessagePreview(data.message);
    } catch (previewError) {
      setError(previewError.response?.data?.detail || previewError.response?.data?.error || t.chat.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  function field(key, label, type = "text") {
    return (
      <label className="block space-y-1 text-sm" key={key}>
        <span>{label}</span>
        <input
          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900"
          type={type}
          value={values[key]}
          onChange={(event) => update(key, event.target.value)}
          required={key !== "dueDate"}
        />
      </label>
    );
  }

  if (action.type === "family_message") {
    return (
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-gray-900">
        <h4 className="font-semibold">{actionLabel}</h4>
        <p><strong>{t.chat.recipient}:</strong> {action.params.email}</p>
        <p>{sourceReport ? `${sourceReport.label}, ${sourceReport.date}` : `${t.chat.visitDocuments}: ${action.params.reportId}`}</p>
        <label className="block space-y-1 text-sm">
          <span>{t.chat.recipientLanguage}</span>
          <select
            className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-gray-900"
            value={familyMessageLanguage}
            onChange={(event) => {
              setFamilyMessageLanguage(event.target.value);
              setFamilyMessagePreview("");
            }}
          >
            <option value="">{t.chat.actionNeedsDetails}</option>
            <option value="en">{t.chat.languageEnglish}</option>
            <option value="ar">{t.chat.languageArabic}</option>
            <option value="hi">{t.chat.languageHindi}</option>
            <option value="ml">{t.chat.languageMalayalam}</option>
          </select>
        </label>
        <button
          className="min-h-[44px] rounded-lg border border-hayat-700 px-4 font-medium text-hayat-800 disabled:opacity-60"
          type="button"
          disabled={busy || !familyMessageLanguage}
          onClick={() => void generateFamilyMessage()}
        >
          {busy ? t.chat.previewLoading : t.chat.generatePreview}
        </button>
        {familyMessagePreview && (
          <>
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{familyMessagePreview}</p>
            <a
              className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 font-medium text-hayat-800 underline"
              href={`https://wa.me/?text=${encodeURIComponent(familyMessagePreview)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onComplete}
            >
              {t.chat.whatsappSend}
            </a>
          </>
        )}
        {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-gray-900">
      <h4 className="font-semibold">{actionLabel}</h4>
      {action.type === "add_reminder" && <div className="grid gap-3 sm:grid-cols-2">{field("medicineName", t.chat.medicineName)}{field("time", t.chat.time, "time")}</div>}
      {action.type === "add_appointment" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {field("title", t.chat.addAppointment)}{field("date", t.chat.appointmentDate, "date")}
          {field("time", t.chat.appointmentTime, "time")}{field("place", t.chat.place)}
        </div>
      )}
      {action.type === "create_task" && <div className="grid gap-3 sm:grid-cols-2">{field("title", t.chat.taskTitle)}{field("dueDate", t.chat.dueDate, "date")}</div>}
      {action.type === "share_report" && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <p><strong>{t.family.consentData}:</strong> {t.family.consentReportData}</p>
          <p><strong>{t.chat.visitDocuments}:</strong> {sourceReport ? `${sourceReport.label}, ${sourceReport.date}` : action.params.reportId}</p>
          <p><strong>{t.family.consentReceiver}:</strong> {action.params.email}</p>
          <p><strong>{t.family.consentPurpose}:</strong> {t.family.consentPurposeDescription}</p>
          <p><strong>{t.family.consentUse}:</strong> {t.family.consentUseDescription}</p>
          <p><strong>{t.family.consentOptional}:</strong> {t.family.consentOptionalDescription}</p>
          <p>{t.family.consentRevocation} <Link className="underline" to="/me/privacy/consents">{t.family.consentHistoryLink}</Link>.</p>
          <label className="flex min-h-[44px] items-start gap-2">
            <input className="mt-1" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>{t.chat.confirmShareConsent}</span>
          </label>
        </div>
      )}
      {action.type === "prepare_visit" && <p>{item.content}</p>}
      {action.type === "wellness_goal" && <p>{t.wellness.actionSetGoalBody}</p>}
      {action.type === "family_challenge" && <p>{t.wellness.actionFamilyChallengeBody}</p>}
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      <button
        className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white disabled:opacity-60"
        type="button"
        disabled={busy}
        onClick={() => void confirm()}
      >
        {busy ? t.chat.sending : ["wellness_goal", "family_challenge"].includes(action.type) ? t.wellness.openWellness : t.chat.confirmAction}
      </button>
    </section>
  );
}

export default function Chat() {
  const { t, language } = useLanguage();
  const { preferences, setPreference } = useAccessibility();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState(() => searchParams.get("drawer") === "documents" ? "documents" : "history");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [retryMessage, setRetryMessage] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [uploadState, setUploadState] = useState(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState({});
  const [multiplePatientReports, setMultiplePatientReports] = useState({});
  const [demoVisible, setDemoVisible] = useState(false);
  const easyRead = preferences.easyRead;
  const [completedActions, setCompletedActions] = useState({});
  const [demoValues, setDemoValues] = useState([
    { name: "Heart rate", value: 76, unit: "bpm", printedRange: { min: null, max: null } },
    { name: "Sample value", value: 11.2, unit: "g/dL", printedRange: { min: 12, max: 15 } }
  ]);
  const scrollContainer = useRef(null);
  const historyButtonRef = useRef(null);
  const historyDrawerRef = useRef(null);
  const historyDrawerWasOpenRef = useRef(false);
  const messageInputRef = useRef(null);
  const attachmentButtonRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const uploadRetryRef = useRef(null);
  const copyTimerRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const messageSentRef = useRef("");

  useEffect(() => {
    if (searchParams.get("drawer") === "documents") {
      setDrawerTab("documents");
      setIsHistoryDrawerOpen(window.matchMedia("(max-width: 767px)").matches);
    } else {
      setDrawerTab("history");
      if (drawerTab === "documents" && window.matchMedia("(max-width: 767px)").matches) {
        setIsHistoryDrawerOpen(false);
      }
    }
  }, [drawerTab, searchParams]);

  function changeDrawerTab(tab) {
    setDrawerTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "documents") nextParams.set("drawer", "documents");
    else nextParams.delete("drawer");
    setSearchParams(nextParams, { replace: true });
  }

  useEffect(() => {
    if (!isHistoryDrawerOpen) {
      if (historyDrawerWasOpenRef.current) historyButtonRef.current?.focus();
      historyDrawerWasOpenRef.current = false;
      return undefined;
    }

    historyDrawerWasOpenRef.current = true;
    const drawer = historyDrawerRef.current;
    const focusable = () => [...(drawer?.querySelectorAll(focusableSelector) || [])];
    focusable()[0]?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsHistoryDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        drawer?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isHistoryDrawerOpen]);

  useEffect(() => {
    if (!isAttachmentMenuOpen) return undefined;
    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsAttachmentMenuOpen(false);
      attachmentButtonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isAttachmentMenuOpen]);
  const SpeechRecognition = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const uploadOnArrivalRef = useRef(searchParams.get("upload") === "1");

  const refreshConversations = useCallback(async () => {
    const response = await axios.get("/api/conversations");
    setConversations(response.data);
    return response.data;
  }, []);

  const createConversation = useCallback(async () => {
    const { data } = await axios.post("/api/conversations");
    setConversations((current) => [data, ...current]);
    navigate(`/chat/${data.id}`);
    setIsHistoryDrawerOpen(false);
  }, [navigate]);

  useEffect(() => {
    let active = true;
    async function loadConversation() {
      setIsLoadingHistory(true);
      setError("");
      try {
        const list = await refreshConversations();
        if (!active) return;
        if (!conversationId) {
          const currentParams = new URLSearchParams(window.location.search);
          const queryParams = new URLSearchParams();
          if (uploadOnArrivalRef.current || currentParams.get("upload") === "1") {
            queryParams.set("upload", "1");
          }
          if (currentParams.get("drawer") === "documents") {
            queryParams.set("drawer", "documents");
          }
          const initialMessage = currentParams.get("message");
          if (initialMessage) queryParams.set("message", initialMessage);
          const queryString = queryParams.toString();
          const query = queryString ? `?${queryString}` : "";
          if (list.length) {
            navigate(`/chat/${list[0].id}${query}`, { replace: true });
          } else {
            const { data } = await axios.post("/api/conversations");
            if (active) {
              setConversations([data]);
              navigate(`/chat/${data.id}${query}`, { replace: true });
            }
          }
          return;
        }

        const conversation = list.find((item) => String(item.id) === String(conversationId));
        if (!conversation) {
          setError(t.chat.conversationNotFound);
          setActiveConversation(null);
          setMessages([]);
          return;
        }
        setActiveConversation(conversation);
        const { data } = await axios.get(`/api/conversations/${encodeURIComponent(conversationId)}/messages`);
        if (active) setMessages(data);
      } catch (loadError) {
        if (active) setError(loadError.response?.data?.error || t.chat.loadFailed);
      } finally {
        if (active) setIsLoadingHistory(false);
      }
    }
    void loadConversation();
    return () => {
      active = false;
      recognitionRef.current?.stop();
      stopSpeech();
      window.clearTimeout(copyTimerRef.current);
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [conversationId, navigate, refreshConversations, t.chat.conversationNotFound, t.chat.loadFailed]);

  useEffect(() => {
    const initialMessage = searchParams.get("message");
    if (!initialMessage) {
      messageSentRef.current = "";
      return;
    }
    if (isLoadingHistory || !conversationId || messageSentRef.current === initialMessage) return;
    messageSentRef.current = initialMessage;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("message");
    setSearchParams(nextParams, { replace: true });
    void sendQuestion(initialMessage);
  }, [conversationId, isLoadingHistory, searchParams, setSearchParams]);

  useEffect(() => {
    scrollContainer.current?.scrollTo({
      top: scrollContainer.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isSending, isLoadingHistory]);

  useEffect(() => {
    if (searchParams.get("upload") === "1" && !isLoadingHistory && conversationId) {
      setIsAttachmentMenuOpen(true);
      fileInputRef.current?.click();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("upload");
      setSearchParams(nextParams, { replace: true });
    }
  }, [conversationId, isLoadingHistory, searchParams, setSearchParams]);

  async function persistSpecialMessage(messageType, reportId, targetLanguage = language, content = "", kind, targetConversationId = conversationId, documentDate = null) {
    if (!targetConversationId) return null;
    const { data } = await axios.post(`/api/conversations/${encodeURIComponent(targetConversationId)}/messages`, {
      role: messageType === "attachment" ? "user" : "assistant",
      content,
      language: targetLanguage,
      messageType,
      kind,
      payload: reportId ? { reportId: Number(reportId), language: targetLanguage, documentDate } : {}
    });
    setMessages((current) => [...current, data]);
    return data;
  }

  async function uploadDocument(file, existingMessageId = null) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type) &&
      ["jpg", "jpeg", "png", "pdf"].includes(extension);
    if (!validType) {
      setError(t.chat.invalidFileType);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t.chat.fileTooLarge);
      return;
    }
    setError("");
    let messageId = existingMessageId;
    try {
      let targetConversationId = conversationId;
      if (!targetConversationId) {
        const { data: conversation } = await axios.post("/api/conversations");
        targetConversationId = conversation.id;
        setConversations((current) => [conversation, ...current]);
        setActiveConversation(conversation);
        navigate(`/chat/${conversation.id}`);
      }
      if (!messageId) {
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
        if (previewUrl) previewUrlsRef.current.push(previewUrl);
        const saved = await persistSpecialMessage("attachment", null, language, file.name, undefined, targetConversationId);
        messageId = saved?.id;
        if (previewUrl && messageId) {
          setAttachmentPreviews((current) => ({ ...current, [messageId]: { url: previewUrl, type: file.type } }));
        }
      }
      uploadRetryRef.current = { file, messageId };
      setUploadState({ messageId, busy: true, error: "" });
      const formData = new FormData();
      formData.append("report", file);
      const { data } = await axios.post("/api/reports/upload", formData, { timeout: 120000 });
      setMultiplePatientReports((current) => ({ ...current, [data.reportId]: data.multiplePatients === true }));
      if (messageId) {
        const { data: updatedAttachment } = await axios.patch(
          `/api/conversations/${encodeURIComponent(targetConversationId)}/messages/${encodeURIComponent(messageId)}`,
          { reportId: Number(data.reportId) }
        );
        setMessages((current) => current.map((item) =>
          String(item.id) === String(messageId) ? updatedAttachment : item
        ));
        const previewUrl = attachmentPreviews[messageId]?.url;
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== previewUrl);
          setAttachmentPreviews((current) => {
            const next = { ...current };
            delete next[messageId];
            return next;
          });
        }
      }
      await persistSpecialMessage("review", data.reportId, language, "", undefined, targetConversationId, data.documentDate);
      setUploadState(null);
      uploadRetryRef.current = null;
      const list = await refreshConversations();
      setConversations(list);
    } catch (uploadError) {
      const timedOut = uploadError.code === "ECONNABORTED" ||
        uploadError.code === "ETIMEDOUT" ||
        uploadError.response?.data?.detail === "AI request timed out";
      const detail = timedOut
        ? t.upload.timedOut
        : uploadError.response?.data?.detail || uploadError.message || t.upload.failed;
      setUploadState({ messageId, busy: false, error: detail });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  async function sendQuestion(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending || trimmedQuestion.length > 1000 || !conversationId) return;
    setIsSending(true);
    setError("");
    setRetryMessage("");
    try {
      const { data } = await axios.post("/api/chat", {
        message: trimmedQuestion,
        language,
        easyRead,
        conversationId: Number(conversationId)
      });
      const createdAt = new Date().toISOString();
      const userMessage = {
        id: `local-user-${createdAt}`,
        role: "user",
        content: trimmedQuestion,
        language,
        kind: "user",
        category: null,
        sources: [],
        createdAt
      };
      const assistantMessage = {
        id: `local-assistant-${createdAt}`,
        role: "assistant",
        content: data.kind === "answer" ? data.answer : "",
        language,
        kind: data.kind,
        category: data.category || null,
        sources: data.sources || [],
        suggestions: data.suggestions || [],
        payload: data.kind === "find_places"
          ? { intent: data.intent }
          : data.kind === "specialist"
            ? { specialties: data.specialties }
            : {
              sources: data.sources || [],
              sourceReports: data.sourceReports || [],
              medicineCards: data.medicineCards || [],
              medicineSource: data.medicineSource || null,
              visitSummary: data.visitSummary || null,
              proposedActions: data.proposedActions || [],
              wellnessLinks: data.wellnessLinks === true,
              placeIntent: data.placeIntent || null,
              placeResults: data.placeResults || [],
              placeSearchError: data.placeSearchError === true,
              specialties: data.specialties || [],
              familyName: data.familyName || null,
              familyNotShared: data.familyNotShared === true
            },
        clarify: data.kind === "specialist" ? data.clarify : null,
        createdAt
      };
      setMessages((current) => [...current, userMessage, assistantMessage]);
      setMessageDraft("");
      try {
        const list = await refreshConversations();
        setConversations(list);
        const latest = list.find((item) => String(item.id) === String(conversationId));
        if (latest) setActiveConversation(latest);
      } catch (refreshError) {
        setError(refreshError.response?.data?.error || t.chat.loadFailed);
      }

    } catch (sendError) {
      setError(sendError.response?.status === 429
        ? t.chat.rateLimit
        : sendError.response?.status === 503
          ? t.chat.busyMessage
          : sendError.response?.data?.error || t.chat.sendFailed);
      setRetryMessage(trimmedQuestion);
    } finally {
      setIsSending(false);
    }
  }

  function findSpecialtyPlaces(specialty) {
    const createdAt = new Date().toISOString();
    setMessages((current) => [...current, {
      id: `local-places-${createdAt}`,
      role: "assistant",
      content: t.chat.findPlacesLeadIn,
      language,
      kind: "find_places",
      payload: {
        intent: {
          type: "find_place",
          placeType: "any",
          nameQuery: null,
          specialty,
          near: "me",
          emergency: false,
          openNow: false,
          wheelchair: false
        }
      },
      createdAt
    }]);
  }

  async function renameConversation(conversation) {
    const title = window.prompt(t.chat.renamePrompt, conversation.title);
    if (title === null || !title.trim()) return;
    try {
      await axios.patch(`/api/conversations/${conversation.id}`, { title: title.trim() });
      const list = await refreshConversations();
      setConversations(list);
      setActiveConversation(list.find((item) => String(item.id) === String(conversationId)) || null);
    } catch (renameError) {
      setError(renameError.response?.data?.error || t.chat.renameFailed);
    }
  }

  async function deleteConversation(conversation) {
    if (!window.confirm(t.chat.deleteConfirm)) return;
    try {
      await axios.delete(`/api/conversations/${conversation.id}`);
      const list = (await refreshConversations()).filter((item) => String(item.id) !== String(conversation.id));
      setConversations(list);
      if (String(conversation.id) === String(conversationId)) {
        if (list.length) navigate(`/chat/${list[0].id}`, { replace: true });
        else await createConversation();
      }
    } catch (deleteError) {
      setError(deleteError.response?.data?.error || t.chat.deleteFailed);
    }
  }

  async function copyAnswer(messageId, answer) {
    try {
      await navigator.clipboard.writeText(answer);
      setCopiedMessageId(messageId);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      setError(t.chat.copyFailed);
    }
  }

  function toggleVoiceTyping() {
    if (!SpeechRecognition) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = languageLocales[language] || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setMessageDraft(transcript.slice(0, 1000));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function categoryLabel(category) {
    if (category === "report_answer") return t.chat.fromReports;
    if (category === "general_info") return t.chat.generalInfo;
    if (category === "app_help") return t.chat.appHelp;
    return "";
  }

  function renderAssistantMessage(item) {
    if (item.kind === "specialist") {
      return (
        <SpecialistCard
          item={item}
          onFindPlaces={findSpecialtyPlaces}
          onAskDoctorQuestion={() => void sendQuestion(t.chat.starters.doctorQuestions)}
          disabled={isSending}
        />
      );
    }
    if (item.kind === "find_places") {
      return <PlacesCard item={item} />;
    }
    if (item.kind === "explanation_followup") {
      return (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
          <p>{item.content || t.chat.explainMore}</p>
          <div className="flex flex-wrap gap-2">
            {[t.chat.starters.outsideRange, t.chat.starters.medicalWord, t.chat.starters.doctorQuestions].map((suggestion) => (
              <button
                className="min-h-[44px] rounded-lg border border-hayat-100 bg-hayat-50 px-3 py-2 text-start text-sm text-slate-800"
                key={suggestion}
                type="button"
                disabled={isSending}
                onClick={() => void sendQuestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (item.kind === "emergency") {
      return (
        <div className="space-y-2 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900" role="alert">
          <p>
            {t.chat.emergencyMessage
              .replace("{ambulance}", EMERGENCY_NUMBERS.ambulance)
              .replace("{police}", EMERGENCY_NUMBERS.police)}
          </p>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-red-800 underline" to="/sos">
            {t.chat.openSos}
          </Link>
        </div>
      );
    }
    if (item.kind === "support") {
      return (
        <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-gray-900" role="status">
          <p>
            {t.chat.supportMessage
              .replace("{ambulance}", EMERGENCY_NUMBERS.ambulance)
              .replace("{police}", EMERGENCY_NUMBERS.police)}
          </p>
          <Link className="inline-flex min-h-[44px] items-center font-medium text-hayat-700 underline" to="/sos">
            {t.chat.openSos}
          </Link>
        </div>
      );
    }
    if (item.kind !== "answer") {
      return item.content ? <p className="rounded-2xl bg-white p-4 text-slate-800 shadow-sm">{item.content}</p> : null;
    }

    const itemIndex = messages.findIndex((message) => message.id === item.id);
    const precedingUserMessage = itemIndex > 0
      ? messages.slice(0, itemIndex).reverse().find((message) => message.role === "user")
      : null;
    const foodSearch = ["restaurant", "cafe", "meal_plan"].includes(item.payload?.placeIntent?.category) ||
      item.payload?.placeIntent?.placeType === "food";
    const group = foodSearch ? null : groupFromQuestion(precedingUserMessage?.content);
    const badge = categoryLabel(item.category);
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-800">
        {badge && (
          <span className="inline-flex rounded-full bg-hayat-50 px-3 py-1 text-xs font-semibold leading-5 text-hayat-800">
            {badge}
          </span>
        )}
        {!foodSearch && <p className="whitespace-pre-wrap">{item.content}</p>}
        {item.payload?.familyNotShared && (
          <Link className="inline-flex min-h-[44px] items-center text-hayat-700 underline" to="/family">
            {t.chat.familyNotShared} {t.chat.openFamily}
          </Link>
        )}
        {group && (
          <div className="border-t border-slate-100 pt-2 text-sm">
            <p>{t.chat.groupNotAffiliated}</p>
            <Link
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-hayat-700 px-4 font-medium text-hayat-800 underline"
              to={`/explore/providers/${encodeURIComponent(group.id)}`}
            >
              {t.chat.viewProvider}
            </Link>
          </div>
        )}
        {item.payload?.sources?.length > 0 && (
          <div className="border-t border-slate-100 pt-2 text-sm leading-6">
            <strong>{t.chat.sourceLabel}</strong>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.payload.sources.map((source) => (
                <span key={source.key} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-hayat-900">
                  {source.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {item.payload?.sourceReports?.length > 0 && (
          <div className="border-t border-slate-100 pt-2 text-sm leading-6">
            <strong>{t.chat.basedOn}</strong>
            <ul className="mt-1 list-inside list-disc">
              {item.payload.sourceReports.map((source) => (
                <li key={source.reportId}>
                  <Link className="text-hayat-700 underline" to={`/chat?drawer=documents&reportId=${encodeURIComponent(source.reportId)}`}>
                    {source.label}, {source.date}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {item.payload?.medicineCards?.map((card, index) => (
          <RegisteredMedicineCard
            key={`${card.query}-${index}`}
            speechId={`chat-medicine-${item.id}-${index}`}
            query={card.query}
            result={card.result}
            source={item.payload.medicineSource}
          />
        ))}
        {item.payload?.placeIntent && (
          <PlacesCard item={{
            ...item,
            payload: {
              intent: item.payload.placeIntent,
              results: item.payload.placeResults || [],
              searchError: item.payload.placeSearchError === true
            }
          }} />
        )}
        {item.payload?.wellnessLinks === true && (
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 text-hayat-900 underline" to="/explore?cat=wellness">{t.wellness.wellnessCentres}</Link>
            <Link className="inline-flex min-h-[44px] items-center rounded-lg border border-hayat-700 px-4 py-2 text-hayat-900 underline" to="/explore?cat=restaurant">{t.wellness.healthyFood}</Link>
          </div>
        )}
        {item.payload?.specialties?.length > 0 && (
          <SpecialistCard
            item={{ specialties: item.payload.specialties }}
            onFindPlaces={findSpecialtyPlaces}
            onAskDoctorQuestion={() => void sendQuestion(t.chat.starters.doctorQuestions)}
            disabled={isSending}
          />
        )}
        {item.payload?.proposedActions?.map((action, index) => {
          const actionKey = `${item.id}-${index}`;
          if (completedActions[actionKey]) {
            return <p className="text-sm font-medium text-emerald-800" key={actionKey}>{t.chat.actionConfirmed}</p>;
          }
          return (
            <ChatActionCard
              key={actionKey}
              action={action}
              item={item}
              onComplete={() => setCompletedActions((current) => ({ ...current, [actionKey]: true }))}
            />
          );
        })}
        <div className="flex flex-wrap gap-1">
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-teal-50 hover:text-hayat-800"
            type="button"
            aria-label={t.chat.tooltipCopy}
            title={t.chat.tooltipCopy}
            onClick={() => void copyAnswer(item.id, item.content)}
          >
            {copiedMessageId === item.id
              ? <Check size={19} aria-hidden="true" />
              : <Copy size={19} aria-hidden="true" />}
          </button>
        </div>
        {item.suggestions?.length > 0 && (
          <div className="border-t border-slate-100 pt-2">
            <p className="mb-1 text-sm text-slate-600">{t.chat.suggestions}</p>
            <div className="flex flex-wrap gap-2">
              {item.suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  className="min-h-[44px] rounded-full border border-teal-100 bg-teal-50 px-3 py-2 text-start text-sm leading-5 text-slate-800 hover:bg-teal-100"
                  type="button"
                  key={`${item.id}-${index}`}
                  disabled={isSending}
                  onClick={() => void sendQuestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      className="relative mx-auto flex h-[calc(100dvh-11rem)] min-h-[460px] max-w-[1440px] gap-3 text-gray-900 md:h-[calc(100dvh-4rem)] md:gap-4"
      dir={language === "ar" ? "rtl" : "ltr"}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
      }}
      onDrop={(event) => {
        if (event.dataTransfer.files.length) {
          event.preventDefault();
          setIsDragging(false);
          void uploadDocument(event.dataTransfer.files[0]);
        }
      }}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-hayat-700 bg-teal-50/90 text-lg font-semibold text-hayat-900">
          {t.chat.dropDocument}
        </div>
      )}
      <div className="hidden min-h-0 md:flex">
        <ChatHistoryPanel
          tab={drawerTab}
          onTabChange={changeDrawerTab}
          conversations={conversations}
          activeId={conversationId}
          onSelect={(id) => navigate(`/chat/${id}`)}
          onNew={() => void createConversation()}
          onRename={(conversation) => void renameConversation(conversation)}
          onDelete={(conversation) => void deleteConversation(conversation)}
          onClose={() => setIsHistoryDrawerOpen(false)}
          t={t}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <header className="flex min-h-[64px] items-center gap-2 border-b border-slate-100 bg-white px-3 py-2 md:px-5">
          <button
            ref={historyButtonRef}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-teal-50 md:hidden"
            type="button"
            aria-label={t.chat.history}
            aria-expanded={isHistoryDrawerOpen}
            aria-controls="chat-history-drawer"
            title={t.chat.history}
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            <History size={21} aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hayat-100 text-hayat-900">
              <Bot size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">{t.chat.hayat}</h1>
              <p className="truncate text-xs text-slate-500">{activeConversation?.title || t.chat.welcomeTitle}</p>
            </div>
          </div>
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-hayat-800 hover:bg-teal-50 md:hidden"
            type="button"
            aria-label={t.chat.newChat}
            title={t.chat.newChat}
            onClick={() => void createConversation()}
          >
            <Plus size={22} aria-hidden="true" />
          </button>
        </header>

        {error && (
          <div className="mx-3 mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950 md:mx-5" role="alert">
            <p>{error}</p>
            {retryMessage && (
              <button
                className="mt-2 min-h-[44px] rounded-lg border border-amber-700 bg-white px-4 py-2 font-medium text-amber-950"
                type="button"
                onClick={() => void sendQuestion(retryMessage)}
                disabled={isSending}
              >
                {t.chat.retry}
              </button>
            )}
          </div>
        )}

        <div
          ref={scrollContainer}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5 md:px-8"
          aria-live="polite"
        >
          {isLoadingHistory && <PageSkeleton label={t.chat.loading} rows={2} />}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="mx-auto max-w-2xl space-y-5 pt-4">
              <section className="space-y-2 rounded-xl border border-hayat-100 bg-hayat-50 p-4 text-slate-800">
                <h2 className="font-semibold">{t.chat.whyHayatTitle}</h2>
                <ul className="list-inside list-disc space-y-1 text-sm leading-6">
                  {[1, 2, 3, 4].map((point) => <li key={point}>{t.chat[`whyHayatPoint${point}`]}</li>)}
                </ul>
              </section>
              <article className="me-auto max-w-[95%] space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-hayat-800">
                    <Bot size={16} aria-hidden="true" />
                  </span>
                  <span className="font-semibold">{t.chat.hayat}</span>
                  <time dateTime={new Date().toISOString()}>{messageTime(new Date(), language)}</time>
                </div>
                <p className="rounded-xl border border-slate-200 bg-white p-4 text-base leading-7 text-slate-800">
                  {t.chat.welcome}
                </p>
              </article>
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <button
                  className="flex min-h-[96px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-start text-gray-900 transition-colors hover:border-hayat-700 hover:bg-hayat-50"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="mt-1 shrink-0 text-hayat-900" size={22} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.chat.emptyActions.understandDocument.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-700">{t.chat.emptyActions.understandDocument.hint}</span>
                  </span>
                </button>
                <button
                  className="flex min-h-[96px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-start text-gray-900 transition-colors hover:border-hayat-700 hover:bg-hayat-50"
                  type="button"
                  onClick={() => {
                    const starter = t.chat.starters.medicineQuestion;
                    setMessageDraft(starter);
                    requestAnimationFrame(() => {
                      messageInputRef.current?.focus();
                      messageInputRef.current?.setSelectionRange(starter.length, starter.length);
                    });
                  }}
                >
                  <Pill className="mt-1 shrink-0 text-hayat-900" size={22} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.chat.emptyActions.medicineInfo.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-700">{t.chat.emptyActions.medicineInfo.hint}</span>
                  </span>
                </button>
                <button
                  className="flex min-h-[96px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-start text-gray-900 transition-colors hover:border-hayat-700 hover:bg-hayat-50"
                  type="button"
                  onClick={() => navigate("/explore")}
                >
                  <MapPin className="mt-1 shrink-0 text-hayat-900" size={22} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.chat.emptyActions.findCare.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-700">{t.chat.emptyActions.findCare.hint}</span>
                  </span>
                </button>
                <button
                  className="flex min-h-[96px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-start text-gray-900 transition-colors hover:border-hayat-700 hover:bg-hayat-50"
                  type="button"
                  onClick={() => navigate("/family")}
                >
                  <Users className="mt-1 shrink-0 text-hayat-900" size={22} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.chat.emptyActions.helpFamily.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-700">{t.chat.emptyActions.helpFamily.hint}</span>
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="min-h-[44px] rounded-lg border border-hayat-100 bg-white px-4 py-2 text-start text-sm leading-5 text-slate-800 transition-colors hover:bg-hayat-50"
                  type="button"
                  onClick={() => setDemoVisible(true)}
                >
                  {t.chat.demoStarter}
                </button>
              </div>
            </div>
          )}
          {messages.map((item) => (
            <article
              className={`${item.role === "user" ? "ms-auto max-w-[90%]" : "me-auto max-w-[95%]"} space-y-1`}
              key={item.id}
            >
              <div className={`flex items-center gap-2 px-1 text-xs text-slate-500 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                {item.role === "assistant" && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-hayat-800">
                    <Bot size={16} aria-hidden="true" />
                  </span>
                )}
                <span className="font-semibold">{item.role === "user" ? t.chat.you : t.chat.hayat}</span>
                <time dateTime={item.createdAt}>{messageTime(item.createdAt, language)}</time>
              </div>
              {item.role === "user" ? (
                item.messageType === "attachment" ? (
                  <ChatAttachmentPreview
                    item={item}
                    localPreviewUrl={attachmentPreviews[item.id]?.url}
                    localPreviewType={attachmentPreviews[item.id]?.type}
                  />
                ) : (
                  <p className="whitespace-pre-wrap rounded-xl rounded-ee-sm bg-hayat-700 px-4 py-3 text-base leading-7 text-white">
                    {item.content}
                  </p>
                )
              ) : ["review", "explanation"].includes(item.messageType) ? (
                <ChatDocumentCard
                  item={item}
                  conversationId={conversationId}
                  multiplePatients={multiplePatientReports[Number(item.payload?.reportId)] === true}
                  onPersist={(type, reportId, targetLanguage, content, kind) =>
                    persistSpecialMessage(type, reportId, targetLanguage, content, kind)}
                />
              ) : renderAssistantMessage(item)}
              {item.role === "assistant" && !["review", "explanation"].includes(item.messageType) && (
                <SpeechControls
                  messageId={`chat-${item.id}`}
                  text={item.content}
                  language={item.language || language}
                />
              )}
              {uploadState?.messageId === item.id && (
                <div className={`mt-2 rounded-lg p-3 ${uploadState.busy ? "bg-white text-slate-700" : "border border-amber-300 bg-amber-50 text-amber-950"}`} role={uploadState.busy ? "status" : "alert"}>
                  {uploadState.busy ? t.chat.readingDocument : (
                    <>
                      <p>{uploadState.error}</p>
                      <button
                        className="mt-2 min-h-[44px] rounded-lg border border-amber-700 bg-white px-4 font-medium text-amber-950"
                        type="button"
                        onClick={() => {
                          const retry = uploadRetryRef.current;
                          if (retry) void uploadDocument(retry.file, retry.messageId);
                        }}
                      >
                        {t.chat.retry}
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
          {demoVisible && (
            <article className="me-auto max-w-[95%] space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Bot size={16} aria-hidden="true" /><span className="font-semibold">{t.chat.hayat}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-gray-900">
                <p className="mb-3 text-sm text-slate-600">{t.upload.demoDisclosure}</p>
                <ReviewTable values={demoValues} onChange={setDemoValues} multiplePatients={false} />
              </div>
            </article>
          )}
          {isSending && (
            <div className="me-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-600" role="status">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-hayat-800">
                <Bot size={16} aria-hidden="true" />
              </span>
              <span>{t.chat.typing}</span>
              <Clock3 size={15} className="animate-pulse" aria-hidden="true" />
            </div>
          )}
        </div>

        <footer className="border-t border-slate-100 bg-white/90 px-3 pb-1 pt-2 text-center text-xs leading-5 text-slate-500 md:px-5">
          {t.chat.disclaimer}
          <p>{t.chat.voiceNote}</p>
        </footer>
        <label className="block px-3 pt-2 text-xs font-medium text-slate-700" htmlFor="chat-message">
          {t.chat.messageLabel}
        </label>
        <form
          className="relative flex shrink-0 items-end gap-1 border-t border-slate-100 bg-white px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:px-4 md:pb-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(messageDraft);
          }}
        >
          <div id="chat-attachment-menu" hidden={!isAttachmentMenuOpen} className="absolute bottom-full start-2 z-20 mb-2 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-slate-800 hover:bg-teal-50"
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <ImagePlus size={17} aria-hidden="true" />
                {t.chat.uploadFile}
              </button>
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-slate-800 hover:bg-teal-50"
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  cameraInputRef.current?.click();
                }}
              >
                <ImagePlus size={17} aria-hidden="true" />
                {t.chat.takePhoto}
              </button>
          </div>
          <input ref={fileInputRef} className="hidden" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => void uploadDocument(event.target.files?.[0])} />
          <input ref={cameraInputRef} className="hidden" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" capture="environment" onChange={(event) => void uploadDocument(event.target.files?.[0])} />
          <button
            ref={attachmentButtonRef}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-teal-50 hover:text-hayat-800"
            type="button"
            aria-label={t.chat.attach}
            aria-controls="chat-attachment-menu"
            title={t.chat.attach}
            aria-expanded={isAttachmentMenuOpen}
            onClick={() => setIsAttachmentMenuOpen((open) => !open)}
          >
            {isAttachmentMenuOpen ? <X size={21} aria-hidden="true" /> : <Plus size={21} aria-hidden="true" />}
          </button>
          <textarea
            ref={messageInputRef}
            id="chat-message"
            className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-gray-900 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value.slice(0, 1000))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void sendQuestion(messageDraft);
              }
            }}
            maxLength={1000}
            rows={1}
            aria-label={t.chat.messageLabel}
            placeholder={t.chat.messagePlaceholder}
          />
          <span className="hidden self-center text-xs text-slate-500 sm:inline">
            {t.chat.characterCount.replace("{count}", String(messageDraft.length))}
          </span>
          {SpeechRecognition && (
            <button
              className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full ${
                isListening ? "bg-teal-100 text-hayat-800" : "text-slate-600 hover:bg-teal-50 hover:text-hayat-800"
              }`}
              type="button"
              onClick={toggleVoiceTyping}
              aria-label={isListening ? t.chat.stopListening : t.chat.mic}
              title={isListening ? t.chat.stopListening : t.chat.mic}
            >
              <Mic size={20} aria-hidden="true" />
            </button>
          )}
          <button
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-hayat-700 text-white hover:bg-hayat-800 disabled:opacity-50"
            type="submit"
            aria-label={t.chat.send}
            title={t.chat.send}
            disabled={isSending || !messageDraft.trim()}
          >
            <Send size={19} aria-hidden="true" />
          </button>
        </form>
        <div className="bg-white px-3 pb-1 text-center text-[11px] leading-4 text-slate-500 sm:hidden">
          {t.chat.characterCount.replace("{count}", String(messageDraft.length))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 pb-2 text-xs text-slate-600">
          <p>{t.chat.privacyNote}</p>
          <label className="inline-flex min-h-[44px] items-center gap-2">
            <input type="checkbox" checked={easyRead} onChange={(event) => void setPreference("easyRead", event.target.checked)} />
            {t.chat.easyRead}
          </label>
        </div>
      </div>

      <div className={isHistoryDrawerOpen ? "fixed inset-0 z-50 flex md:hidden" : "hidden"} role="presentation">
          <button
            className="absolute inset-0 bg-slate-950/30"
            type="button"
            aria-label={t.chat.closeHistory}
            onClick={() => setIsHistoryDrawerOpen(false)}
          />
          <div
            ref={historyDrawerRef}
            id="chat-history-drawer"
            className="relative z-10 h-full"
            role="dialog"
            aria-modal="true"
            aria-label={drawerTab === "documents" ? t.navigation.reports : t.chat.history}
            tabIndex={-1}
          >
            <ChatHistoryPanel
              mobile
              tab={drawerTab}
              onTabChange={changeDrawerTab}
              conversations={conversations}
              activeId={conversationId}
              onSelect={(id) => navigate(`/chat/${id}`)}
              onNew={() => void createConversation()}
              onRename={(conversation) => void renameConversation(conversation)}
              onDelete={(conversation) => void deleteConversation(conversation)}
              onClose={() => setIsHistoryDrawerOpen(false)}
              t={t}
            />
          </div>
      </div>
    </section>
  );
}
