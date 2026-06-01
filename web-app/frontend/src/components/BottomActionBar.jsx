import { Play, RotateCcw, Save } from "lucide-react";

export default function BottomActionBar({ onReset, onSave, onRunSimulation }) {
  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t border-outline-variant/50 bg-surface/90 px-5 py-4 shadow-top-bar backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col justify-center gap-3 sm:flex-row">
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
