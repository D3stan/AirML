import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/Header.jsx";
import ModelSelectDropdown from "../components/ModelSelectDropdown.jsx";
import OccupancyChart from "../components/OccupancyChart.jsx";
import PricePredictionCard from "../components/PricePredictionCard.jsx";
import PropertyMapCard from "../components/PropertyMapCard.jsx";
import { occupancyModelFallback } from "../data/mockData.js";
import { setPredictionModel, setPredictions } from "../features/predictions/predictionsSlice.js";
import { fetchOccupancyModels, occupancyPredictionFromApi, predictOccupancy } from "../services/apiService.js";
import { saveMockPredictions } from "../utils/storage.js";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/35 py-3 last:border-b-0">
      <span className="text-[12px] font-bold text-on-surface-variant">{label}</span>
      <span className="text-right text-[14px] font-extrabold text-on-surface">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const property = useSelector((state) => state.property);
  const predictions = useSelector((state) => state.predictions);
  const [occupancyModels, setOccupancyModels] = useState([occupancyModelFallback]);
  const [occupancyLoading, setOccupancyLoading] = useState(false);
  const [occupancyError, setOccupancyError] = useState("");

  useEffect(() => {
    let active = true;

    fetchOccupancyModels()
      .then((models) => {
        if (active && Array.isArray(models) && models.length > 0) {
          setOccupancyModels(models);
        }
      })
      .catch((error) => {
        if (active) {
          setOccupancyError(error instanceof Error ? error.message : "Unable to load occupancy models.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updatePriceModel = (model) => {
    const nextPredictions = {
      ...predictions,
      price: {
        ...predictions.price,
        model,
      },
    };
    dispatch(setPredictionModel({ target: "price", model }));
    saveMockPredictions(nextPredictions);
  };

  const updateOccupancyModel = async (modelId) => {
    setOccupancyLoading(true);
    setOccupancyError("");

    try {
      const apiPrediction = await predictOccupancy(modelId, property);
      const nextPredictions = {
        ...predictions,
        occupancy: occupancyPredictionFromApi(apiPrediction, predictions.price),
      };
      dispatch(setPredictions(nextPredictions));
      saveMockPredictions(nextPredictions);
    } catch (error) {
      setOccupancyError(error instanceof Error ? error.message : "Unable to update occupancy prediction.");
    } finally {
      setOccupancyLoading(false);
    }
  };

  return (
    <div className="dashboard-page min-h-screen overflow-x-hidden overflow-y-auto lg:h-screen lg:overflow-hidden">
      <Header />
      <main className="mx-auto grid w-full max-w-[1440px] min-w-0 gap-6 px-4 pb-6 pt-4 md:px-8 lg:h-[calc(100vh-72px)] lg:grid-cols-12 lg:pb-8">
        <section className="flex min-h-[640px] min-w-0 flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:min-h-[720px] md:p-8 lg:col-span-5 lg:min-h-0">
          <h1 className="mb-5 font-display text-[24px] font-bold leading-8 text-on-surface">Property Profile</h1>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-container bg-white">
            <PropertyMapCard
              property={property}
              mapCenter={[42.45, 12.55]}
              zoom={5}
              className="h-full min-h-0 rounded-xl"
            />
            <div className="absolute inset-x-4 bottom-4 z-[500] rounded-xl bg-surface-container-lowest/95 px-5 py-4 shadow-ambient-soft backdrop-blur sm:inset-x-6 sm:bottom-6 sm:px-6">
              <SummaryRow label="City" value={property.city} />
              <SummaryRow label="Neighbourhood" value={property.neighbourhood_cleansed} />
              <SummaryRow label="Property type" value={property.property_type} />
              <SummaryRow label="Room type" value={property.room_type.replace("/apt", "")} />
              <SummaryRow label="Guests" value={property.accommodates} />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-6 lg:col-span-7">
          <PricePredictionCard
            prediction={predictions.price}
            occupancy={predictions.occupancy}
            onModelChange={updatePriceModel}
          />
          <article className="flex min-h-[560px] min-w-0 flex-[1.48] flex-col overflow-visible rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-8 lg:min-h-0">
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
              <h2 className="font-display text-[24px] font-bold leading-8 text-on-surface">Occupancy Prediction</h2>
              <ModelSelectDropdown
                value={predictions.occupancy.model_id ?? predictions.occupancy.model}
                accuracy={predictions.occupancy.accuracy}
                relativeError={predictions.occupancy.relativeError}
                onChange={updateOccupancyModel}
                label="Select occupancy prediction model"
                options={occupancyModels}
                disabled={occupancyModels.length === 0}
                loading={occupancyLoading}
              />
            </div>
            {occupancyError && (
              <div className="mb-4 rounded-xl border border-error/30 bg-primary-fixed px-4 py-3 text-label-md text-on-primary-fixed">
                {occupancyError}
              </div>
            )}
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
