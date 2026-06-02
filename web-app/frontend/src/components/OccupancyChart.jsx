import { monthLabels } from "../data/mockData.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function OccupancyChart({ monthly, relativeError }) {
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

  return (
    <div className="flex h-full min-h-0 items-end">
      <div className="flex h-full w-full items-end justify-center gap-3 xl:gap-5">
        {chartRows.map(({ month, lower, prediction, upper }) => {
          const upperHeight = `${Math.max(8, (upper / 31) * 100)}%`;
          const predictionHeight = `${Math.max(8, (prediction / 31) * 100)}%`;
          const lowerHeight = `${Math.max(8, (lower / 31) * 100)}%`;

          return (
            <div key={month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="relative h-[min(32vh,300px)] w-full max-w-[34px]">
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
  );
}
