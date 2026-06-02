import { ChevronDown, Percent, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { modelOptions } from "../data/mockData.js";

export default function ModelSelectDropdown({ value, accuracy, relativeError, onChange, label }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

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
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12 w-full min-w-0 items-center justify-between rounded-full bg-[#f1f5f9] px-4 text-left text-[13px] font-bold text-on-surface transition hover:bg-[#e9eef5] sm:px-5 sm:text-label-md"
        aria-label={label}
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{value}</span>
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
          {modelOptions.map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => {
                onChange(model);
                setOpen(false);
              }}
              className={`flex min-h-11 w-full items-center rounded-xl px-4 text-left text-body-md font-semibold transition ${
                model === value ? "bg-surface-container text-on-surface" : "text-on-surface hover:bg-surface-container"
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
