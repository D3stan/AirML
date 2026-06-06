import { Minus, Plus } from "lucide-react";

export default function CounterInput({ label, value, min = 0, max = 50, onChange, changed = false, savedValue, savedLabel = "Saved", decreaseLabel = "Decrease", increaseLabel = "Increase" }) {
  const safeValue = Number(value) || 0;

  return (
    <div
      className={`flex min-h-[120px] min-w-0 flex-col justify-between rounded-xl border p-4 text-center transition ${
        changed
          ? "border-primary bg-primary-fixed/45 shadow-[0_0_0_2px_rgba(181,35,48,0.08)]"
          : "border-outline-variant bg-surface-container-lowest"
      }`}
    >
      <div className="flex min-h-6 items-start justify-center gap-2">
        <label className="w-full break-words text-center text-[13px] font-bold leading-5 text-on-surface-variant sm:text-label-md">
          {label}
        </label>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary"
          onClick={() => onChange(Math.max(min, safeValue - 1))}
          aria-label={`${decreaseLabel} ${label}`}
        >
          <Minus size={17} />
        </button>
        <span className="w-10 font-display text-headline-md text-on-surface">{safeValue}</span>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary"
          onClick={() => onChange(Math.min(max, safeValue + 1))}
          aria-label={`${increaseLabel} ${label}`}
        >
          <Plus size={17} />
        </button>
      </div>
      {changed && <p className="mt-3 text-[11px] font-semibold text-primary">{savedLabel}: {savedValue}</p>}
    </div>
  );
}
