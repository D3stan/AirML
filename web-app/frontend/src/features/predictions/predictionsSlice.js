import { createSlice } from "@reduxjs/toolkit";
import { defaultPredictions } from "../../data/mockData.js";
import { loadMockPredictions } from "../../utils/storage.js";

const initialState = loadMockPredictions(defaultPredictions);

const predictionsSlice = createSlice({
  name: "predictions",
  initialState,
  reducers: {
    setPredictions(_state, action) {
      return action.payload;
    },
    resetPredictions() {
      return defaultPredictions;
    },
  },
});

export const { setPredictions, resetPredictions } = predictionsSlice.actions;
export default predictionsSlice.reducer;
