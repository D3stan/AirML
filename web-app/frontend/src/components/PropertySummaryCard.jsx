import { Home, MapPin, Users } from "lucide-react";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/35 py-3 last:border-b-0">
      <span className="text-label-sm uppercase text-on-surface-variant">{label}</span>
      <span className="text-right text-label-md text-on-surface">{value}</span>
    </div>
  );
}

export default function PropertySummaryCard({ property }) {
  return (
    <div className="rounded-xl border border-outline-variant/45 bg-surface-container-lowest/95 p-5 shadow-ambient-soft backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <Home size={19} />
        </span>
        <div>
          <h3 className="font-display text-body-lg font-bold text-on-surface">Property Snapshot</h3>
          <p className="text-label-sm text-on-surface-variant">Current model inputs</p>
        </div>
      </div>
      <SummaryRow label="City" value={property.city} />
      <SummaryRow label="Neighbourhood" value={property.neighbourhood_cleansed} />
      <SummaryRow label="Property type" value={property.property_type} />
      <SummaryRow label="Room type" value={property.room_type} />
      <SummaryRow
        label="Guests"
        value={
          <span className="inline-flex items-center gap-1">
            <Users size={16} />
            {property.accommodates}
          </span>
        }
      />
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-label-sm text-on-surface-variant">
        <MapPin size={16} />
        {Number(property.latitude).toFixed(4)}, {Number(property.longitude).toFixed(4)}
      </div>
    </div>
  );
}
