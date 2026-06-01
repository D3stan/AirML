import { useSelector } from "react-redux";
import Header from "../components/Header.jsx";
import ModelBadge from "../components/ModelBadge.jsx";
import OccupancyChart from "../components/OccupancyChart.jsx";
import OccupancyPredictionCard from "../components/OccupancyPredictionCard.jsx";
import PricePredictionCard from "../components/PricePredictionCard.jsx";
import PropertyMapCard from "../components/PropertyMapCard.jsx";
import PropertySummaryCard from "../components/PropertySummaryCard.jsx";

export default function DashboardPage() {
  const property = useSelector((state) => state.property);
  const predictions = useSelector((state) => state.predictions);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto grid w-full max-w-[1440px] gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(360px,0.74fr)_minmax(0,1fr)]">
        <section className="ambient-card flex flex-col gap-5 p-6 md:p-8 lg:min-h-[calc(100vh-128px)]">
          <div>
            <h1 className="font-display text-headline-lg text-on-surface">Property Profile</h1>
            <p className="mt-1 text-label-md text-on-surface-variant">Location and listing inputs used by the mock models</p>
          </div>
          <div className="grid flex-1 gap-5">
            <PropertyMapCard property={property} />
            <PropertySummaryCard property={property} />
          </div>
        </section>

        <section className="grid gap-6">
          <PricePredictionCard prediction={predictions.price} />
          <OccupancyPredictionCard occupancy={predictions.occupancy} />
          <article className="ambient-card p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-headline-md text-on-surface">Occupancy Prediction</h2>
                <p className="mt-1 text-label-md text-on-surface-variant">Expected occupied days by month</p>
              </div>
              <ModelBadge
                model={predictions.occupancy.model}
                accuracy={predictions.occupancy.accuracy}
                relativeError={predictions.occupancy.relativeError}
              />
            </div>
            <OccupancyChart monthly={predictions.occupancy.monthly} />
          </article>
        </section>
      </main>
    </div>
  );
}
