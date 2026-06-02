import { Euro } from "lucide-react";
import ModelSelectDropdown from "./ModelSelectDropdown.jsx";

export default function PricePredictionCard({ prediction, occupancy, onModelChange }) {
  const circumference = 2 * Math.PI * 44;
  const progress = Math.min(Math.max(occupancy.annual_days / 365, 0), 1);
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-7 lg:p-8">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <h2 className="font-display text-[24px] font-bold leading-8 text-on-surface">Price Prediction</h2>
        <ModelSelectDropdown
          value={prediction.model}
          accuracy={prediction.accuracy}
          relativeError={prediction.relativeError}
          onChange={onModelChange}
          label="Select price prediction model"
        />
      </div>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_128px] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_156px] sm:gap-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <div className="grid gap-4 lg:hidden">
            <div className="text-center">
              <span className="block text-[11px] font-extrabold uppercase text-primary">Predicted Rate</span>
              <div className="mt-1 flex items-end justify-center gap-1 text-primary">
                <span className="font-display text-[40px] font-extrabold leading-none sm:text-[44px]">{prediction.prediction}</span>
                <Euro size={28} strokeWidth={3} className="mb-1 sm:size-[31px]" />
                <span className="mb-1 text-[13px] font-semibold text-on-surface sm:text-[14px]">/night</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase text-on-surface">Lower</span>
                <span className="mt-1 block text-[18px] font-bold text-[#5a2d2c]">{prediction.lower} EUR</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase text-on-surface">Upper</span>
                <span className="mt-1 block text-[18px] font-bold text-[#5a2d2c]">{prediction.upper} EUR</span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-5 lg:grid lg:grid-cols-[1fr_auto_1.55fr_auto_1fr]">
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase text-on-surface">Lower</span>
              <span className="mt-1 block text-[18px] font-bold text-[#5a2d2c]">{prediction.lower} EUR</span>
            </div>
            <div className="h-12 w-px bg-outline-variant/35" />
            <div className="text-center">
              <span className="block text-[11px] font-extrabold uppercase text-primary">Predicted Rate</span>
              <div className="mt-1 flex items-end justify-center gap-1 text-primary">
                <span className="font-display text-[44px] font-extrabold leading-none">{prediction.prediction}</span>
                <Euro size={31} strokeWidth={3} className="mb-1" />
                <span className="mb-1 text-[14px] font-semibold text-on-surface">/night</span>
              </div>
            </div>
            <div className="h-12 w-px bg-outline-variant/35" />
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase text-on-surface">Upper</span>
              <span className="mt-1 block text-[18px] font-bold text-[#5a2d2c]">{prediction.upper} EUR</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pr-1 sm:pr-3 lg:pr-5 xl:pr-7">
          <div className="relative h-32 w-32 shrink-0 sm:h-40 sm:w-40 lg:h-40 lg:w-40 xl:h-44 xl:w-44">
            <svg className="-rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#e8e4e4" strokeWidth="12" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#c51f31"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[24px] font-bold leading-none text-on-surface sm:text-[28px] lg:text-[30px]">
                  {occupancy.annual_days}
                </span>
                <span className="text-[10px] font-semibold text-on-surface-variant sm:text-[11px]">days</span>
              </div>
              <span className="mt-2 text-[11px] font-extrabold text-primary sm:mt-3 sm:text-[13px] lg:text-[14px]">
                EUR {occupancy.annual_revenue.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
