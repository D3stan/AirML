import { Euro, Moon } from "lucide-react";
import ModelBadge from "./ModelBadge.jsx";

export default function PricePredictionCard({ prediction }) {
  return (
    <article className="ambient-card flex min-h-[260px] flex-col p-6 md:p-7">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-headline-md text-on-surface">Price Prediction</h2>
          <p className="mt-1 text-label-md text-on-surface-variant">Expected nightly rate range</p>
        </div>
        <ModelBadge model={prediction.model} accuracy={prediction.accuracy} relativeError={prediction.relativeError} />
      </div>

      <div className="grid flex-1 grid-cols-1 items-center gap-5 sm:grid-cols-[1fr_1.3fr_1fr]">
        <div className="rounded-xl bg-surface-container p-4 text-center">
          <span className="text-label-sm uppercase text-on-surface-variant">Lower</span>
          <p className="mt-2 font-display text-headline-md text-on-surface">{prediction.lower} EUR</p>
        </div>
        <div className="rounded-2xl border border-primary-fixed bg-primary-fixed/65 p-5 text-center">
          <span className="text-label-sm uppercase text-primary">Predicted Rate</span>
          <div className="mt-2 flex items-end justify-center gap-2 text-primary">
            <Euro size={31} strokeWidth={2.4} />
            <span className="font-display text-display-lg">{prediction.prediction}</span>
            <span className="mb-2 inline-flex items-center gap-1 text-label-md text-on-surface-variant">
              <Moon size={16} />
              night
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container p-4 text-center">
          <span className="text-label-sm uppercase text-on-surface-variant">Upper</span>
          <p className="mt-2 font-display text-headline-md text-on-surface">{prediction.upper} EUR</p>
        </div>
      </div>
    </article>
  );
}
