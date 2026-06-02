import { ChevronDown, Percent, TrendingUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/Header.jsx";
import OccupancyChart from "../components/OccupancyChart.jsx";
import PricePredictionCard from "../components/PricePredictionCard.jsx";
import PropertyMapCard from "../components/PropertyMapCard.jsx";
import { modelOptions } from "../data/mockData.js";
import { setPredictionModel } from "../features/predictions/predictionsSlice.js";
import { saveMockPredictions } from "../utils/storage.js";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/35 py-3 last:border-b-0">
      <span className="text-[12px] font-bold text-on-surface-variant">{label}</span>
      <span className="text-right text-[14px] font-extrabold text-on-surface">{value}</span>
    </div>
  );
}

function ModelDropdown({ value, accuracy, relativeError, onChange, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 appearance-none rounded-full border-0 bg-[#f1f5f9] py-0 pl-4 pr-28 text-[12px] font-bold text-on-surface outline-none ring-0"
        aria-label={label}
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
          {accuracy}%
        </span>
        <span className="inline-flex items-center gap-1">
          <Percent size={13} />
          {relativeError}%
        </span>
        <ChevronDown size={14} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const property = useSelector((state) => state.property);
  const predictions = useSelector((state) => state.predictions);

  const updateModel = (target, model) => {
    const nextPredictions = {
      ...predictions,
      [target]: {
        ...predictions[target],
        model,
      },
    };
    dispatch(setPredictionModel({ target, model }));
    saveMockPredictions(nextPredictions);
  };

  return (
    <div className="dashboard-page min-h-screen overflow-y-auto lg:h-screen lg:overflow-hidden">
      <Header />
      <main className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pb-4 pt-4 md:px-8 lg:h-[calc(100vh-72px)] lg:grid-cols-12 lg:pb-8">
        <section className="flex min-h-[720px] flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-8 lg:col-span-5 lg:min-h-0">
          <h1 className="mb-5 font-display text-[24px] font-bold leading-8 text-on-surface">Property Profile</h1>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-container bg-white">
            <PropertyMapCard
              property={property}
              mapCenter={[42.45, 12.55]}
              zoom={5}
              className="h-full min-h-0 rounded-xl"
            />
            <div className="absolute inset-x-6 bottom-6 z-[500] rounded-xl bg-surface-container-lowest/95 px-6 py-4 shadow-ambient-soft backdrop-blur">
              <SummaryRow label="City" value={property.city} />
              <SummaryRow label="Neighbourhood" value={property.neighbourhood_cleansed} />
              <SummaryRow label="Property type" value={property.property_type} />
              <SummaryRow label="Room type" value={property.room_type.replace("/apt", "")} />
              <SummaryRow label="Guests" value={property.accommodates} />
            </div>
          </div>
        </section>

        <section className="flex min-h-[720px] flex-col gap-6 lg:col-span-7 lg:min-h-0">
          <PricePredictionCard
            prediction={predictions.price}
            occupancy={predictions.occupancy}
            onModelChange={(model) => updateModel("price", model)}
          />
          <article className="flex min-h-0 flex-[1.48] flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-8">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="font-display text-[24px] font-bold leading-8 text-on-surface">Occupancy Prediction</h2>
              <ModelDropdown
                value={predictions.occupancy.model}
                accuracy={predictions.occupancy.accuracy}
                relativeError={predictions.occupancy.relativeError}
                onChange={(model) => updateModel("occupancy", model)}
                label="Select occupancy prediction model"
              />
            </div>
            <div className="min-h-0 flex-1">
              <OccupancyChart
                monthly={predictions.occupancy.monthly}
                relativeError={predictions.occupancy.relativeError}
              />
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
