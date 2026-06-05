import {
  BadgeEuro,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
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
  addReview,
  deleteReview,
  resetProperty,
  setVisibleAmenities,
  toggleAmenity,
  updatePropertyField,
  updatePropertyFields,
  updateReview,
} from "../features/property/propertySlice.js";
import { generateMockPredictions } from "../services/mockPredictionService.js";
import { occupancyPredictionFromApi, predictOccupancy } from "../services/apiService.js";
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

function orderedAmenityList(amenities) {
  const amenitySet = new Set(amenities ?? []);
  return [
    ...amenityOptions.filter((amenity) => amenitySet.has(amenity)),
    ...(amenities ?? []).filter((amenity) => !amenityOptions.includes(amenity)).sort(),
  ];
}

function numberValue(value) {
  return Number.isNaN(Number(value)) ? 0 : Number(value);
}

function positiveIntegerValue(value) {
  return Math.max(1, Math.trunc(numberValue(value)));
}

function modifiedClasses(changed) {
  return changed
    ? "border-primary bg-primary-fixed/45 shadow-[0_0_0_2px_rgba(181,35,48,0.08)]"
    : "border-outline-variant bg-surface-container-lowest";
}

function controlClasses(changed, extraClasses = "") {
  return `w-full rounded-xl border px-4 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-fixed ${modifiedClasses(
    changed,
  )} ${extraClasses}`;
}

function Field({ label, changed, savedValue, children }) {
  return (
    <div className="grid gap-3">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label className="text-label-md text-on-surface-variant">{label}</label>
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
          className={`flex min-h-[56px] w-full items-center justify-between rounded-xl border px-4 text-left text-body-md font-bold text-on-surface transition ${modifiedClasses(
            changed,
          )}`}
        >
          <span>{value}</span>
          <ChevronDown size={20} className={`text-on-surface transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="no-scrollbar absolute left-0 right-0 top-[calc(100%+10px)] z-[900] max-h-[236px] overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-ambient">
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
  const [amenityManagerOpen, setAmenityManagerOpen] = useState(false);
  const [draftVisibleAmenities, setDraftVisibleAmenities] = useState([]);
  const [amenitySearch, setAmenitySearch] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewText, setEditingReviewText] = useState("");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState("");

  const availableNeighbourhoods = useMemo(() => {
    return cityProfiles[property.city]?.neighbourhoods ?? cityProfiles.Florence.neighbourhoods;
  }, [property.city]);

  useEffect(() => {
    savePropertyDraft(property);
  }, [property]);

  const isChanged = (field) => !valuesEqual(property[field], savedProperty[field]);
  const visibleAmenities = orderedAmenityList(property.available_amenities ?? []);
  const savedVisibleAmenities = orderedAmenityList(savedProperty.available_amenities ?? []);
  const selectedAmenities = orderedAmenityList(property.amenities ?? []);
  const savedSelectedAmenities = orderedAmenityList(savedProperty.amenities ?? []);
  const reviews = property.reviews ?? [];
  const hasAmenitiesChanged =
    !valuesEqual(visibleAmenities, savedVisibleAmenities) || !valuesEqual(selectedAmenities, savedSelectedAmenities);
  const normalizedAmenitySearch = amenitySearch.trim().toLowerCase();
  const filteredShownAmenities = orderedAmenityList(draftVisibleAmenities).filter((amenity) =>
    amenity.toLowerCase().includes(normalizedAmenitySearch),
  );
  const filteredHiddenAmenities = amenityOptions.filter(
    (amenity) =>
      !draftVisibleAmenities.includes(amenity) && amenity.toLowerCase().includes(normalizedAmenitySearch),
  );

  const setField = (field, value) => {
    dispatch(updatePropertyField({ field, value }));
  };

  const openAmenityManager = () => {
    setDraftVisibleAmenities(visibleAmenities);
    setAmenitySearch("");
    setAmenityManagerOpen(true);
  };

  const closeAmenityManager = () => {
    setAmenityManagerOpen(false);
    setDraftVisibleAmenities([]);
    setAmenitySearch("");
  };

  const toggleDraftAmenity = (amenity) => {
    setDraftVisibleAmenities((currentAmenities) =>
      currentAmenities.includes(amenity)
        ? currentAmenities.filter((currentAmenity) => currentAmenity !== amenity)
        : [...currentAmenities, amenity],
    );
  };

  const applyVisibleAmenities = () => {
    dispatch(setVisibleAmenities(draftVisibleAmenities));
    closeAmenityManager();
  };

  const addManualReview = () => {
    const text = newReviewText.trim();
    if (!text) {
      return;
    }

    dispatch(
      addReview({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
      }),
    );
    setNewReviewText("");
  };

  const startEditingReview = (review) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.text);
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    setEditingReviewText("");
  };

  const saveEditingReview = () => {
    const text = editingReviewText.trim();
    if (!text) {
      return;
    }

    dispatch(updateReview({ id: editingReviewId, text }));
    cancelEditingReview();
  };

  const removeReview = (id) => {
    dispatch(deleteReview(id));
    if (editingReviewId === id) {
      cancelEditingReview();
    }
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

  const handleRunSimulation = async () => {
    setSimulationLoading(true);
    setSimulationError("");

    try {
      const pricePrediction = generateMockPredictions(property).price;
      const occupancyApiPrediction = await predictOccupancy("xgboost", property);
      const occupancyPrediction = occupancyPredictionFromApi(occupancyApiPrediction, pricePrediction);
      const predictions = {
        price: pricePrediction,
        occupancy: occupancyPrediction,
      };

      dispatch(setPredictions(predictions));
      savePropertySettings(property);
      saveMockPredictions(predictions);
      clearPropertyDraft();
      setSavedProperty(property);
      navigate("/dashboard");
    } catch (error) {
      setSimulationError(error instanceof Error ? error.message : "Unable to run occupancy prediction.");
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header mode="settings" />
      <main className="mx-auto w-full max-w-[920px] px-5 pb-72 pt-8 sm:pb-44 md:px-8">
        <header className="mb-8">
          <h1 className="font-display text-headline-lg text-on-background">Property Settings</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Enter the property information used by the price and occupancy prediction models.
          </p>
          {simulationError && (
            <div className="mt-5 rounded-xl border border-error/30 bg-primary-fixed px-4 py-3 text-label-md text-on-primary-fixed">
              {simulationError}
            </div>
          )}
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
                  className={controlClasses(isChanged("latitude"), "min-h-[56px]")}
                  type="number"
                  step="0.000001"
                  value={property.latitude}
                  onChange={(event) => setField("latitude", numberValue(event.target.value))}
                />
              </Field>
              <Field label="Longitude" changed={isChanged("longitude")} savedValue={savedProperty.longitude}>
                <input
                  className={controlClasses(isChanged("longitude"), "min-h-[56px]")}
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
            <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">
              <CounterInput
                label="Accommodates"
                min={1}
                value={property.accommodates}
                changed={isChanged("accommodates")}
                savedValue={savedProperty.accommodates}
                onChange={(value) => setField("accommodates", value)}
              />
              <CounterInput
                label="Bathrooms"
                min={1}
                value={property.bathrooms}
                changed={isChanged("bathrooms")}
                savedValue={savedProperty.bathrooms}
                onChange={(value) => setField("bathrooms", value)}
              />
              <CounterInput
                label="Bedrooms"
                min={0}
                value={property.bedrooms}
                changed={isChanged("bedrooms")}
                savedValue={savedProperty.bedrooms}
                onChange={(value) => setField("bedrooms", value)}
              />
              <CounterInput
                label="Beds"
                min={1}
                value={property.beds}
                changed={isChanged("beds")}
                savedValue={savedProperty.beds}
                onChange={(value) => setField("beds", value)}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={BadgeEuro} title="Pricing">
            <div className="max-w-[560px]">
              <Field label="Nightly price" changed={isChanged("nightly_price")} savedValue={savedProperty.nightly_price}>
                <div className="flex min-h-[56px] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
                  <input
                    className={`min-w-0 flex-1 px-4 text-body-md text-on-surface outline-none ${modifiedClasses(
                      isChanged("nightly_price"),
                    )}`}
                    type="number"
                    min="0"
                    step="1"
                    value={property.nightly_price}
                    onChange={(event) => setField("nightly_price", Math.max(0, numberValue(event.target.value)))}
                  />
                  <span className="flex items-center border-l border-outline-variant bg-surface-container px-4 text-label-md text-on-surface-variant">
                    €/night
                  </span>
                </div>
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection icon={CheckCircle2} title="Amenities">
            <div
              className={`rounded-2xl border p-4 transition ${modifiedClasses(hasAmenitiesChanged)}`}
            >
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="grid gap-1">
                  <span className="text-label-md text-on-surface-variant">
                    Shown amenities {visibleAmenities.length} / {amenityOptions.length}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    Selected {selectedAmenities.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openAmenityManager}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                >
                  <SlidersHorizontal size={17} />
                  Manage amenities
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {visibleAmenities.length > 0 ? (
                  visibleAmenities.map((amenity) => (
                    <AmenityPill
                      key={amenity}
                      label={amenity}
                      selected={selectedAmenities.includes(amenity)}
                      onToggle={() => dispatch(toggleAmenity(amenity))}
                    />
                  ))
                ) : (
                  <p className="text-body-md text-on-surface-variant">No amenities are shown.</p>
                )}
              </div>
              {hasAmenitiesChanged && (
                <p className="mt-3 text-[11px] font-semibold text-primary">
                  Saved selected: {savedSelectedAmenities.length > 0 ? savedSelectedAmenities.join(", ") : "None"}
                </p>
              )}
            </div>
          </SettingsSection>

          <SettingsSection icon={CalendarClock} title="Booking Rules">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Minimum nights" changed={isChanged("minimum_nights")} savedValue={savedProperty.minimum_nights}>
                <input
                  className={controlClasses(isChanged("minimum_nights"), "min-h-[56px]")}
                  type="number"
                  min="1"
                  value={property.minimum_nights}
                  onChange={(event) => setField("minimum_nights", Math.max(1, numberValue(event.target.value)))}
                />
              </Field>
              <ToggleInput
                label="Instant bookable"
                description="Allow immediate reservation approval"
                checked={property.instant_bookable}
                changed={isChanged("instant_bookable")}
                onChange={(value) => setField("instant_bookable", value)}
              />
              <Field label="Maximum nights" changed={isChanged("maximum_nights")} savedValue={savedProperty.maximum_nights}>
                <input
                  className={controlClasses(isChanged("maximum_nights"), "min-h-[56px]")}
                  type="number"
                  min="1"
                  value={property.maximum_nights}
                  onChange={(event) => setField("maximum_nights", Math.max(1, numberValue(event.target.value)))}
                />
              </Field>
              <ToggleInput
                label="Has availability"
                description="Listing can receive bookings"
                checked={property.has_availability}
                changed={isChanged("has_availability")}
                onChange={(value) => setField("has_availability", value)}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={MessageSquareText} title="Reviews">
            <div className="grid gap-6">
              <ToggleInput
                label="Has reviews"
                description="Enable review data if the property already has guest reviews"
                checked={property.has_reviews}
                changed={isChanged("has_reviews")}
                onChange={(value) => setField("has_reviews", value)}
              />

              {!property.has_reviews ? (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-5 py-6 text-body-md text-on-surface-variant">
                  No review data will be used for this property.
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="max-w-[560px]">
                    <Field
                      label="Review frequency"
                      changed={isChanged("review_frequency_days")}
                      savedValue={savedProperty.review_frequency_days}
                    >
                      <div className="flex min-h-[56px] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
                        <input
                          className={`min-w-0 flex-1 px-4 text-body-md text-on-surface outline-none ${modifiedClasses(
                            isChanged("review_frequency_days"),
                          )}`}
                          type="number"
                          min="1"
                          step="1"
                          value={property.review_frequency_days}
                          onChange={(event) => setField("review_frequency_days", positiveIntegerValue(event.target.value))}
                        />
                        <span className="flex items-center border-l border-outline-variant bg-surface-container px-4 text-label-md text-on-surface-variant">
                          days
                        </span>
                      </div>
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                    <label className="text-label-md text-on-surface-variant">Manual reviews</label>
                    <textarea
                      value={newReviewText}
                      onChange={(event) => setNewReviewText(event.target.value)}
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-fixed"
                      placeholder="Great apartment, very clean and close to the city center."
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={addManualReview}
                        disabled={!newReviewText.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-label-md text-on-primary shadow-ambient-soft transition hover:bg-tertiary disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-on-surface-variant"
                      >
                        <Plus size={18} />
                        Add review
                      </button>
                    </div>
                  </div>

                  {reviews.length > 0 && (
                    <div className="grid gap-3">
                      {reviews.map((review) => {
                        const isEditing = editingReviewId === review.id;
                        const canSaveReview = editingReviewText.trim().length > 0;

                        return (
                          <article
                            key={review.id}
                            className="rounded-2xl border border-outline-variant/75 bg-surface-container-lowest p-4 shadow-ambient-soft"
                          >
                            {isEditing ? (
                              <textarea
                                value={editingReviewText}
                                onChange={(event) => setEditingReviewText(event.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-fixed"
                              />
                            ) : (
                              <p className="text-body-md text-on-surface">{review.text}</p>
                            )}

                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveEditingReview}
                                    disabled={!canSaveReview}
                                    className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-label-md text-primary transition hover:bg-primary-fixed disabled:cursor-not-allowed disabled:border-outline-variant disabled:text-on-surface-variant/55 disabled:hover:bg-transparent"
                                  >
                                    <Save size={16} />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingReview}
                                    className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingReview(review)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                                >
                                  <Pencil size={16} />
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeReview(review.id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-error hover:text-error"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SettingsSection>

          <BottomActionBar
            onReset={handleReset}
            onSave={saveCurrentSettings}
            onRunSimulation={handleRunSimulation}
            simulationLoading={simulationLoading}
          />
        </div>
      </main>
      {amenityManagerOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            aria-label="Close amenities manager"
            onClick={closeAmenityManager}
            className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
          />
          <section className="relative z-10 flex max-h-[82vh] w-full max-w-[760px] flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-8">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-headline-md text-on-surface">Manage amenities</h3>
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {draftVisibleAmenities.length} shown of {amenityOptions.length}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAmenityManager}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface shadow-ambient-soft transition hover:border-primary hover:text-primary self-start sm:self-auto"
                aria-label="Close amenities manager"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 flex min-h-[52px] items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
              <Search size={18} className="shrink-0 text-on-surface-variant" />
              <input
                type="text"
                value={amenitySearch}
                onChange={(event) => setAmenitySearch(event.target.value)}
                placeholder="Search amenities"
                className="min-w-0 flex-1 bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
              />
              {amenitySearch && (
                <button
                  type="button"
                  onClick={() => setAmenitySearch("")}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface transition hover:bg-surface-container"
                  aria-label="Clear amenities search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="no-scrollbar grid max-h-[52vh] gap-6 overflow-y-auto pr-1">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-label-md text-on-surface">Shown amenities</h4>
                  <span className="text-label-sm text-on-surface-variant">{filteredShownAmenities.length}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredShownAmenities.length > 0 ? (
                    filteredShownAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleDraftAmenity(amenity)}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-primary bg-primary-fixed/55 px-4 py-3 text-left text-label-md text-on-primary-fixed transition hover:bg-primary-fixed"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                          <Check size={15} />
                        </span>
                        <span>{amenity}</span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md text-on-surface-variant sm:col-span-2">
                      No shown amenities match your search.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-label-md text-on-surface">Hidden amenities</h4>
                  <span className="text-label-sm text-on-surface-variant">{filteredHiddenAmenities.length}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredHiddenAmenities.length > 0 ? (
                    filteredHiddenAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleDraftAmenity(amenity)}
                        className="flex min-h-12 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                      >
                        <span className="h-6 w-6 shrink-0 rounded-lg border border-outline-variant bg-surface-container-lowest" />
                        <span>{amenity}</span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md text-on-surface-variant sm:col-span-2">
                      No hidden amenities match your search.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={applyVisibleAmenities}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-label-md text-on-primary shadow-ambient-soft transition hover:bg-tertiary"
              >
                <Save size={18} />
                Apply
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
