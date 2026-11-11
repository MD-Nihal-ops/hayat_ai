import { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";

function dayGroup(value, language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlier";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const localDay = (item) => `${item.getFullYear()}-${item.getMonth()}-${item.getDate()}`;
  if (localDay(date) === localDay(today)) return "today";
  if (localDay(date) === localDay(yesterday)) return "yesterday";
  return "earlier";
}

export default function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  mobile = false,
  onClose
}) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const filtered = useMemo(() => conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.trim().toLowerCase())
  ), [conversations, search]);
  const groups = ["today", "yesterday", "earlier"];

  return (
    <aside
      className={`flex min-h-0 flex-col bg-white ${mobile ? "h-full w-[min(88vw,360px)] shadow-xl" : "w-72 shrink-0 rounded-xl border border-slate-200"}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && openMenuId !== null) {
          event.preventDefault();
          event.stopPropagation();
          setOpenMenuId(null);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4">
        <h2 id={mobile ? "chat-history-title" : undefined} className="text-lg font-semibold text-slate-900">{t.chat.history}</h2>
        {mobile && (
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label={t.chat.closeHistory}
            title={t.chat.closeHistory}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="space-y-3 p-3">
        <button
          type="button"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-hayat-700 px-4 py-2 font-semibold text-white hover:bg-hayat-800"
          onClick={onNew}
        >
          <Plus size={18} aria-hidden="true" />
          {t.chat.newChat}
        </button>
        <input
          type="search"
          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-gray-900 placeholder:text-slate-500"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.chat.searchConversations}
          aria-label={t.chat.searchConversations}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-3">
        {groups.map((group) => {
          const items = filtered.filter((conversation) => dayGroup(conversation.updatedAt, language) === group);
          if (!items.length) return null;
          return (
            <section key={group} aria-label={t.chat[group]}>
              <h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.chat[group]}</h3>
              <ul className="space-y-1">
                {items.map((conversation) => (
                  <li className="relative" key={conversation.id}>
                    <button
                      type="button"
                      className={`w-full rounded-lg px-3 py-2 pe-12 text-start hover:bg-hayat-50 ${
                        String(activeId) === String(conversation.id) ? "bg-hayat-50 text-hayat-900" : "text-slate-800"
                      }`}
                      onClick={() => {
                        onSelect(conversation.id);
                        onClose?.();
                      }}
                    >
                      <span className="block truncate text-sm font-medium">{conversation.title}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {conversation.lastMessagePreview || t.chat.emptyConversation}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="absolute end-1 top-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-white"
                      aria-label={t.chat.conversationMenu}
                      title={t.chat.conversationMenu}
                      aria-expanded={openMenuId === conversation.id}
                      aria-controls={`conversation-menu-${conversation.id}`}
                      onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)}
                    >
                      <MoreHorizontal size={19} aria-hidden="true" />
                    </button>
                    <div id={`conversation-menu-${conversation.id}`} hidden={openMenuId !== conversation.id} className="absolute end-2 top-12 z-20 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-slate-800 hover:bg-slate-50"
                        onClick={() => {
                          onRename(conversation);
                          setOpenMenuId(null);
                        }}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        {t.chat.rename}
                      </button>
                      <button
                        type="button"
                        className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-start text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => {
                          onDelete(conversation);
                          setOpenMenuId(null);
                        }}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        {t.chat.deleteConversation}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {!filtered.length && <p className="px-3 py-4 text-sm text-slate-500">{t.chat.noConversations}</p>}
      </div>
    </aside>
  );
}
