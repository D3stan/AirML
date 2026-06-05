import { useState } from "react";
import { monthLabels } from "../data/mockData.js";

const daysByMonth = {
  Jan: 31,
  Feb: 28,
  Mar: 31,
  Apr: 30,
  May: 31,
  Jun: 30,
  Jul: 31,
  Aug: 31,
  Sep: 30,
  Oct: 31,
  Nov: 30,
  Dec: 31,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function OccupancyChart({ monthly, relativeError }) {
  const [visibleSeries, setVisibleSeries] = useState({
    upper: true,
    prediction: true,
    lower: true,
  });
  const chartRows = monthLabels.map((month) => {
    const prediction = monthly[month] ?? 0;
    const daysInMonth = daysByMonth[month] ?? 31;
    const relativeSpread = Number(relativeError || 0) / 100;
    return {
      month,
      lower: clamp(Math.round(prediction * (1 - relativeSpread)), 0, daysInMonth),
      prediction: clamp(Math.round(prediction), 0, daysInMonth),
      upper: clamp(Math.round(prediction * (1 + relativeSpread)), 0, daysInMonth),
    };
  });

  const toggleSeries = (series) => {
    setVisibleSeries((current) => ({
      ...current,
      [series]: !current[series],
    }));
  };

  const legendItems = [
    { key: "upper", label: "Maximum prediction", colorClass: "bg-[#ffd5d3]" },
    { key: "prediction", label: "Occupancy prediction", colorClass: "bg-primary-container" },
    { key: "lower", label: "Minimum prediction", colorClass: "bg-primary" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-on-surface-variant">
        <span className="uppercase text-on-surface">Days</span>
        {legendItems.map((item) => (
          <label key={item.key} className="inline-flex cursor-pointer select-none items-center gap-1.5">
            <input
              type="checkbox"
              checked={visibleSeries[item.key]}
              onChange={() => toggleSeries(item.key)}
              className="peer sr-only"
            />
            <span
              className={`h-4 w-4 rounded-sm border transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary-fixed ${
                visibleSeries[item.key]
                  ? `border-transparent ${item.colorClass}`
                  : "border-outline-variant bg-transparent opacity-45"
              }`}
            />
            {item.label}
          </label>
        ))}
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
        <div className="flex h-full min-w-[640px] items-end justify-center gap-3 xl:min-w-0 xl:gap-5">
          {chartRows.map(({ month, lower, prediction, upper }) => {
            const upperHeight = `${Math.max(8, (upper / 31) * 100)}%`;
            const predictionHeight = `${Math.max(8, (prediction / 31) * 100)}%`;
            const lowerHeight = `${Math.max(8, (lower / 31) * 100)}%`;

            return (
              <div key={month} className="flex h-full min-w-[38px] flex-1 flex-col items-center justify-end gap-2">
                <div className="relative h-[min(35vh,315px)] w-[30px]">
                  {visibleSeries.upper && (
                    <div
                      className="absolute bottom-0 left-0 flex w-full items-start justify-center rounded-lg bg-[#ffd5d3] pt-2 text-[10px] font-bold text-primary"
                      style={{ height: upperHeight }}
                    >
                      {upper}
                    </div>
                  )}
                  {visibleSeries.prediction && (
                    <div
                      className="absolute bottom-0 left-0 flex w-full items-start justify-center rounded-lg bg-primary-container pt-2 text-[10px] font-bold text-on-primary-container"
                      style={{ height: predictionHeight }}
                    >
                      {prediction}
                    </div>
                  )}
                  {visibleSeries.lower && (
                    <div
                      className="absolute bottom-0 left-0 flex w-full items-start justify-center rounded-lg bg-primary pt-2 text-[10px] font-bold text-on-primary"
                      style={{ height: lowerHeight }}
                    >
                      {lower}
                    </div>
                  )}
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
