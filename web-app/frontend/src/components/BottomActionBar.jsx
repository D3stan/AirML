import { Play, RotateCcw, Save } from "lucide-react";

export default function BottomActionBar({ onReset, onSave, onRunSimulation }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[920px] -translate-x-1/2 rounded-2xl border border-outline-variant/45 bg-surface-container-lowest/95 p-4 shadow-ambient backdrop-blur">
      <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline px-6 py-3 text-label-md text-on-surface transition hover:bg-surface-container"
        >
          <RotateCcw size={18} />
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 text-label-md text-primary transition hover:bg-primary-fixed"
        >
          <Save size={18} />
          Save
        </button>
        <button
          type="button"
          onClick={onRunSimulation}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-label-md text-on-primary shadow-ambient transition hover:bg-tertiary"
        >
          <Play size={18} />
          Run Simulation
        </button>
      </div>
    </div>
  );
}
