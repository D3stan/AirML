import { createSlice } from "@reduxjs/toolkit";
import { amenityOptions, defaultPropertySettings } from "../../data/mockData.js";
import { loadPropertySettings } from "../../utils/storage.js";

const initialState = loadPropertySettings(defaultPropertySettings);

function orderedAmenities(amenities) {
  const selectedSet = new Set(amenities ?? []);
  return [
    ...amenityOptions.filter((amenity) => selectedSet.has(amenity)),
    ...(amenities ?? []).filter((amenity) => !amenityOptions.includes(amenity)),
  ];
}

const propertySlice = createSlice({
  name: "property",
  initialState,
  reducers: {
    updatePropertyField(state, action) {
      const { field, value } = action.payload;
      state[field] = value;
    },
    updatePropertyFields(state, action) {
      Object.assign(state, action.payload);
    },
    toggleAmenity(state, action) {
      const amenity = action.payload;
      state.amenities ??= [];
      if (state.amenities.includes(amenity)) {
        state.amenities = state.amenities.filter((item) => item !== amenity);
      } else {
        state.amenities = orderedAmenities([...state.amenities, amenity]);
      }
    },
    setVisibleAmenities(state, action) {
      const nextVisibleAmenities = orderedAmenities(action.payload);
      const previousVisibleAmenities = new Set(state.available_amenities ?? []);
      const newlyVisibleAmenities = nextVisibleAmenities.filter((amenity) => !previousVisibleAmenities.has(amenity));
      state.available_amenities = nextVisibleAmenities;
      state.amenities = orderedAmenities([
        ...(state.amenities ?? []).filter((amenity) => nextVisibleAmenities.includes(amenity)),
        ...newlyVisibleAmenities,
      ]);
    },
    addReview(state, action) {
      const text = action.payload.text.trim();
      if (!text) {
        return;
      }

      state.reviews ??= [];
      state.reviews.push({
        id: action.payload.id,
        text,
      });
    },
    updateReview(state, action) {
      const text = action.payload.text.trim();
      if (!text) {
        return;
      }

      state.reviews = (state.reviews ?? []).map((review) =>
        review.id === action.payload.id ? { ...review, text } : review,
      );
    },
    deleteReview(state, action) {
      state.reviews = (state.reviews ?? []).filter((review) => review.id !== action.payload);
    },
    resetProperty() {
      return defaultPropertySettings;
    },
  },
});

export const {
  addReview,
  deleteReview,
  resetProperty,
  setVisibleAmenities,
  toggleAmenity,
  updatePropertyField,
  updatePropertyFields,
  updateReview,
} = propertySlice.actions;
export default propertySlice.reducer;
