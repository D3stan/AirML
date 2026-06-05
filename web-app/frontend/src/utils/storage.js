import { PREDICTIONS_STORAGE_KEY, PROPERTY_DRAFT_STORAGE_KEY, PROPERTY_STORAGE_KEY } from "../data/mockData.js";

function canUseStorage(storageType = "local") {
  if (typeof window === "undefined") {
    return false;
  }

  return storageType === "session" ? Boolean(window.sessionStorage) : Boolean(window.localStorage);
}

function storageFor(storageType = "local") {
  return storageType === "session" ? window.sessionStorage : window.localStorage;
}

function logSavedSettings(settings) {
  if (typeof console === "undefined") {
    return;
  }

  console.groupCollapsed("[AirML Settings] Dati salvati in localStorage");
  console.log(JSON.stringify(settings, null, 2));
  console.groupEnd();
}

export function loadFromStorage(key, fallback, storageType = "local") {
  if (!canUseStorage(storageType)) {
    return fallback;
  }

  try {
    const rawValue = storageFor(storageType).getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value, storageType = "local") {
  if (!canUseStorage(storageType)) {
    return;
  }

  storageFor(storageType).setItem(key, JSON.stringify(value));
}

export function removeFromStorage(key, storageType = "local") {
  if (!canUseStorage(storageType)) {
    return;
  }

  storageFor(storageType).removeItem(key);
}

function applyMissingDefaults(settings, fallback) {
  if (!settings || typeof settings !== "object") {
    return fallback;
  }

  return Object.keys(fallback).reduce(
    (mergedSettings, key) => {
      if (Object.prototype.hasOwnProperty.call(mergedSettings, key)) {
        return mergedSettings;
      }

      return {
        ...mergedSettings,
        [key]: fallback[key],
      };
    },
    { ...settings },
  );
}

function migratePropertySettings(settings) {
  if (!settings || typeof settings !== "object") {
    return settings;
  }

  const migratedSettings = { ...settings };
  if (
    !Object.prototype.hasOwnProperty.call(migratedSettings, "review_span_days") &&
    Object.prototype.hasOwnProperty.call(migratedSettings, "review_frequency_days")
  ) {
    migratedSettings.review_span_days = migratedSettings.review_frequency_days;
  }
  delete migratedSettings.review_frequency_days;
  return migratedSettings;
}

export function loadPropertySettings(fallback) {
  const savedSettings = migratePropertySettings(loadFromStorage(PROPERTY_STORAGE_KEY, fallback));
  const savedWithDefaults = applyMissingDefaults(savedSettings, fallback);
  const draftSettings = migratePropertySettings(loadFromStorage(PROPERTY_DRAFT_STORAGE_KEY, savedWithDefaults, "session"));
  return applyMissingDefaults(draftSettings, fallback);
}

export function loadSavedPropertySettings(fallback) {
  return applyMissingDefaults(migratePropertySettings(loadFromStorage(PROPERTY_STORAGE_KEY, fallback)), fallback);
}

export function savePropertySettings(settings) {
  const migratedSettings = migratePropertySettings(settings);
  saveToStorage(PROPERTY_STORAGE_KEY, migratedSettings);
  logSavedSettings(migratedSettings);
}

export function loadPropertyDraft(fallback) {
  return loadFromStorage(PROPERTY_DRAFT_STORAGE_KEY, fallback, "session");
}

export function savePropertyDraft(settings) {
  saveToStorage(PROPERTY_DRAFT_STORAGE_KEY, migratePropertySettings(settings), "session");
}

export function clearPropertyDraft() {
  removeFromStorage(PROPERTY_DRAFT_STORAGE_KEY, "session");
}

export function loadMockPredictions(fallback) {
  return loadFromStorage(PREDICTIONS_STORAGE_KEY, fallback);
}

export function saveMockPredictions(predictions) {
  saveToStorage(PREDICTIONS_STORAGE_KEY, predictions);
}
