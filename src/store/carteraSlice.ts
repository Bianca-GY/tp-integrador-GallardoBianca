import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type {
  CarteraState,
  TransaccionPayload,
  Transaccion,
} from '../types/crypto';

// ── Estado inicial ─────────────────────────────────────────────────────────────

const estadoInicial: CarteraState = {
  balances: {
    BTC: 0,
    ETH: 0,
    SOL: 0,
  },
  historial: [],
  cargando: false,
  error: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function construirTransaccion(payload: TransaccionPayload): Transaccion {
  return {
    id: uuidv4(),
    simbolo: payload.simbolo,
    tipo: payload.tipo,
    cantidad: payload.cantidad,
    precioUnitario: payload.precioUnitario,
    total: payload.cantidad * payload.precioUnitario,
    fecha: new Date().toISOString(),
  };
}

// ── Slice ──────────────────────────────────────────────────────────────────────

const carteraSlice = createSlice({
  name: 'cartera',
  initialState: estadoInicial,
  reducers: {
    comprar(state, action: PayloadAction<TransaccionPayload>) {
      const { simbolo, cantidad } = action.payload;

      state.balances[simbolo] += cantidad;
      state.historial.unshift(construirTransaccion(action.payload));
      state.error = null;
    },

    vender(state, action: PayloadAction<TransaccionPayload>) {
      const { simbolo, cantidad } = action.payload;

      if (state.balances[simbolo] < cantidad) {
        state.error = `Saldo insuficiente de ${simbolo}: disponible ${state.balances[simbolo]}, solicitado ${cantidad}.`;
        return;
      }

      state.balances[simbolo] -= cantidad;
      state.historial.unshift(construirTransaccion(action.payload));
      state.error = null;
    },

    limpiarError(state) {
      state.error = null;
    },
  },
});

export const { comprar, vender, limpiarError } = carteraSlice.actions;

export default carteraSlice.reducer;
