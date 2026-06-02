export default function ToggleInput({ label, description, checked, onChange, changed = false }) {
  return (
    <div className="grid gap-3">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <span className="text-label-md text-on-surface-variant">{label}</span>
      </div>
      <label
        className={`flex min-h-[56px] items-center justify-between gap-5 rounded-xl border px-4 transition ${
          changed
            ? "border-primary bg-primary-fixed/45 shadow-[0_0_0_2px_rgba(181,35,48,0.08)]"
            : "border-outline-variant bg-surface-container-lowest"
        }`}
      >
        <span className="text-label-sm text-on-surface-variant">{description}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="relative h-7 w-12 shrink-0 rounded-full bg-outline-variant transition peer-checked:bg-primary">
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </label>
    </div>
  );
}
