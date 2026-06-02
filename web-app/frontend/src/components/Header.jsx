import { ArrowLeft, Settings } from "lucide-react";
import { Link } from "react-router-dom";

function AirMlLogo() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-ambient-soft">
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 5.5c-1.95 0-3.24 1.37-4.23 3.18L6.65 18.2c-1.2 2.23-.48 5.08 1.76 6.31 2.04 1.12 4.35.45 5.62-1.42L16 20.2l1.97 2.89c1.27 1.87 3.58 2.54 5.62 1.42 2.24-1.23 2.96-4.08 1.76-6.31l-5.12-9.52C19.24 6.87 17.95 5.5 16 5.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <circle cx="16" cy="15.25" r="2.6" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default function Header({ mode = "dashboard" }) {
  const isSettings = mode === "settings";

  return (
    <header className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-4 md:px-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <AirMlLogo />
          <span className="flex flex-col">
            <span className="font-display text-[30px] font-extrabold leading-7 text-primary">AirML</span>
            <span className="text-[11px] font-bold uppercase leading-4 tracking-[0.04em] text-on-surface">AI Rental Forecast Dashboard</span>
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
          <Link
            to="/settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary shadow-ambient-soft transition hover:border-primary"
            aria-label="Open property settings"
            title="Open property settings"
          >
            <Settings size={20} />
          </Link>
        )}
      </div>
    </header>
  );
}
