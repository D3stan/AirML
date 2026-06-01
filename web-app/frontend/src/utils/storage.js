import { PROPERTY_STORAGE_KEY, PREDICTIONS_STORAGE_KEY } from "../data/mockData.js";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadFromStorage(key, fallback) {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadPropertySettings(fallback) {
  return loadFromStorage(PROPERTY_STORAGE_KEY, fallback);
}

export function savePropertySettings(settings) {
  saveToStorage(PROPERTY_STORAGE_KEY, settings);
}

export function loadMockPredictions(fallback) {
  return loadFromStorage(PREDICTIONS_STORAGE_KEY, fallback);
}

export function saveMockPredictions(predictions) {
  saveToStorage(PREDICTIONS_STORAGE_KEY, predictions);
}
