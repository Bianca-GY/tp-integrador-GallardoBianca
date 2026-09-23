import { configureStore } from '@reduxjs/toolkit';
import carteraReducer from './carteraSlice';

export const store = configureStore({
  reducer: {
    cartera: carteraReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
