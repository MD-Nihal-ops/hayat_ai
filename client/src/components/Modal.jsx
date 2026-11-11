import { useEffect, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export default function Modal({
  open,
  title,
  closeLabel,
  onClose,
  children,
  footer,
  isDirty = false,
  confirmCloseMessage,
  direction = "ltr",
  kind = "modal"
}) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const optionsRef = useRef({ onClose, isDirty, confirmCloseMessage });
  optionsRef.current = { onClose, isDirty, confirmCloseMessage };

  function requestClose() {
    const current = optionsRef.current;
    if (current.isDirty && !window.confirm(current.confirmCloseMessage)) return;
    current.onClose();
  }

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector(focusableSelector);
    (firstFocusable || dialog)?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll(focusableSelector)];
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`ui-modal-scrim fixed inset-0 z-[1000] flex items-end bg-black/50 md:items-center md:justify-center md:p-4 ${kind === "sheet" ? "ui-modal-scrim--sheet" : ""}`}>
      <section
        ref={dialogRef}
        className={`ui-modal-panel flex min-h-0 w-full max-h-[92dvh] flex-col bg-white text-gray-900 shadow-xl md:max-h-[90dvh] md:max-w-xl md:rounded-[1.5rem] ${kind === "sheet" ? "ui-modal-panel--sheet" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        dir={direction}
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold" id="modal-title">{title}</h2>
          <button
            className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-400 bg-white text-xl text-gray-900"
            type="button"
            aria-label={closeLabel}
            onClick={requestClose}
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
            {typeof footer === "function" ? footer({ requestClose }) : footer}
          </footer>
        )}
      </section>
    </div>
  );
}
