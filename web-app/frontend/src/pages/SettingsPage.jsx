import {
  BadgeEuro,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
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
  cityOptions,
  cityProfiles,
  defaultPredictions,
  defaultPropertySettings,
  propertyTypeOptions,
  roomTypeOptions,
} from "../data/mockData.js";
import { resetPredictions, setPredictions } from "../features/predictions/predictionsSlice.js";
import {
  addAvailableAmenity,
  addReview,
  deleteReview,
  removeAvailableAmenity,
  resetProperty,
  toggleAmenity,
  updatePropertyField,
  updatePropertyFields,
  updateReview,
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
  const [newAmenity, setNewAmenity] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewText, setEditingReviewText] = useState("");

  const availableNeighbourhoods = useMemo(() => {
    return cityProfiles[property.city]?.neighbourhoods ?? cityProfiles.Florence.neighbourhoods;
  }, [property.city]);

  useEffect(() => {
    savePropertyDraft(property);
  }, [property]);

  const isChanged = (field) => !valuesEqual(property[field], savedProperty[field]);
  const availableAmenities = property.available_amenities ?? [];
  const selectedAmenities = property.amenities ?? [];
  const reviews = property.reviews ?? [];
  const normalizedNewAmenity = newAmenity.trim().toLowerCase();
  const canAddAmenity =
    Boolean(normalizedNewAmenity) &&
    !availableAmenities.some((amenity) => amenity.trim().toLowerCase() === normalizedNewAmenity);
  const hasAmenitiesChanged = isChanged("available_amenities") || isChanged("amenities");

  const setField = (field, value) => {
    dispatch(updatePropertyField({ field, value }));
  };

  const addAmenity = () => {
    if (!canAddAmenity) {
      return;
    }

    dispatch(addAvailableAmenity(newAmenity.trim()));
    setNewAmenity("");
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
      <main className="mx-auto w-full max-w-[920px] px-5 pb-72 pt-8 sm:pb-44 md:px-8">
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
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
              <div>
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
              <div className="flex items-center rounded-xl border border-outline-variant/65 bg-surface-container-lowest px-4 py-3 text-label-sm text-on-surface-variant">
                Current or desired listing price per night.
              </div>
            </div>
          </SettingsSection>

          <SettingsSection icon={CheckCircle2} title="Amenities">
            <div
              className={`rounded-2xl border p-4 transition ${modifiedClasses(hasAmenitiesChanged)}`}
            >
              <div className="mb-3 flex min-h-5 items-center justify-between gap-3">
                <span className="text-label-md text-on-surface-variant">Selectable amenities</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {availableAmenities.map((amenity) => (
                  <AmenityPill
                    key={amenity}
                    label={amenity}
                    selected={selectedAmenities.includes(amenity)}
                    onToggle={() => dispatch(toggleAmenity(amenity))}
                    onRemove={() => dispatch(removeAvailableAmenity(amenity))}
                  />
                ))}
                <span className="inline-flex min-h-[38px] items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-lowest text-label-md shadow-ambient-soft">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(event) => setNewAmenity(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addAmenity();
                      }
                    }}
                    placeholder="New amenity"
                    className="h-full min-w-[160px] bg-transparent px-4 py-2 text-on-surface outline-none placeholder:text-on-surface-variant/70"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    disabled={!canAddAmenity}
                    className="flex h-full min-h-[38px] w-11 items-center justify-center border-l border-outline-variant text-primary transition hover:bg-primary-fixed disabled:cursor-not-allowed disabled:text-on-surface-variant/45 disabled:hover:bg-transparent"
                    aria-label="Add amenity"
                  >
                    <Plus size={18} />
                  </button>
                </span>
              </div>
              {hasAmenitiesChanged && (
                <p className="mt-3 text-[11px] font-semibold text-primary">
                  Saved selected: {(savedProperty.amenities ?? []).join(", ")}
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
                  <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
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
                    <div className="flex items-center rounded-xl border border-outline-variant/65 bg-surface-container-lowest px-4 py-3 text-label-sm text-on-surface-variant">
                      Average number of days between two guest reviews.
                    </div>
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

          <BottomActionBar onReset={handleReset} onSave={saveCurrentSettings} onRunSimulation={handleRunSimulation} />
        </div>
      </main>
    </div>
  );
}
