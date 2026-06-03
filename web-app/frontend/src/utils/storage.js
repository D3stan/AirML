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

export function loadPropertySettings(fallback) {
  const savedSettings = loadFromStorage(PROPERTY_STORAGE_KEY, fallback);
  const savedWithDefaults = applyMissingDefaults(savedSettings, fallback);
  const draftSettings = loadFromStorage(PROPERTY_DRAFT_STORAGE_KEY, savedWithDefaults, "session");
  return applyMissingDefaults(draftSettings, fallback);
}

export function loadSavedPropertySettings(fallback) {
  return applyMissingDefaults(loadFromStorage(PROPERTY_STORAGE_KEY, fallback), fallback);
}

export function savePropertySettings(settings) {
  saveToStorage(PROPERTY_STORAGE_KEY, settings);
}

export function loadPropertyDraft(fallback) {
  return loadFromStorage(PROPERTY_DRAFT_STORAGE_KEY, fallback, "session");
}

export function savePropertyDraft(settings) {
  saveToStorage(PROPERTY_DRAFT_STORAGE_KEY, settings, "session");
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
