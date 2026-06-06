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

export const priceModelFallback = {
  id: "logxgb",
  name: "XGBoost Log",
  accuracy: 75,
  relativeError: 25,
};

export const cityProfiles = {
  Rome: {
    latitude: 41.9028,
    longitude: 12.4964,
    neighbourhoodCoordinates: {
      "I Centro Storico": { latitude: 41.8979, longitude: 12.4773 },
      "VII San Giovanni/Cinecittà": { latitude: 41.8724, longitude: 12.5464 },
      "VII San Giovanni/Cinecitta": { latitude: 41.8724, longitude: 12.5464 },
      "XIII Aurelia": { latitude: 41.8977, longitude: 12.4206 },
      "II Parioli/Nomentano": { latitude: 41.9241, longitude: 12.5072 },
      "XII Monte Verde": { latitude: 41.8729, longitude: 12.4549 },
    },
    neighbourhoods: ["I Centro Storico", "VII San Giovanni/Cinecittà", "XIII Aurelia", "II Parioli/Nomentano", "XII Monte Verde"],
  },
  Florence: {
    latitude: 43.769562,
    longitude: 11.255814,
    neighbourhoodCoordinates: {
      "Centro Storico": { latitude: 43.7711, longitude: 11.2559 },
      "Campo di Marte": { latitude: 43.7787, longitude: 11.2857 },
      Rifredi: { latitude: 43.8124, longitude: 11.2297 },
      "Isolotto Legnaia": { latitude: 43.7715, longitude: 11.2073 },
      "Gavinana Galluzzo": { latitude: 43.7444, longitude: 11.2677 },
    },
    neighbourhoods: ["Centro Storico", "Campo di Marte", "Rifredi", "Isolotto Legnaia", "Gavinana Galluzzo"],
  },
  Venice: {
    latitude: 45.440847,
    longitude: 12.315515,
    neighbourhoodCoordinates: {
      "San Marco": { latitude: 45.434, longitude: 12.3374 },
      Cannaregio: { latitude: 45.4457, longitude: 12.329 },
      Dorsoduro: { latitude: 45.4291, longitude: 12.3202 },
      Castello: { latitude: 45.4371, longitude: 12.3493 },
      "Santa Croce": { latitude: 45.4405, longitude: 12.322 },
    },
    neighbourhoods: ["San Marco", "Cannaregio", "Dorsoduro", "Castello", "Santa Croce"],
  },
  Milan: {
    latitude: 45.464204,
    longitude: 9.189982,
    neighbourhoodCoordinates: {
      Brera: { latitude: 45.472, longitude: 9.1875 },
      Navigli: { latitude: 45.4512, longitude: 9.1756 },
      "Porta Romana": { latitude: 45.4518, longitude: 9.2026 },
      Isola: { latitude: 45.4861, longitude: 9.1916 },
      "Centro Storico": { latitude: 45.4642, longitude: 9.19 },
    },
    neighbourhoods: ["Brera", "Navigli", "Porta Romana", "Isola", "Centro Storico"],
  },
  Bologna: {
    latitude: 44.494887,
    longitude: 11.342616,
    neighbourhoodCoordinates: {
      "Santo Stefano": { latitude: 44.4896, longitude: 11.3557 },
      "Porto - Saragozza": { latitude: 44.4937, longitude: 11.3194 },
      Navile: { latitude: 44.5219, longitude: 11.3402 },
      "San Donato - San Vitale": { latitude: 44.5069, longitude: 11.3742 },
      "Borgo Panigale - Reno": { latitude: 44.5152, longitude: 11.2753 },
    },
    neighbourhoods: ["Santo Stefano", "Porto - Saragozza", "Navile", "San Donato - San Vitale", "Borgo Panigale - Reno"],
  },
  Naples: {
    latitude: 40.851775,
    longitude: 14.268124,
    neighbourhoodCoordinates: {
      Chiaia: { latitude: 40.8329, longitude: 14.2293 },
      "Centro Storico": { latitude: 40.8516, longitude: 14.2598 },
      Vomero: { latitude: 40.8437, longitude: 14.2306 },
      Posillipo: { latitude: 40.8058, longitude: 14.1948 },
      "Quartieri Spagnoli": { latitude: 40.8408, longitude: 14.2456 },
    },
    neighbourhoods: ["Chiaia", "Centro Storico", "Vomero", "Posillipo", "Quartieri Spagnoli"],
  },
  Bergamo: {
    latitude: 45.6983,
    longitude: 9.6773,
    neighbourhoodCoordinates: {
      Bergamo: { latitude: 45.6983, longitude: 9.6773 },
      "Riva di Solto": { latitude: 45.7784, longitude: 10.0442 },
      Lovere: { latitude: 45.8101, longitude: 10.0686 },
      Parzanica: { latitude: 45.7379, longitude: 10.0349 },
      Seriate: { latitude: 45.6852, longitude: 9.7214 },
    },
    neighbourhoods: ["Bergamo", "Riva di Solto", "Lovere", "Parzanica", "Seriate"],
  },
  Puglia: {
    latitude: 41.1171,
    longitude: 16.8719,
    neighbourhoodCoordinates: {
      Bari: { latitude: 41.1171, longitude: 16.8719 },
      Ostuni: { latitude: 40.7295, longitude: 17.5774 },
      Lecce: { latitude: 40.3515, longitude: 18.175 },
      Gallipoli: { latitude: 40.0559, longitude: 17.992 },
      Monopoli: { latitude: 40.9517, longitude: 17.302 },
    },
    neighbourhoods: ["Bari", "Ostuni", "Lecce", "Gallipoli", "Monopoli"],
  },
  Sicily: {
    latitude: 38.1157,
    longitude: 13.3615,
    neighbourhoodCoordinates: {
      Palermo: { latitude: 38.1157, longitude: 13.3615 },
      Catania: { latitude: 37.5079, longitude: 15.083 },
      Siracusa: { latitude: 37.0755, longitude: 15.2866 },
      Noto: { latitude: 36.8919, longitude: 15.0697 },
      "Castellammare del Golfo": { latitude: 38.0265, longitude: 12.8818 },
    },
    neighbourhoods: ["Palermo", "Catania", "Siracusa", "Noto", "Castellammare del Golfo"],
  },
  Trentino: {
    latitude: 46.0748,
    longitude: 11.1217,
    neighbourhoodCoordinates: {
      Trentino: { latitude: 46.0748, longitude: 11.1217 },
      "Trento, Trentino": { latitude: 46.0679, longitude: 11.1211 },
    },
    neighbourhoods: ["Trentino", "Trento, Trentino"],
  },
};

export const cityOptions = Object.keys(cityProfiles);

export const propertyTypeOptions = [
  "Entire rental unit",
  "Entire condo",
  "Entire home",
  "Entire loft",
  "Entire serviced apartment",
  "Entire townhouse",
  "Entire vacation home",
  "Entire villa",
  "Private room in bed and breakfast",
  "Private room in condo",
  "Private room in rental unit",
  "Private room in home",
  "Room in hotel",
  "Tiny home",
  "Trullo",
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
];

export const defaultPropertySettings = {
  language: "en",
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
    "Shampoo",
    "TV",
    "Freezer",
    "Bidet",
  ],
  minimum_nights: 2,
  maximum_nights: 365,
  instant_bookable: true,
  has_availability: true,
  availability_365: 365,
  has_reviews: true,
  review_span_days: 1500,
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
    model: priceModelFallback.name,
    model_id: priceModelFallback.id,
    accuracy: priceModelFallback.accuracy,
    relativeError: priceModelFallback.relativeError,
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
