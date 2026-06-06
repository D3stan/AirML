import {
  BadgeEuro,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Languages,
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
import { fetchSettingsOptions, occupancyPredictionFromApi, predictOccupancy, predictPrice, pricePredictionFromApi } from "../services/apiService.js";
import {
  clearPropertyDraft,
  loadSavedPropertySettings,
  saveMockPredictions,
  savePropertyDraft,
  savePropertySettings,
} from "../utils/storage.js";
import { labelFor, optionSearchText, textBundle } from "../utils/i18n.js";

const translations = {
  en: {
    pageTitle: "Property Settings",
    pageSubtitle: "Enter the property information used by the price and occupancy prediction models.",
    languageSection: "Language",
    english: "English",
    italian: "Italiano",
    location: "Location",
    city: "City",
    neighbourhood: "Neighbourhood",
    latitude: "Latitude",
    longitude: "Longitude",
    searchCity: "Search city",
    searchNeighbourhood: "Search neighbourhood",
    searchOption: "Search option",
    noOptions: "No options match your search.",
    propertyDetails: "Property Details",
    propertyType: "Property type",
    roomType: "Room type",
    accommodates: "Accommodates",
    bathrooms: "Bathrooms",
    bedrooms: "Bedrooms",
    beds: "Beds",
    pricing: "Pricing",
    nightlyPrice: "Nightly price",
    amenities: "Amenities",
    shownAmenities: "Shown amenities",
    selected: "Selected",
    manageAmenities: "Manage amenities",
    noAmenitiesShown: "No amenities are shown.",
    savedSelected: "Saved selected",
    none: "None",
    bookingRules: "Booking Rules",
    minimumNights: "Minimum nights",
    maximumNights: "Maximum nights",
    instantBookable: "Instant bookable",
    instantBookableDescription: "Allow immediate reservation approval",
    hasAvailability: "Has availability",
    hasAvailabilityDescription: "Listing can receive bookings",
    reviews: "Reviews",
    hasReviews: "Has reviews",
    hasReviewsDescription: "Enable review data if the property already has guest reviews",
    noReviews: "No review data will be used for this property.",
    reviewSpan: "Host active for",
    days: "days",
    manualReviews: "Manual reviews",
    addReview: "Add review",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    saved: "Saved",
    fallbackOptions: "Using fallback settings options:",
    simulationError: "Unable to run model prediction.",
  },
  it: {
    pageTitle: "Impostazioni proprietà",
    pageSubtitle: "Inserisci le informazioni usate dai modelli di prezzo e occupazione.",
    languageSection: "Lingua",
    english: "English",
    italian: "Italiano",
    location: "Posizione",
    city: "Città",
    neighbourhood: "Quartiere",
    latitude: "Latitudine",
    longitude: "Longitudine",
    searchCity: "Cerca città",
    searchNeighbourhood: "Cerca quartiere",
    searchOption: "Cerca opzione",
    noOptions: "Nessuna opzione corrisponde alla ricerca.",
    propertyDetails: "Dettagli proprietà",
    propertyType: "Tipologia alloggio",
    roomType: "Tipo stanza",
    accommodates: "Ospiti",
    bathrooms: "Bagni",
    bedrooms: "Camere",
    beds: "Letti",
    pricing: "Prezzo",
    nightlyPrice: "Prezzo a notte",
    amenities: "Servizi",
    shownAmenities: "Servizi mostrati",
    selected: "Selezionati",
    manageAmenities: "Gestisci servizi",
    noAmenitiesShown: "Nessun servizio mostrato.",
    savedSelected: "Selezionati salvati",
    none: "Nessuno",
    bookingRules: "Regole prenotazione",
    minimumNights: "Notti minime",
    maximumNights: "Notti massime",
    instantBookable: "Prenotazione immediata",
    instantBookableDescription: "Permette conferme di prenotazione immediate",
    hasAvailability: "Disponibilità attiva",
    hasAvailabilityDescription: "L'alloggio può ricevere prenotazioni",
    reviews: "Recensioni",
    hasReviews: "Ha recensioni",
    hasReviewsDescription: "Abilita i dati recensione se l'alloggio ha già recensioni",
    noReviews: "Nessun dato recensione verrà usato per questa proprietà.",
    reviewSpan: "Host attivo da",
    days: "giorni",
    manualReviews: "Recensioni manuali",
    addReview: "Aggiungi recensione",
    save: "Salva",
    cancel: "Annulla",
    edit: "Modifica",
    delete: "Elimina",
    saved: "Salvato",
    fallbackOptions: "Uso opzioni di fallback:",
    simulationError: "Impossibile eseguire la predizione dei modelli.",
  },
};

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function orderedAmenityList(amenities, availableOptions = amenityOptions) {
  const amenitySet = new Set(amenities ?? []);
  return [
    ...availableOptions.filter((amenity) => amenitySet.has(amenity)),
    ...(amenities ?? []).filter((amenity) => !availableOptions.includes(amenity)).sort(),
  ];
}

function cityProfilesFromOptions(options) {
  if (!options?.cities?.length) {
    return cityProfiles;
  }

  return options.cities.reduce((profiles, city) => {
    const localProfile = cityProfiles[city.label] ?? {};
    profiles[city.label] = {
      ...localProfile,
      id: city.id,
      latitude: city.latitude ?? localProfile.latitude,
      longitude: city.longitude ?? localProfile.longitude,
      neighbourhoods: options.neighbourhoodsByCity?.[city.id] ?? localProfile.neighbourhoods ?? [],
      neighbourhoodCoordinates: localProfile.neighbourhoodCoordinates ?? {},
    };
    return profiles;
  }, {});
}

function coordinatesForNeighbourhood(cityProfile, neighbourhood) {
  const knownCoordinates = cityProfile?.neighbourhoodCoordinates?.[neighbourhood];
  if (knownCoordinates) {
    return knownCoordinates;
  }

  return {
    latitude: Number(cityProfile?.latitude ?? 0),
    longitude: Number(cityProfile?.longitude ?? 0),
  };
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

function Field({ label, changed, savedValue, savedLabel, children }) {
  return (
    <div className="grid gap-3">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label className="text-label-md text-on-surface-variant">{label}</label>
      </div>
      {children}
      {changed && <span className="text-[11px] font-semibold text-primary">{savedLabel}: {String(savedValue)}</span>}
    </div>
  );
}

function SelectMenu({ label, value, options, onChange, changed, savedValue, texts, searchPlaceholder, language, optionType = "raw" }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const selectedLabel = labelFor(language, optionType, value);
  const filteredOptions = options.filter((option) => optionSearchText(language, optionType, option).includes(normalizedSearch));

  useEffect(() => {
    const closeMenu = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <Field label={label} changed={changed} savedValue={labelFor(language, optionType, savedValue)} savedLabel={texts.saved}>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-[56px] w-full items-center justify-between rounded-xl border px-4 text-left text-body-md font-bold text-on-surface transition ${modifiedClasses(
            changed,
          )}`}
        >
          <span>{selectedLabel}</span>
          <ChevronDown size={20} className={`text-on-surface transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[900] rounded-2xl border border-outline-variant bg-surface-container-lowest p-2 shadow-ambient">
            <div className="mb-2 flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
              <Search size={17} className="shrink-0 text-on-surface-variant" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder ?? texts.searchOption}
                className="min-w-0 flex-1 bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-on-surface transition hover:bg-surface-container"
                  aria-label={texts.clearSearch}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="no-scrollbar max-h-[236px] overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
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
                    {labelFor(language, optionType, option)}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-body-md text-on-surface-variant">{texts.noOptions}</p>
              )}
            </div>
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
  const language = property.language === "it" ? "it" : "en";
  const texts = textBundle(language);
  const [savedProperty, setSavedProperty] = useState(() => loadSavedPropertySettings(defaultPropertySettings));
  const [amenityManagerOpen, setAmenityManagerOpen] = useState(false);
  const [draftVisibleAmenities, setDraftVisibleAmenities] = useState([]);
  const [amenitySearch, setAmenitySearch] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewText, setEditingReviewText] = useState("");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState("");
  const [settingsOptions, setSettingsOptions] = useState(null);
  const [settingsOptionsError, setSettingsOptionsError] = useState("");

  const effectiveCityProfiles = useMemo(() => cityProfilesFromOptions(settingsOptions), [settingsOptions]);
  const effectiveCityOptions = useMemo(() => Object.keys(effectiveCityProfiles), [effectiveCityProfiles]);
  const effectiveAmenityOptions = settingsOptions?.amenities ?? amenityOptions;
  const effectivePropertyTypeOptions = settingsOptions?.propertyTypes ?? propertyTypeOptions;
  const effectiveRoomTypeOptions = settingsOptions?.roomTypes ?? roomTypeOptions;

  const availableNeighbourhoods = useMemo(() => {
    return effectiveCityProfiles[property.city]?.neighbourhoods ?? effectiveCityProfiles.Florence?.neighbourhoods ?? [];
  }, [effectiveCityProfiles, property.city]);

  useEffect(() => {
    savePropertyDraft(property);
  }, [property]);

  useEffect(() => {
    let active = true;

    fetchSettingsOptions()
      .then((options) => {
        if (active) {
          setSettingsOptions(options);
          setSettingsOptionsError("");
        }
      })
      .catch((error) => {
        if (active) {
          setSettingsOptionsError(error instanceof Error ? error.message : "Unable to load model settings options.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settingsOptions) {
      return;
    }

    const nextFields = {};
    const profile = effectiveCityProfiles[property.city] ?? effectiveCityProfiles.Rome;
    if (profile && !effectiveCityProfiles[property.city]) {
      const neighbourhood = profile.neighbourhoods[0] ?? "";
      nextFields.city = "Rome";
      nextFields.neighbourhood_cleansed = neighbourhood;
      Object.assign(nextFields, coordinatesForNeighbourhood(profile, neighbourhood));
    } else if (profile && !profile.neighbourhoods.includes(property.neighbourhood_cleansed)) {
      const neighbourhood = profile.neighbourhoods[0] ?? "";
      nextFields.neighbourhood_cleansed = neighbourhood;
      Object.assign(nextFields, coordinatesForNeighbourhood(profile, neighbourhood));
    }

    if (!effectivePropertyTypeOptions.includes(property.property_type)) {
      nextFields.property_type = effectivePropertyTypeOptions.includes("Other") ? "Other" : effectivePropertyTypeOptions[0];
    }
    if (!effectiveRoomTypeOptions.includes(property.room_type)) {
      nextFields.room_type = effectiveRoomTypeOptions.includes("Entire home/apt") ? "Entire home/apt" : effectiveRoomTypeOptions[0];
    }

    const allowedAmenities = new Set(effectiveAmenityOptions);
    const nextAmenities = (property.amenities ?? []).filter((amenity) => allowedAmenities.has(amenity));
    const nextVisibleAmenities = (property.available_amenities ?? []).filter((amenity) => allowedAmenities.has(amenity));
    if (!valuesEqual(nextAmenities, property.amenities)) {
      nextFields.amenities = orderedAmenityList(nextAmenities, effectiveAmenityOptions);
    }
    if (!valuesEqual(nextVisibleAmenities, property.available_amenities)) {
      nextFields.available_amenities = orderedAmenityList(
        nextVisibleAmenities.length > 0 ? nextVisibleAmenities : effectiveAmenityOptions.slice(0, 14),
        effectiveAmenityOptions,
      );
    }

    if (Object.keys(nextFields).length > 0) {
      dispatch(updatePropertyFields(nextFields));
    }
  }, [
    dispatch,
    effectiveAmenityOptions,
    effectiveCityProfiles,
    effectivePropertyTypeOptions,
    effectiveRoomTypeOptions,
    property.amenities,
    property.available_amenities,
    property.city,
    property.neighbourhood_cleansed,
    property.property_type,
    property.room_type,
    settingsOptions,
  ]);

  const isChanged = (field) => !valuesEqual(property[field], savedProperty[field]);
  const visibleAmenities = orderedAmenityList(property.available_amenities ?? [], effectiveAmenityOptions);
  const savedVisibleAmenities = orderedAmenityList(savedProperty.available_amenities ?? [], effectiveAmenityOptions);
  const selectedAmenities = orderedAmenityList(property.amenities ?? [], effectiveAmenityOptions);
  const savedSelectedAmenities = orderedAmenityList(savedProperty.amenities ?? [], effectiveAmenityOptions);
  const reviews = property.reviews ?? [];
  const hasAmenitiesChanged =
    !valuesEqual(visibleAmenities, savedVisibleAmenities) || !valuesEqual(selectedAmenities, savedSelectedAmenities);
  const normalizedAmenitySearch = amenitySearch.trim().toLowerCase();
  const filteredShownAmenities = orderedAmenityList(draftVisibleAmenities, effectiveAmenityOptions).filter((amenity) =>
    optionSearchText(language, "amenity", amenity).includes(normalizedAmenitySearch),
  );
  const filteredHiddenAmenities = effectiveAmenityOptions.filter(
    (amenity) =>
      !draftVisibleAmenities.includes(amenity) && optionSearchText(language, "amenity", amenity).includes(normalizedAmenitySearch),
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
    const cityProfile = effectiveCityProfiles[city];
    if (!cityProfile) {
      return;
    }
    const neighbourhood = cityProfile.neighbourhoods[0] ?? "";
    dispatch(
      updatePropertyFields({
        city,
        neighbourhood_cleansed: neighbourhood,
        ...coordinatesForNeighbourhood(cityProfile, neighbourhood),
      }),
    );
  };

  const setNeighbourhood = (neighbourhood) => {
    const cityProfile = effectiveCityProfiles[property.city] ?? effectiveCityProfiles.Rome;
    dispatch(
      updatePropertyFields({
        neighbourhood_cleansed: neighbourhood,
        ...coordinatesForNeighbourhood(cityProfile, neighbourhood),
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
      const priceApiPrediction = await predictPrice("logxgb", property);
      const pricePrediction = pricePredictionFromApi(priceApiPrediction);
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
      setSimulationError(error instanceof Error ? error.message : texts.simulationError);
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header mode="settings" />
      <main className="mx-auto w-full max-w-[920px] px-5 pb-72 pt-8 sm:pb-44 md:px-8">
        <header className="mb-8">
          <h1 className="font-display text-headline-lg text-on-background">{texts.pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            {texts.pageSubtitle}
          </p>
          {simulationError && (
            <div className="mt-5 rounded-xl border border-error/30 bg-primary-fixed px-4 py-3 text-label-md text-on-primary-fixed">
              {simulationError}
            </div>
          )}
          {settingsOptionsError && (
            <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md text-on-surface-variant">
              {texts.fallbackOptions} {settingsOptionsError}
            </div>
          )}
        </header>

        <div className="grid gap-6">
          <SettingsSection icon={Languages} title={texts.languageSection}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: "en", label: texts.english },
                { id: "it", label: texts.italian },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setField("language", option.id)}
                  className={`min-h-12 rounded-xl border px-4 text-label-md font-bold transition ${
                    language === option.id
                      ? "border-primary bg-primary text-on-primary shadow-ambient-soft"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection icon={MapPin} title={texts.location}>
            <div className="grid gap-6 md:grid-cols-2">
              <SelectMenu
                label={texts.city}
                value={property.city}
                options={effectiveCityOptions}
                changed={isChanged("city")}
                savedValue={savedProperty.city}
                onChange={setCity}
                texts={texts}
                searchPlaceholder={texts.searchCity}
                language={language}
              />
              <SelectMenu
                label={texts.neighbourhood}
                value={property.neighbourhood_cleansed}
                options={availableNeighbourhoods}
                changed={isChanged("neighbourhood_cleansed")}
                savedValue={savedProperty.neighbourhood_cleansed}
                onChange={setNeighbourhood}
                texts={texts}
                searchPlaceholder={texts.searchNeighbourhood}
                language={language}
              />
              <Field label={texts.latitude} changed={isChanged("latitude")} savedValue={savedProperty.latitude} savedLabel={texts.saved}>
                <input
                  className={controlClasses(isChanged("latitude"), "min-h-[56px]")}
                  type="number"
                  step="0.000001"
                  value={property.latitude}
                  onChange={(event) => setField("latitude", numberValue(event.target.value))}
                />
              </Field>
              <Field label={texts.longitude} changed={isChanged("longitude")} savedValue={savedProperty.longitude} savedLabel={texts.saved}>
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

          <SettingsSection icon={Building2} title={texts.propertyDetails}>
            <div className="grid gap-6 md:grid-cols-2">
              <SelectMenu
                label={texts.propertyType}
                value={property.property_type}
                options={effectivePropertyTypeOptions}
                changed={isChanged("property_type")}
                savedValue={savedProperty.property_type}
                onChange={(value) => setField("property_type", value)}
                texts={texts}
                language={language}
                optionType="propertyType"
              />
              <SelectMenu
                label={texts.roomType}
                value={property.room_type}
                options={effectiveRoomTypeOptions}
                changed={isChanged("room_type")}
                savedValue={savedProperty.room_type}
                onChange={(value) => setField("room_type", value)}
                texts={texts}
                language={language}
                optionType="roomType"
              />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">
              <CounterInput
                label={texts.accommodates}
                min={1}
                value={property.accommodates}
                changed={isChanged("accommodates")}
                savedValue={savedProperty.accommodates}
                savedLabel={texts.saved}
                decreaseLabel={texts.decrease}
                increaseLabel={texts.increase}
                onChange={(value) => setField("accommodates", value)}
              />
              <CounterInput
                label={texts.bathrooms}
                min={1}
                value={property.bathrooms}
                changed={isChanged("bathrooms")}
                savedValue={savedProperty.bathrooms}
                savedLabel={texts.saved}
                decreaseLabel={texts.decrease}
                increaseLabel={texts.increase}
                onChange={(value) => setField("bathrooms", value)}
              />
              <CounterInput
                label={texts.bedrooms}
                min={0}
                value={property.bedrooms}
                changed={isChanged("bedrooms")}
                savedValue={savedProperty.bedrooms}
                savedLabel={texts.saved}
                decreaseLabel={texts.decrease}
                increaseLabel={texts.increase}
                onChange={(value) => setField("bedrooms", value)}
              />
              <CounterInput
                label={texts.beds}
                min={1}
                value={property.beds}
                changed={isChanged("beds")}
                savedValue={savedProperty.beds}
                savedLabel={texts.saved}
                decreaseLabel={texts.decrease}
                increaseLabel={texts.increase}
                onChange={(value) => setField("beds", value)}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={BadgeEuro} title={texts.pricing}>
            <div className="max-w-[560px]">
              <Field label={texts.nightlyPrice} changed={isChanged("nightly_price")} savedValue={savedProperty.nightly_price} savedLabel={texts.saved}>
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
                    €{texts.perNight}
                  </span>
                </div>
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection icon={CheckCircle2} title={texts.amenities}>
            <div
              className={`rounded-2xl border p-4 transition ${modifiedClasses(hasAmenitiesChanged)}`}
            >
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="grid gap-1">
                  <span className="text-label-md text-on-surface-variant">
                    {texts.shownAmenities} {visibleAmenities.length} / {effectiveAmenityOptions.length}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    {texts.selected} {selectedAmenities.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openAmenityManager}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                >
                  <SlidersHorizontal size={17} />
                  {texts.manageAmenities}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {visibleAmenities.length > 0 ? (
                  visibleAmenities.map((amenity) => (
                    <AmenityPill
                      key={amenity}
                      label={labelFor(language, "amenity", amenity)}
                      selected={selectedAmenities.includes(amenity)}
                      onToggle={() => dispatch(toggleAmenity(amenity))}
                    />
                  ))
                ) : (
                  <p className="text-body-md text-on-surface-variant">{texts.noAmenitiesShown}</p>
                )}
              </div>
              {hasAmenitiesChanged && (
                <p className="mt-3 text-[11px] font-semibold text-primary">
                  {texts.savedSelected}:{" "}
                  {savedSelectedAmenities.length > 0
                    ? savedSelectedAmenities.map((amenity) => labelFor(language, "amenity", amenity)).join(", ")
                    : texts.none}
                </p>
              )}
            </div>
          </SettingsSection>

          <SettingsSection icon={CalendarClock} title={texts.bookingRules}>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label={texts.minimumNights} changed={isChanged("minimum_nights")} savedValue={savedProperty.minimum_nights} savedLabel={texts.saved}>
                <input
                  className={controlClasses(isChanged("minimum_nights"), "min-h-[56px]")}
                  type="number"
                  min="1"
                  value={property.minimum_nights}
                  onChange={(event) => setField("minimum_nights", Math.max(1, numberValue(event.target.value)))}
                />
              </Field>
              <ToggleInput
                label={texts.instantBookable}
                description={texts.instantBookableDescription}
                checked={property.instant_bookable}
                changed={isChanged("instant_bookable")}
                onChange={(value) => setField("instant_bookable", value)}
              />
              <Field label={texts.maximumNights} changed={isChanged("maximum_nights")} savedValue={savedProperty.maximum_nights} savedLabel={texts.saved}>
                <input
                  className={controlClasses(isChanged("maximum_nights"), "min-h-[56px]")}
                  type="number"
                  min="1"
                  value={property.maximum_nights}
                  onChange={(event) => setField("maximum_nights", Math.max(1, numberValue(event.target.value)))}
                />
              </Field>
              <ToggleInput
                label={texts.hasAvailability}
                description={texts.hasAvailabilityDescription}
                checked={property.has_availability}
                changed={isChanged("has_availability")}
                onChange={(value) => setField("has_availability", value)}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={MessageSquareText} title={texts.reviews}>
            <div className="grid gap-6">
              <ToggleInput
                label={texts.hasReviews}
                description={texts.hasReviewsDescription}
                checked={property.has_reviews}
                changed={isChanged("has_reviews")}
                onChange={(value) => setField("has_reviews", value)}
              />

              {!property.has_reviews ? (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-5 py-6 text-body-md text-on-surface-variant">
                  {texts.noReviews}
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="max-w-[560px]">
                    <Field
                      label={texts.reviewSpan}
                      changed={isChanged("review_span_days")}
                      savedValue={savedProperty.review_span_days}
                      savedLabel={texts.saved}
                    >
                      <div className="flex min-h-[56px] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed">
                        <input
                          className={`min-w-0 flex-1 px-4 text-body-md text-on-surface outline-none ${modifiedClasses(
                            isChanged("review_span_days"),
                          )}`}
                          type="number"
                          min="1"
                          step="1"
                          value={property.review_span_days}
                          onChange={(event) => setField("review_span_days", positiveIntegerValue(event.target.value))}
                        />
                        <span className="flex items-center border-l border-outline-variant bg-surface-container px-4 text-label-md text-on-surface-variant">
                          {texts.days}
                        </span>
                      </div>
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                    <label className="text-label-md text-on-surface-variant">{texts.manualReviews}</label>
                    <textarea
                      value={newReviewText}
                      onChange={(event) => setNewReviewText(event.target.value)}
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-fixed"
                      placeholder={texts.reviewPlaceholder}
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={addManualReview}
                        disabled={!newReviewText.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-label-md text-on-primary shadow-ambient-soft transition hover:bg-tertiary disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-on-surface-variant"
                      >
                        <Plus size={18} />
                        {texts.addReview}
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
                                    {texts.save}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingReview}
                                    className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                                  >
                                    <X size={16} />
                                    {texts.cancel}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingReview(review)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-primary hover:text-primary"
                                >
                                  <Pencil size={16} />
                                  {texts.edit}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeReview(review.id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface-variant transition hover:border-error hover:text-error"
                              >
                                <Trash2 size={16} />
                                {texts.delete}
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
            texts={texts}
          />
        </div>
      </main>
      {amenityManagerOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            aria-label={texts.amenitiesClose}
            onClick={closeAmenityManager}
            className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
          />
          <section className="relative z-10 flex max-h-[82vh] w-full max-w-[760px] flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-ambient md:p-8">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-headline-md text-on-surface">{texts.manageAmenities}</h3>
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {draftVisibleAmenities.length} {texts.amenitiesShownOf} {effectiveAmenityOptions.length}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAmenityManager}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface shadow-ambient-soft transition hover:border-primary hover:text-primary self-start sm:self-auto"
                aria-label={texts.amenitiesClose}
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
                placeholder={texts.amenitiesSearch}
                className="min-w-0 flex-1 bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
              />
              {amenitySearch && (
                <button
                  type="button"
                  onClick={() => setAmenitySearch("")}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface transition hover:bg-surface-container"
                  aria-label={texts.amenitiesClearSearch}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="no-scrollbar grid max-h-[52vh] gap-6 overflow-y-auto pr-1">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-label-md text-on-surface">{texts.amenitiesShown}</h4>
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
                        <span>{labelFor(language, "amenity", amenity)}</span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md text-on-surface-variant sm:col-span-2">
                      {texts.amenitiesNoShown}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-label-md text-on-surface">{texts.amenitiesHidden}</h4>
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
                        <span>{labelFor(language, "amenity", amenity)}</span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md text-on-surface-variant sm:col-span-2">
                      {texts.amenitiesNoHidden}
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
                {texts.amenitiesApply}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
