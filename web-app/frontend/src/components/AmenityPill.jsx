import { Check, X } from "lucide-react";

export default function AmenityPill({ label, selected, onToggle, onRemove }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-label-md transition ${
        selected
          ? "border-primary bg-primary-fixed text-on-primary-fixed shadow-ambient-soft"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
      }`}
    >
      <button type="button" onClick={onToggle} className="inline-flex min-w-0 items-center gap-2">
        {selected && <Check size={16} className="shrink-0" />}
        <span className="truncate">{label}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-error"
          aria-label={`Remove ${label}`}
        >
          <X size={13} />
        </button>
      )}
    </span>
  );
}
