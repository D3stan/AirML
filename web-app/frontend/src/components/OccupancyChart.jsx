import { monthLabels } from "../data/mockData.js";

export default function OccupancyChart({ monthly }) {
  const maxValue = Math.max(31, ...Object.values(monthly));

  return (
    <div className="h-full min-h-[320px] overflow-x-auto">
      <div className="flex h-full min-w-[720px] items-end gap-4 px-1 pb-1 pt-8">
        {monthLabels.map((month) => {
          const value = monthly[month] ?? 0;
          const height = `${Math.max(8, (value / maxValue) * 100)}%`;

          return (
            <div key={month} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
              <div className="flex h-[260px] w-full items-end rounded-lg bg-surface-container px-1.5 pb-1.5">
                <div
                  className="flex w-full items-start justify-center rounded-md bg-primary pt-2 text-[11px] font-bold text-on-primary shadow-ambient-soft transition"
                  style={{ height }}
                >
                  {value}
                </div>
              </div>
              <span className="text-label-sm text-on-surface-variant">{month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
