import { useState } from "react";
import Modal from "./Modal.jsx";

export function Button({ variant = "primary", className = "", type = "button", ...props }) {
  return (
    <button
      {...props}
      className={`ui-button ui-button--${variant} ${className}`.trim()}
      type={type}
    />
  );
}

export function Card({ as: Element = "article", className = "", ...props }) {
  return <Element {...props} className={`ui-card ${className}`.trim()} />;
}

export function Badge({ variant = "default", className = "", ...props }) {
  return <span {...props} className={`ui-badge ${variant === "danger" ? "ui-badge--danger" : ""} ${className}`.trim()} />;
}

export function Tabs({ items, value, onChange, label, className = "" }) {
  return (
    <div className={`ui-tabs ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Sheet({ open, title, closeLabel, onClose, children, direction }) {
  return (
    <Modal
      open={open}
      title={title}
      closeLabel={closeLabel}
      onClose={onClose}
      direction={direction}
      kind="sheet"
    >
      {children}
    </Modal>
  );
}

export function ModalPreview({ title, closeLabel, direction, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>{title}</Button>
      <Modal
        open={open}
        title={title}
        closeLabel={closeLabel}
        onClose={() => setOpen(false)}
        direction={direction}
      >
        {children}
      </Modal>
    </>
  );
}

export function Toast({ children, className = "" }) {
  return (
    <div className={`ui-toast ${className}`.trim()} role="status" aria-live="polite">
      {children}
    </div>
  );
}

export function Skeleton({ rows = 3, label }) {
  return (
    <div className="ui-skeleton" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function EmptyState({ children, actionLabel, onAction, className = "" }) {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      <p>{children}</p>
      {actionLabel && onAction && <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

export function Banner({ children, variant = "default", className = "" }) {
  return (
    <div className={`ui-banner ${variant === "danger" ? "ui-banner--danger" : ""} ${className}`.trim()} role={variant === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function FormField({ label, htmlFor, children, className = "" }) {
  return (
    <label className={`ui-form-field ${className}`.trim()} htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SheetPreview({ title, closeLabel, direction, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>{title}</Button>
      <Sheet
        open={open}
        title={title}
        closeLabel={closeLabel}
        onClose={() => setOpen(false)}
        direction={direction}
      >
        {children}
      </Sheet>
    </>
  );
}
