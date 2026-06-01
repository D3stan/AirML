import { Gauge, Percent, TrendingDown } from "lucide-react";

export default function ModelBadge({ model, accuracy, relativeError }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-3 rounded-full bg-surface-container px-4 py-2 text-label-sm text-on-surface">
      <span className="inline-flex items-center gap-1 font-bold">
        <Gauge size={16} />
        {model}
      </span>
      <span className="inline-flex items-center gap-1 text-on-surface-variant" title="Accuracy">
        <Percent size={15} />
        {accuracy}%
      </span>
      <span className="inline-flex items-center gap-1 text-on-surface-variant" title="Relative error">
        <TrendingDown size={15} />
        {relativeError}%
      </span>
    </div>
  );
}
