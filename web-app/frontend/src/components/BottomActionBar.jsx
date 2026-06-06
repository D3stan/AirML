import { Play, RotateCcw, Save } from "lucide-react";

export default function BottomActionBar({ onReset, onSave, onRunSimulation, simulationLoading = false, texts }) {
  const labels = {
    reset: texts?.reset ?? "Reset",
    save: texts?.save ?? "Save",
    runSimulation: texts?.runSimulation ?? "Run Simulation",
    running: texts?.running ?? "Running...",
  };
  const runLabel = simulationLoading ? labels.running : labels.runSimulation;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[920px] -translate-x-1/2 rounded-2xl border border-outline-variant/45 bg-surface-container-lowest/95 p-3 shadow-ambient backdrop-blur sm:p-4">
      <div className="grid w-full grid-cols-3 justify-center gap-3 sm:flex sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline px-4 py-3 text-label-md text-on-surface transition hover:bg-surface-container sm:px-6"
          aria-label={labels.reset}
          title={labels.reset}
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">{labels.reset}</span>
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-label-md text-primary transition hover:bg-primary-fixed sm:px-6"
          aria-label={labels.save}
          title={labels.save}
        >
          <Save size={18} />
          <span className="hidden sm:inline">{labels.save}</span>
        </button>
        <button
          type="button"
          onClick={onRunSimulation}
          disabled={simulationLoading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-md text-on-primary shadow-ambient transition hover:bg-tertiary disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-on-surface-variant sm:px-8"
          aria-label={runLabel}
          title={runLabel}
        >
          <Play size={18} />
          <span className="hidden sm:inline">{runLabel}</span>
        </button>
      </div>
    </div>
  );
}
