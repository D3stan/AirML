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

export function loadPropertySettings(fallback) {
  const savedSettings = loadFromStorage(PROPERTY_STORAGE_KEY, fallback);
  return loadFromStorage(PROPERTY_DRAFT_STORAGE_KEY, savedSettings, "session");
}

export function loadSavedPropertySettings(fallback) {
  return loadFromStorage(PROPERTY_STORAGE_KEY, fallback);
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
