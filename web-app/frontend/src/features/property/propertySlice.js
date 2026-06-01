import { createSlice } from "@reduxjs/toolkit";
import { defaultPropertySettings } from "../../data/mockData.js";
import { loadPropertySettings } from "../../utils/storage.js";

const initialState = loadPropertySettings(defaultPropertySettings);

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
      if (state.amenities.includes(amenity)) {
        state.amenities = state.amenities.filter((item) => item !== amenity);
      } else {
        state.amenities.push(amenity);
      }
    },
    resetProperty() {
      return defaultPropertySettings;
    },
  },
});

export const { updatePropertyField, updatePropertyFields, toggleAmenity, resetProperty } = propertySlice.actions;
export default propertySlice.reducer;
