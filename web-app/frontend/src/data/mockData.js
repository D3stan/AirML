export const PROPERTY_STORAGE_KEY = "airml.propertySettings";
export const PROPERTY_DRAFT_STORAGE_KEY = "airml.propertyDraft";
export const PREDICTIONS_STORAGE_KEY = "airml.predictions";

export const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const modelOptions = ["XGBoost", "Random Forest", "Lasso", "Linear Regression"];

export const occupancyModelFallback = {
  id: "xgboost",
  name: "XGBoost",
  accuracy: 82,
  relativeError: 3,
};

export const cityProfiles = {
  Rome: {
    latitude: 41.900488,
    longitude: 12.526131,
    neighbourhoods: ["Trastevere", "Monti", "Prati", "Centro Storico", "Testaccio"],
  },
  Florence: {
    latitude: 43.769562,
    longitude: 11.255814,
    neighbourhoods: ["Santa Croce", "Santo Spirito", "Duomo", "San Lorenzo", "Campo di Marte"],
  },
  Venice: {
    latitude: 45.440847,
    longitude: 12.315515,
    neighbourhoods: ["San Marco", "Cannaregio", "Dorsoduro", "Castello", "Santa Croce"],
  },
  Milan: {
    latitude: 45.464204,
    longitude: 9.189982,
    neighbourhoods: ["Brera", "Navigli", "Porta Romana", "Isola", "Centro Storico"],
  },
  Bologna: {
    latitude: 44.494887,
    longitude: 11.342616,
    neighbourhoods: ["Centro Storico", "Bolognina", "Saragozza", "Santo Stefano", "San Donato"],
  },
  Naples: {
    latitude: 40.851775,
    longitude: 14.268124,
    neighbourhoods: ["Chiaia", "Centro Storico", "Vomero", "Posillipo", "Quartieri Spagnoli"],
  },
};

export const cityOptions = Object.keys(cityProfiles);

export const propertyTypeOptions = [
  "Entire rental unit",
  "Entire condo",
  "Entire home",
  "Private room in rental unit",
  "Private room in home",
  "Other",
];

export const roomTypeOptions = ["Entire home/apt", "Private room", "Shared room", "Hotel room"];

export const amenityOptions = [
  "Wifi",
  "Kitchen",
  "Air conditioning",
  "Heating",
  "Essentials",
  "Hair dryer",
  "Hangers",
  "Hot water",
  "Iron",
  "Bed linens",
  "Cooking basics",
  "Dishes and silverware",
  "Refrigerator",
  "Shampoo",
  "TV",
  "Carbon monoxide alarm",
  "Dining table",
  "Fire extinguisher",
  "Freezer",
  "Bidet",
  "Pool",
];

export const defaultPropertySettings = {
  city: "Rome",
  neighbourhood_cleansed: "Trastevere",
  latitude: cityProfiles.Rome.latitude,
  longitude: cityProfiles.Rome.longitude,
  property_type: "Entire rental unit",
  room_type: "Entire home/apt",
  accommodates: 4,
  bathrooms: 1,
  bedrooms: 2,
  beds: 2,
  nightly_price: 120,
  amenities: ["Wifi", "Kitchen", "Air conditioning", "Heating", "Essentials", "Hair dryer"],
  available_amenities: [
    "Wifi",
    "Kitchen",
    "Air conditioning",
    "Heating",
    "Essentials",
    "Hair dryer",
    "Hangers",
    "Hot water",
    "Iron",
    "Bed linens",
  ],
  minimum_nights: 2,
  maximum_nights: 365,
  instant_bookable: true,
  has_availability: true,
  availability_365: 365,
  has_reviews: true,
  review_frequency_days: 15,
  reviews: [
    {
      id: "default-review-1",
      text: "Great apartment, very clean and close to the city center.",
    },
  ],
};

export const defaultPredictions = {
  price: {
    prediction: 135,
    lower: 126,
    upper: 144,
    unit: "euro_per_night",
    model: "XGBoost",
    accuracy: 93,
    relativeError: 7,
  },
  occupancy: {
    annual_days: 249,
    annual_revenue: 33615,
    model: occupancyModelFallback.name,
    model_id: occupancyModelFallback.id,
    accuracy: occupancyModelFallback.accuracy,
    relativeError: occupancyModelFallback.relativeError,
    monthly: {
      Jan: 19,
      Feb: 17,
      Mar: 23,
      Apr: 26,
      May: 24,
      Jun: 27,
      Jul: 30,
      Aug: 31,
      Sep: 27,
      Oct: 22,
      Nov: 19,
      Dec: 24,
    },
  },
};
