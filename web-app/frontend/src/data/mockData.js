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
    neighbourhoods: ["I Centro Storico", "VII San Giovanni/Cinecittà", "XIII Aurelia", "II Parioli/Nomentano", "XII Monte Verde"],
  },
  Florence: {
    latitude: 43.769562,
    longitude: 11.255814,
    neighbourhoods: ["Centro Storico", "Campo di Marte", "Rifredi", "Isolotto Legnaia", "Gavinana Galluzzo"],
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
    neighbourhoods: ["Santo Stefano", "Porto - Saragozza", "Navile", "San Donato - San Vitale", "Borgo Panigale - Reno"],
  },
  Naples: {
    latitude: 40.851775,
    longitude: 14.268124,
    neighbourhoods: ["Chiaia", "Centro Storico", "Vomero", "Posillipo", "Quartieri Spagnoli"],
  },
  Bergamo: {
    latitude: 45.6983,
    longitude: 9.6773,
    neighbourhoods: ["Bergamo", "Riva di Solto", "Lovere", "Parzanica", "Seriate"],
  },
  Puglia: {
    latitude: 41.1171,
    longitude: 16.8719,
    neighbourhoods: ["Bari", "Ostuni", "Lecce", "Gallipoli", "Monopoli"],
  },
  Sicily: {
    latitude: 38.1157,
    longitude: 13.3615,
    neighbourhoods: ["Palermo", "Catania", "Siracusa", "Noto", "Castellammare del Golfo"],
  },
  Trentino: {
    latitude: 46.0748,
    longitude: 11.1217,
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
