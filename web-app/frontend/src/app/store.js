import { configureStore } from "@reduxjs/toolkit";
import propertyReducer from "../features/property/propertySlice.js";
import predictionsReducer from "../features/predictions/predictionsSlice.js";

export const store = configureStore({
  reducer: {
    property: propertyReducer,
    predictions: predictionsReducer,
  },
});
