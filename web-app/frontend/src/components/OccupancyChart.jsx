import { useMemo, useState } from "react";
import { monthLabels } from "../data/mockData.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function OccupancyChart({ monthly, relativeError }) {
  const [activeMonth, setActiveMonth] = useState(null);
  const chartRows = monthLabels.map((month) => {
    const prediction = monthly[month] ?? 0;
    const errorDays = Math.max(1, Math.round(relativeError));
    return {
      month,
      lower: clamp(prediction - errorDays, 0, 31),
      prediction,
      upper: clamp(prediction + errorDays, 0, 31),
    };
  });
  const activeRow = useMemo(() => {
    return chartRows.find((row) => row.month === activeMonth);
  }, [activeMonth, chartRows]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-on-surface-variant">
        <span className="uppercase text-on-surface">Days</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#ffd5d3]" />
          Maximum prediction
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary-container" />
          Occupancy prediction
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary" />
          Minimum prediction
        </span>
      </div>
      <div className="mb-2 min-h-[34px]">
        {activeRow && (
          <div className="inline-flex rounded-lg bg-inverse-surface px-3 py-2 text-[11px] font-semibold text-inverse-on-surface shadow-ambient">
            {activeRow.month}: maximum {activeRow.upper} days, prediction {activeRow.prediction} days, minimum{" "}
            {activeRow.lower} days
          </div>
        )}
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
        <div className="flex h-full min-w-[640px] items-end justify-center gap-3 xl:min-w-0 xl:gap-5">
          {chartRows.map(({ month, lower, prediction, upper }) => {
            const upperHeight = `${Math.max(8, (upper / 31) * 100)}%`;
            const predictionHeight = `${Math.max(8, (prediction / 31) * 100)}%`;
            const lowerHeight = `${Math.max(8, (lower / 31) * 100)}%`;
            const tooltip = `${month}: maximum ${upper} days, prediction ${prediction} days, minimum ${lower} days`;

            return (
              <div
                key={month}
                className="flex h-full min-w-[38px] flex-1 flex-col items-center justify-end gap-2"
                onMouseEnter={() => setActiveMonth(month)}
                onMouseLeave={() => setActiveMonth(null)}
              >
                <div
                  className="relative h-[min(31vh,285px)] w-[30px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                  title={tooltip}
                  role="img"
                  tabIndex={0}
                  aria-label={tooltip}
                  onClick={() => setActiveMonth(month)}
                  onFocus={() => setActiveMonth(month)}
                  onBlur={() => setActiveMonth(null)}
                >
                  <div
                    className="absolute bottom-0 left-0 flex w-full items-start justify-center rounded-lg bg-[#ffd5d3] pt-2 text-[10px] font-bold text-primary"
                    style={{ height: upperHeight }}
                  >
                    {upper}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 flex w-full items-start justify-center rounded-lg bg-primary-container pt-2 text-[10px] font-bold text-on-primary-container"
                    style={{ height: predictionHeight }}
                  >
                    {prediction}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 flex w-full items-start justify-center rounded-lg bg-primary pt-2 text-[10px] font-bold text-on-primary"
                    style={{ height: lowerHeight }}
                  >
                    {lower}
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-on-surface">{month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
