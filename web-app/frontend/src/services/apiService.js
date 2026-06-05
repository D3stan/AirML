const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function logJson(label, payload) {
  if (typeof console === "undefined") {
    return;
  }

  console.groupCollapsed(label);
  console.log(JSON.stringify(payload, null, 2));
  console.groupEnd();
}

async function parseJsonResponse(response, responseLogLabel) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (responseLogLabel) {
    logJson(responseLogLabel, payload ?? { status: response.status, body: null });
  }

  if (!response.ok) {
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(", ")
      : detail || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchOccupancyModels() {
  const response = await fetch(`${API_BASE_URL}/models/occupancy`);
  return parseJsonResponse(response, "[AirML <- Backend] GET /models/occupancy response");
}

export async function fetchSettingsOptions() {
  const response = await fetch(`${API_BASE_URL}/settings/options`);
  return parseJsonResponse(response, "[AirML <- Backend] GET /settings/options response");
}

export async function predictOccupancy(modelId, propertySettings) {
  const requestPayload = {
    model_id: modelId,
    property: propertySettings,
  };

  logJson("[AirML -> Backend] POST /predict-occupancy request", requestPayload);

  const response = await fetch(`${API_BASE_URL}/predict-occupancy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  return parseJsonResponse(response, "[AirML <- Backend] POST /predict-occupancy response");
}

export function occupancyPredictionFromApi(apiPrediction, pricePrediction) {
  const annualDays = Number(apiPrediction.annual_days || 0);

  return {
    annual_days: annualDays,
    annual_revenue: Math.round(Number(pricePrediction?.prediction || 0) * annualDays),
    model: apiPrediction.model.name,
    model_id: apiPrediction.model.id,
    accuracy: apiPrediction.model.accuracy,
    relativeError: apiPrediction.model.relativeError,
    monthly: apiPrediction.monthly,
  };
}

export const apiServiceStatus = {
  ready: true,
  note: `FastAPI integration enabled at ${API_BASE_URL}.`,
};
