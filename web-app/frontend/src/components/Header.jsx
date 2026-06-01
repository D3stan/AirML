import { ArrowLeft, BrainCircuit, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header({ mode = "dashboard" }) {
  const isSettings = mode === "settings";

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-4 md:px-8">
        <Link to="/dashboard" className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-primary shadow-ambient-soft">
            <BrainCircuit size={24} strokeWidth={2.2} />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-headline-md text-primary">AirML</span>
            <span className="text-label-sm uppercase text-on-surface-variant">AI Rental Forecast Dashboard</span>
          </span>
        </Link>

        {isSettings ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md text-on-surface-variant shadow-ambient-soft transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
        ) : (
          <Link to="/settings" className="icon-button" aria-label="Open property settings" title="Open property settings">
            <Settings size={20} />
          </Link>
        )}
      </div>
    </header>
  );
}
