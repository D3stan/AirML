export default function ToggleInput({ label, description, checked, onChange, changed = false }) {
  return (
    <label
      className={`flex items-center justify-between gap-5 rounded-xl border p-4 transition ${
        changed
          ? "border-primary bg-primary-fixed/45 shadow-[0_0_0_2px_rgba(181,35,48,0.08)]"
          : "border-outline-variant bg-surface-container-lowest"
      }`}
    >
      <span>
        <span className="flex items-center gap-2 text-label-md text-on-surface">
          {label}
          {changed && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-on-primary">Modified</span>}
        </span>
        <span className="mt-1 block text-label-sm text-on-surface-variant">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-7 w-12 rounded-full bg-outline-variant transition peer-checked:bg-primary">
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}
