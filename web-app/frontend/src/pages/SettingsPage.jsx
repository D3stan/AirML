import { Building2, CalendarClock, CheckCircle2, MapPin } from "lucide-react";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AmenityPill from "../components/AmenityPill.jsx";
import BottomActionBar from "../components/BottomActionBar.jsx";
import CounterInput from "../components/CounterInput.jsx";
import Header from "../components/Header.jsx";
import PropertyMapCard from "../components/PropertyMapCard.jsx";
import SettingsSection from "../components/SettingsSection.jsx";
import ToggleInput from "../components/ToggleInput.jsx";
import {
  amenityOptions,
  cityOptions,
  defaultPredictions,
  defaultPropertySettings,
  neighbourhoodOptions,
  propertyTypeOptions,
  roomTypeOptions,
} from "../data/mockData.js";
import { resetPredictions, setPredictions } from "../features/predictions/predictionsSlice.js";
import {
  resetProperty,
  toggleAmenity,
  updatePropertyField,
  updatePropertyFields,
} from "../features/property/propertySlice.js";
import { generateMockPredictions } from "../services/mockPredictionService.js";
import { saveMockPredictions, savePropertySettings } from "../utils/storage.js";

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-label-md text-on-surface-variant">
      {label}
      {children}
    </label>
  );
}

function numberValue(value) {
  return Number.isNaN(Number(value)) ? 0 : Number(value);
}

function calculateCompleteness(property) {
  const fields = [
    property.city,
    property.neighbourhood_cleansed,
    property.latitude,
    property.longitude,
    property.property_type,
    property.room_type,
    property.accommodates,
    property.bathrooms,
    property.bedrooms,
    property.beds,
    property.amenities?.length,
    property.minimum_nights,
    property.maximum_nights,
    property.instant_bookable !== null,
    property.has_availability !== null,
    property.availability_365,
  ];

  const filled = fields.filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== "";
  }).length;

  return Math.round((filled / fields.length) * 100);
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const property = useSelector((state) => state.property);
  const completeness = useMemo(() => calculateCompleteness(property), [property]);

  const setField = (field, value) => {
    dispatch(updatePropertyField({ field, value }));
  };

  const saveCurrentSettings = () => {
    savePropertySettings(property);
  };

  const handleReset = () => {
    dispatch(resetProperty());
    dispatch(resetPredictions());
    savePropertySettings(defaultPropertySettings);
    saveMockPredictions(defaultPredictions);
  };

  const handleRunSimulation = () => {
    const predictions = generateMockPredictions(property);
    dispatch(setPredictions(predictions));
    savePropertySettings(property);
    saveMockPredictions(predictions);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header mode="settings" />
      <main className="mx-auto w-full max-w-[920px] px-5 py-8 md:px-8">
        <header className="mb-8">
          <h1 className="font-display text-headline-lg text-on-background">Property Settings</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Enter the property information used by the price and occupancy prediction models.
          </p>
          <div className="mt-6 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-3 flex items-end justify-between gap-5">
              <span className="text-label-md text-on-surface-variant">Input completeness</span>
              <span className="font-display text-headline-md text-primary">{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-primary-container transition-all" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </header>

        <div className="grid gap-6">
          <SettingsSection icon={MapPin} title="Location">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="City">
                <select className="field-shell" value={property.city} onChange={(event) => setField("city", event.target.value)}>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Neighbourhood">
                <select
                  className="field-shell"
                  value={property.neighbourhood_cleansed}
                  onChange={(event) => setField("neighbourhood_cleansed", event.target.value)}
                >
                  {neighbourhoodOptions.map((neighbourhood) => (
                    <option key={neighbourhood} value={neighbourhood}>
                      {neighbourhood}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Latitude">
                <input
                  className="field-shell"
                  type="number"
                  step="0.000001"
                  value={property.latitude}
                  onChange={(event) => setField("latitude", numberValue(event.target.value))}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="field-shell"
                  type="number"
                  step="0.000001"
                  value={property.longitude}
                  onChange={(event) => setField("longitude", numberValue(event.target.value))}
                />
              </Field>
            </div>
            <div className="mt-6 h-[360px]">
              <PropertyMapCard
                property={property}
                draggable
                onLocationChange={(location) => dispatch(updatePropertyFields(location))}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={Building2} title="Property Details">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Property type">
                <select
                  className="field-shell"
                  value={property.property_type}
                  onChange={(event) => setField("property_type", event.target.value)}
                >
                  {propertyTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Room type">
                <select className="field-shell" value={property.room_type} onChange={(event) => setField("room_type", event.target.value)}>
                  {roomTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CounterInput label="Accommodates" min={1} value={property.accommodates} onChange={(value) => setField("accommodates", value)} />
              <CounterInput label="Bathrooms" min={1} value={property.bathrooms} onChange={(value) => setField("bathrooms", value)} />
              <CounterInput label="Bedrooms" min={0} value={property.bedrooms} onChange={(value) => setField("bedrooms", value)} />
              <CounterInput label="Beds" min={1} value={property.beds} onChange={(value) => setField("beds", value)} />
            </div>
          </SettingsSection>

          <SettingsSection icon={CheckCircle2} title="Amenities">
            <div className="flex flex-wrap gap-3">
              {amenityOptions.map((amenity) => (
                <AmenityPill
                  key={amenity}
                  label={amenity}
                  selected={property.amenities.includes(amenity)}
                  onToggle={() => dispatch(toggleAmenity(amenity))}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection icon={CalendarClock} title="Booking Rules">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-5">
                <Field label="Minimum nights">
                  <input
                    className="field-shell"
                    type="number"
                    min="1"
                    value={property.minimum_nights}
                    onChange={(event) => setField("minimum_nights", Math.max(1, numberValue(event.target.value)))}
                  />
                </Field>
                <Field label="Maximum nights">
                  <input
                    className="field-shell"
                    type="number"
                    min="1"
                    value={property.maximum_nights}
                    onChange={(event) => setField("maximum_nights", Math.max(1, numberValue(event.target.value)))}
                  />
                </Field>
                <Field label="Availability 365">
                  <input
                    className="field-shell"
                    type="number"
                    min="0"
                    max="365"
                    value={property.availability_365}
                    onChange={(event) => setField("availability_365", Math.min(365, Math.max(0, numberValue(event.target.value))))}
                  />
                </Field>
              </div>
              <div className="grid content-center gap-4">
                <ToggleInput
                  label="Instant bookable"
                  description="Allow immediate reservation approval"
                  checked={property.instant_bookable}
                  onChange={(value) => setField("instant_bookable", value)}
                />
                <ToggleInput
                  label="Has availability"
                  description="Listing can receive bookings"
                  checked={property.has_availability}
                  onChange={(value) => setField("has_availability", value)}
                />
              </div>
            </div>
          </SettingsSection>
        </div>
      </main>
      <BottomActionBar onReset={handleReset} onSave={saveCurrentSettings} onRunSimulation={handleRunSimulation} />
    </div>
  );
}
