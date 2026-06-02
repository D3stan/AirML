import { Building2, CalendarClock, CheckCircle2, ChevronDown, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  cityProfiles,
  defaultPredictions,
  defaultPropertySettings,
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
import {
  clearPropertyDraft,
  loadSavedPropertySettings,
  saveMockPredictions,
  savePropertyDraft,
  savePropertySettings,
} from "../utils/storage.js";

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function numberValue(value) {
  return Number.isNaN(Number(value)) ? 0 : Number(value);
}

function modifiedClasses(changed) {
  return changed
    ? "border-primary bg-primary-fixed/45 shadow-[0_0_0_2px_rgba(181,35,48,0.08)]"
    : "border-outline-variant bg-surface-container-lowest";
}

function Field({ label, changed, savedValue, children }) {
  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label className="text-label-md text-on-surface-variant">{label}</label>
        {changed && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-on-primary">Modified</span>}
      </div>
      {children}
      {changed && <span className="text-[11px] font-semibold text-primary">Saved: {String(savedValue)}</span>}
    </div>
  );
}

function SelectMenu({ label, value, options, onChange, changed, savedValue }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  return (
    <Field label={label} changed={changed} savedValue={savedValue}>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-[52px] w-full items-center justify-between rounded-xl border px-4 text-left text-body-md font-bold text-on-surface transition ${modifiedClasses(
            changed,
          )}`}
        >
          <span>{value}</span>
          <ChevronDown size={20} className={`text-on-surface transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[900] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-ambient">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center rounded-xl px-4 text-left text-body-md font-semibold transition ${
                  option === value ? "bg-surface-container text-on-surface" : "text-on-surface hover:bg-primary-fixed"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const property = useSelector((state) => state.property);
  const [savedProperty, setSavedProperty] = useState(() => loadSavedPropertySettings(defaultPropertySettings));

  const availableNeighbourhoods = useMemo(() => {
    return cityProfiles[property.city]?.neighbourhoods ?? cityProfiles.Florence.neighbourhoods;
  }, [property.city]);

  useEffect(() => {
    savePropertyDraft(property);
  }, [property]);

  const isChanged = (field) => !valuesEqual(property[field], savedProperty[field]);

  const setField = (field, value) => {
    dispatch(updatePropertyField({ field, value }));
  };

  const setCity = (city) => {
    const cityProfile = cityProfiles[city];
    dispatch(
      updatePropertyFields({
        city,
        neighbourhood_cleansed: cityProfile.neighbourhoods[0],
        latitude: cityProfile.latitude,
        longitude: cityProfile.longitude,
      }),
    );
  };

  const saveCurrentSettings = () => {
    savePropertySettings(property);
    clearPropertyDraft();
    setSavedProperty(property);
  };

  const handleReset = () => {
    dispatch(resetProperty());
    dispatch(resetPredictions());
    savePropertySettings(defaultPropertySettings);
    saveMockPredictions(defaultPredictions);
    clearPropertyDraft();
    setSavedProperty(defaultPropertySettings);
  };

  const handleRunSimulation = () => {
    const predictions = generateMockPredictions(property);
    dispatch(setPredictions(predictions));
    savePropertySettings(property);
    saveMockPredictions(predictions);
    clearPropertyDraft();
    setSavedProperty(property);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header mode="settings" />
      <main className="mx-auto w-full max-w-[920px] px-5 py-8 md:px-8">
        <header className="mb-8">
          <h1 className="font-display text-headline-lg text-on-background">Property Settings</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Enter the property information used by the price and occupancy prediction models.
          </p>
        </header>

        <div className="grid gap-6">
          <SettingsSection icon={MapPin} title="Location">
            <div className="grid gap-6 md:grid-cols-2">
              <SelectMenu
                label="City"
                value={property.city}
                options={cityOptions}
                changed={isChanged("city")}
                savedValue={savedProperty.city}
                onChange={setCity}
              />
              <SelectMenu
                label="Neighbourhood"
                value={property.neighbourhood_cleansed}
                options={availableNeighbourhoods}
                changed={isChanged("neighbourhood_cleansed")}
                savedValue={savedProperty.neighbourhood_cleansed}
                onChange={(value) => setField("neighbourhood_cleansed", value)}
              />
              <Field label="Latitude" changed={isChanged("latitude")} savedValue={savedProperty.latitude}>
                <input
                  className={`field-shell border ${modifiedClasses(isChanged("latitude"))}`}
                  type="number"
                  step="0.000001"
                  value={property.latitude}
                  onChange={(event) => setField("latitude", numberValue(event.target.value))}
                />
              </Field>
              <Field label="Longitude" changed={isChanged("longitude")} savedValue={savedProperty.longitude}>
                <input
                  className={`field-shell border ${modifiedClasses(isChanged("longitude"))}`}
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
                zoom={13}
                showTooltip
                onLocationChange={(location) => dispatch(updatePropertyFields(location))}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={Building2} title="Property Details">
            <div className="grid gap-6 md:grid-cols-2">
              <SelectMenu
                label="Property type"
                value={property.property_type}
                options={propertyTypeOptions}
                changed={isChanged("property_type")}
                savedValue={savedProperty.property_type}
                onChange={(value) => setField("property_type", value)}
              />
              <SelectMenu
                label="Room type"
                value={property.room_type}
                options={roomTypeOptions}
                changed={isChanged("room_type")}
                savedValue={savedProperty.room_type}
                onChange={(value) => setField("room_type", value)}
              />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CounterInput
                label="Accommodates"
                min={1}
                value={property.accommodates}
                changed={isChanged("accommodates")}
                onChange={(value) => setField("accommodates", value)}
              />
              <CounterInput
                label="Bathrooms"
                min={1}
                value={property.bathrooms}
                changed={isChanged("bathrooms")}
                onChange={(value) => setField("bathrooms", value)}
              />
              <CounterInput
                label="Bedrooms"
                min={0}
                value={property.bedrooms}
                changed={isChanged("bedrooms")}
                onChange={(value) => setField("bedrooms", value)}
              />
              <CounterInput
                label="Beds"
                min={1}
                value={property.beds}
                changed={isChanged("beds")}
                onChange={(value) => setField("beds", value)}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={CheckCircle2} title="Amenities">
            <div
              className={`rounded-2xl border p-4 transition ${modifiedClasses(isChanged("amenities"))}`}
            >
              <div className="mb-3 flex min-h-5 items-center justify-between gap-3">
                <span className="text-label-md text-on-surface-variant">Selectable amenities</span>
                {isChanged("amenities") && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-on-primary">Modified</span>
                )}
              </div>
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
              {isChanged("amenities") && (
                <p className="mt-3 text-[11px] font-semibold text-primary">Saved: {savedProperty.amenities.join(", ")}</p>
              )}
            </div>
          </SettingsSection>

          <SettingsSection icon={CalendarClock} title="Booking Rules">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-5">
                <Field label="Minimum nights" changed={isChanged("minimum_nights")} savedValue={savedProperty.minimum_nights}>
                  <input
                    className={`field-shell border ${modifiedClasses(isChanged("minimum_nights"))}`}
                    type="number"
                    min="1"
                    value={property.minimum_nights}
                    onChange={(event) => setField("minimum_nights", Math.max(1, numberValue(event.target.value)))}
                  />
                </Field>
                <Field label="Maximum nights" changed={isChanged("maximum_nights")} savedValue={savedProperty.maximum_nights}>
                  <input
                    className={`field-shell border ${modifiedClasses(isChanged("maximum_nights"))}`}
                    type="number"
                    min="1"
                    value={property.maximum_nights}
                    onChange={(event) => setField("maximum_nights", Math.max(1, numberValue(event.target.value)))}
                  />
                </Field>
              </div>
              <div className="grid content-center gap-4">
                <ToggleInput
                  label="Instant bookable"
                  description="Allow immediate reservation approval"
                  checked={property.instant_bookable}
                  changed={isChanged("instant_bookable")}
                  onChange={(value) => setField("instant_bookable", value)}
                />
                <ToggleInput
                  label="Has availability"
                  description="Listing can receive bookings"
                  checked={property.has_availability}
                  changed={isChanged("has_availability")}
                  onChange={(value) => setField("has_availability", value)}
                />
              </div>
            </div>
          </SettingsSection>

          <BottomActionBar onReset={handleReset} onSave={saveCurrentSettings} onRunSimulation={handleRunSimulation} />
        </div>
      </main>
    </div>
  );
}
