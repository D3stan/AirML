export default function ToggleInput({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <span>
        <span className="block text-label-md text-on-surface">{label}</span>
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
