import { createSlice } from "@reduxjs/toolkit";
import { defaultPropertySettings } from "../../data/mockData.js";
import { loadPropertySettings } from "../../utils/storage.js";

const initialState = loadPropertySettings(defaultPropertySettings);

function normalizedAmenity(value) {
  return value.trim().toLowerCase();
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
        state.amenities.push(amenity);
      }
    },
    addAvailableAmenity(state, action) {
      const amenity = action.payload.trim();
      if (!amenity) {
        return;
      }

      state.available_amenities ??= [];
      state.amenities ??= [];

      const alreadyExists = state.available_amenities.some(
        (availableAmenity) => normalizedAmenity(availableAmenity) === normalizedAmenity(amenity),
      );

      if (alreadyExists) {
        return;
      }

      state.available_amenities.push(amenity);
      state.amenities.push(amenity);
    },
    removeAvailableAmenity(state, action) {
      const amenity = action.payload;
      state.available_amenities = (state.available_amenities ?? []).filter((item) => item !== amenity);
      state.amenities = (state.amenities ?? []).filter((item) => item !== amenity);
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
  addAvailableAmenity,
  addReview,
  deleteReview,
  removeAvailableAmenity,
  resetProperty,
  toggleAmenity,
  updatePropertyField,
  updatePropertyFields,
  updateReview,
} = propertySlice.actions;
export default propertySlice.reducer;
