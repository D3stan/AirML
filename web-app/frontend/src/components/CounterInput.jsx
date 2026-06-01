import { Minus, Plus } from "lucide-react";

export default function CounterInput({ label, value, min = 0, max = 50, onChange }) {
  const safeValue = Number(value) || 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
      <label className="text-label-md text-on-surface-variant">{label}</label>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary"
          onClick={() => onChange(Math.max(min, safeValue - 1))}
          aria-label={`Decrease ${label}`}
        >
          <Minus size={17} />
        </button>
        <span className="w-10 font-display text-headline-md text-on-surface">{safeValue}</span>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary"
          onClick={() => onChange(Math.min(max, safeValue + 1))}
          aria-label={`Increase ${label}`}
        >
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}
