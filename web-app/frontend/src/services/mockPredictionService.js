import { monthLabels } from "../data/mockData.js";

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashString(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function boundedJitter(hash, min, max, salt) {
  const range = max - min + 1;
  return min + ((hash + salt * 2654435761) % range);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function activePredictionSettings(propertySettings) {
  const settingsWithoutManualPrice = { ...propertySettings };
  delete settingsWithoutManualPrice.nightly_price;

  if (settingsWithoutManualPrice.has_reviews) {
    return settingsWithoutManualPrice;
  }

  const settingsWithoutInactiveReviews = { ...settingsWithoutManualPrice };
  delete settingsWithoutInactiveReviews.review_frequency_days;
  delete settingsWithoutInactiveReviews.reviews;
  return settingsWithoutInactiveReviews;
}

export function generateMockPredictions(propertySettings) {
  const hash = hashString(stableStringify(activePredictionSettings(propertySettings)));
  const amenities = propertySettings.amenities ?? [];
  const isEntirePlace = propertySettings.room_type === "Entire home/apt";
  const cityPremium = {
    Florence: 22,
    Venice: 30,
    Milan: 24,
    Rome: 18,
    Bologna: 10,
    Naples: 8,
  }[propertySettings.city] ?? 12;

  const amenityPremium = amenities.length * 3;
  const sizePremium =
    Number(propertySettings.accommodates || 0) * 9 +
    Number(propertySettings.bedrooms || 0) * 11 +
    Number(propertySettings.bathrooms || 0) * 8 +
    Number(propertySettings.beds || 0) * 3;
  const roomAdjustment = isEntirePlace ? 28 : -12;
  const bookingAdjustment = propertySettings.instant_bookable ? 6 : -4;
  const priceJitter = boundedJitter(hash, -11, 13, 7);
  const predictedPrice = clamp(62 + cityPremium + amenityPremium + sizePremium + roomAdjustment + bookingAdjustment + priceJitter, 45, 420);
  const relativeError = clamp(4 + boundedJitter(hash, 0, 5, 11), 3, 12);
  const spread = Math.max(6, Math.round(predictedPrice * (relativeError / 100)));

  const availability = propertySettings.has_availability ? Number(propertySettings.availability_365 || 0) : 0;
  const baseDemand =
    172 +
    cityPremium * 2 +
    amenities.length * 4 +
    Number(propertySettings.accommodates || 0) * 6 +
    (propertySettings.instant_bookable ? 12 : 0) -
    Number(propertySettings.minimum_nights || 0) * 2 +
    boundedJitter(hash, -16, 18, 19);
  const annualDays = propertySettings.has_availability ? clamp(Math.round(baseDemand), 0, clamp(availability, 0, 365)) : 0;

  const seasonality = [0.73, 0.62, 0.82, 0.92, 1.02, 1.08, 1.16, 1.18, 0.98, 0.88, 0.7, 0.76];
  const weightedTotal = seasonality.reduce((total, value) => total + value, 0);
  let remainingDays = annualDays;
  const monthly = {};

  monthLabels.forEach((month, index) => {
    const isLast = index === monthLabels.length - 1;
    const jitter = boundedJitter(hash, -2, 2, index + 23);
    const value = isLast
      ? remainingDays
      : clamp(Math.round((annualDays * seasonality[index]) / weightedTotal) + jitter, 0, 31);
    monthly[month] = clamp(value, 0, 31);
    remainingDays = Math.max(0, remainingDays - monthly[month]);
  });

  return {
    price: {
      prediction: predictedPrice,
      lower: Math.max(1, predictedPrice - spread),
      upper: predictedPrice + spread,
      unit: "euro_per_night",
      model: "XGBoost",
      accuracy: clamp(82 - relativeError + boundedJitter(hash, -2, 2, 31), 65, 90),
      relativeError,
    },
    occupancy: {
      annual_days: annualDays,
      annual_revenue: Math.round(annualDays * predictedPrice * 0.39),
      model: "Lasso",
      accuracy: clamp(78 + boundedJitter(hash, -4, 4, 37), 66, 88),
      relativeError: clamp(3 + boundedJitter(hash, 0, 5, 41), 3, 10),
      monthly,
    },
  };
}
