import { ChevronDown, Euro, Percent, TrendingUp } from "lucide-react";
import { modelOptions } from "../data/mockData.js";

export default function PricePredictionCard({ prediction, occupancy, onModelChange }) {
  const circumference = 2 * Math.PI * 44;
  const progress = Math.min(Math.max(occupancy.annual_days / 365, 0), 1);
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <article className="flex min-h-0 flex-1 flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-7">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h2 className="font-display text-[24px] font-bold leading-8 text-on-surface">Price Prediction</h2>
        <div className="relative">
          <select
            value={prediction.model}
            onChange={(event) => onModelChange(event.target.value)}
            className="h-8 appearance-none rounded-full border-0 bg-[#f1f5f9] py-0 pl-4 pr-28 text-[12px] font-bold text-on-surface outline-none ring-0"
            aria-label="Select price prediction model"
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-3 text-[11px] font-bold text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <TrendingUp size={13} />
              {prediction.accuracy}%
            </span>
            <span className="inline-flex items-center gap-1">
              <Percent size={13} />
              {prediction.relativeError}%
            </span>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_168px]">
        <div className="grid grid-cols-[1fr_auto_1.55fr_auto_1fr] items-center gap-5">
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

        <div className="relative h-40 w-40 justify-self-center lg:justify-self-end">
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
              <span className="font-display text-[30px] font-bold leading-none text-on-surface">{occupancy.annual_days}</span>
              <span className="text-[11px] font-semibold text-on-surface-variant">days</span>
            </div>
            <span className="mt-3 text-[14px] font-extrabold text-primary">
              EUR {occupancy.annual_revenue.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
