import { CalendarDays, Euro } from "lucide-react";

export default function OccupancyPredictionCard({ occupancy }) {
  const circumference = 2 * Math.PI * 44;
  const progress = Math.min(Math.max(occupancy.annual_days / 365, 0), 1);
  const strokeDasharray = `${progress * circumference} ${circumference}`;

  return (
    <article className="ambient-card flex min-h-[260px] flex-col justify-between p-6 md:p-7">
      <div>
        <h2 className="font-display text-headline-md text-on-surface">Occupancy Outlook</h2>
        <p className="mt-1 text-label-md text-on-surface-variant">Annual booked days and projected revenue</p>
      </div>

      <div className="mt-8 grid items-center gap-7 sm:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-52 w-52">
          <svg className="-rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#e4e2e2" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#b52330"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeWidth="10"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-headline-lg text-on-surface">{occupancy.annual_days}</span>
            <span className="text-label-sm uppercase text-on-surface-variant">days / year</span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl bg-surface-container p-5">
            <span className="inline-flex items-center gap-2 text-label-sm uppercase text-on-surface-variant">
              <CalendarDays size={16} />
              Occupancy
            </span>
            <p className="mt-2 font-display text-headline-md text-on-surface">{Math.round(progress * 100)}%</p>
          </div>
          <div className="rounded-xl bg-primary-fixed p-5 text-primary">
            <span className="inline-flex items-center gap-2 text-label-sm uppercase">
              <Euro size={16} />
              Estimated revenue
            </span>
            <p className="mt-2 font-display text-headline-md">{occupancy.annual_revenue.toLocaleString("en-US")} EUR</p>
          </div>
        </div>
      </div>
    </article>
  );
}
