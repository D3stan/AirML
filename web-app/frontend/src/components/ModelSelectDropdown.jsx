import { ChevronDown, Percent, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { modelOptions } from "../data/mockData.js";

function normalizeOption(option) {
  return typeof option === "string"
    ? { id: option, name: option, accuracy: null, relativeError: null }
    : option;
}

export default function ModelSelectDropdown({
  value,
  accuracy,
  relativeError,
  onChange,
  label,
  options = modelOptions,
  disabled = false,
  loading = false,
  loadingLabel = "Loading...",
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const normalizedOptions = options.map(normalizeOption);
  const selectedOption = normalizedOptions.find((option) => option.id === value || option.name === value);
  const selectedLabel = selectedOption?.name ?? value;

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
    <div ref={wrapperRef} className="relative w-full min-w-0 sm:w-[260px]">
      <button
        type="button"
        onClick={() => {
          if (!disabled && !loading) {
            setOpen((current) => !current);
          }
        }}
        disabled={disabled || loading}
        className="flex min-h-12 w-full min-w-0 items-center justify-between rounded-full bg-[#f1f5f9] px-4 text-left text-[13px] font-bold text-on-surface transition hover:bg-[#e9eef5] disabled:cursor-not-allowed disabled:opacity-65 sm:px-5 sm:text-label-md"
        aria-label={label}
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{loading ? loadingLabel : selectedLabel}</span>
        <span className="ml-3 flex shrink-0 items-center gap-2 text-on-surface-variant sm:ml-4 sm:gap-4">
          <span className="inline-flex items-center gap-1">
            <TrendingUp size={16} />
            {accuracy}%
          </span>
          <span className="inline-flex items-center gap-1">
            <Percent size={16} />
            {relativeError}%
          </span>
          <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="no-scrollbar absolute left-0 right-0 top-[calc(100%+8px)] z-[900] max-h-[190px] overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-ambient">
          {normalizedOptions.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
              className={`flex min-h-11 w-full items-center rounded-xl px-4 text-left text-body-md font-semibold transition ${
                model.id === value || model.name === value
                  ? "bg-surface-container text-on-surface"
                  : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{model.name}</span>
              {model.accuracy !== null && model.relativeError !== null && (
                <span className="ml-3 shrink-0 text-[12px] text-on-surface-variant">
                  {model.accuracy}% / {model.relativeError}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
