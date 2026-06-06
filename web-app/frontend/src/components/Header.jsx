import { ArrowLeft, ChevronDown, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { updatePropertyField } from "../features/property/propertySlice.js";
import { textBundle } from "../utils/i18n.js";

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

const languageOptions = [
  { id: "en", code: "ENG", flag: "🇬🇧", label: "English" },
  { id: "it", code: "ITA", flag: "🇮🇹", label: "Italiano" },
];

function LanguageSelector() {
  const dispatch = useDispatch();
  const language = useSelector((state) => state.property.language);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selected = languageOptions.find((option) => option.id === language) ?? languageOptions[0];

  useEffect(() => {
    const closeMenu = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-label-md font-bold text-primary shadow-ambient-soft transition hover:border-primary sm:h-11 sm:px-4"
        aria-label="Language"
        aria-expanded={open}
      >
        {/* <span className="text-[22px] leading-none">{selected.flag}</span> */}
        <span>{selected.code}</span>
        <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[900] w-[230px] rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-ambient">
          {languageOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                dispatch(updatePropertyField({ field: "language", value: option.id }));
                setOpen(false);
              }}
              className={`flex min-h-14 w-full items-center gap-4 rounded-xl px-4 text-left text-body-md font-bold transition ${
                selected.id === option.id ? "bg-surface-container text-on-surface" : "text-on-surface-variant hover:bg-primary-fixed"
              }`}
            >
              {/* <span className="text-[28px] leading-none">{option.flag}</span> */}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ mode = "dashboard" }) {
  const isSettings = mode === "settings";
  const language = useSelector((state) => state.property.language);
  const texts = textBundle(language);

  return (
    <header className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-4 md:px-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <AirMlLogo />
          <span className="flex flex-col">
            <span className="font-display text-[30px] font-extrabold leading-7 text-primary">AirML</span>
            <span className="text-[11px] font-bold uppercase leading-4 tracking-[0.04em] text-on-surface">{texts.dashboardSubtitle}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector />
          {isSettings ? (
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-label-md text-on-surface-variant shadow-ambient-soft transition hover:border-primary hover:text-primary sm:h-11 sm:px-4"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">{texts.backToDashboard}</span>
            </Link>
          ) : (
            <Link
              to="/settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-primary shadow-ambient-soft transition hover:border-primary sm:h-11 sm:w-11"
              aria-label={texts.openSettings}
              title={texts.openSettings}
            >
              <Settings size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
