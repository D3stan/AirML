import { Check } from "lucide-react";

export default function AmenityPill({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-label-md transition ${
        selected
          ? "border-primary bg-primary-fixed text-on-primary-fixed shadow-ambient-soft"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
      }`}
    >
      {selected && <Check size={16} />}
      {label}
    </button>
  );
}
