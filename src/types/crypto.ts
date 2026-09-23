// ── Primitivos ────────────────────────────────────────────────────────────────

export type CryptoSymbol = 'BTC' | 'ETH' | 'SOL';

export type TipoOperacion = 'COMPRA' | 'VENTA';

// ── Transacciones ─────────────────────────────────────────────────────────────

export interface Transaccion {
  id: string;
  simbolo: CryptoSymbol;
  tipo: TipoOperacion;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: string; // ISO 8601
}

/** Payload que recibe el reducer de Redux al registrar una operación */
export interface TransaccionPayload {
  simbolo: CryptoSymbol;
  tipo: TipoOperacion;
  cantidad: number;
  precioUnitario: number;
}

// ── Estado de la cartera (Redux slice) ────────────────────────────────────────

export type Balances = Record<CryptoSymbol, number>;

export interface CarteraState {
  balances: Balances;
  historial: Transaccion[];
  cargando: boolean;
  error: string | null;
}

// ── API de precios ────────────────────────────────────────────────────────────

export interface PrecioCrypto {
  simbolo: CryptoSymbol;
  precioUSD: number;
  variacion24h: number;   // porcentaje, puede ser negativo
  actualizadoEn: string;  // ISO 8601
}

export type PreciosResponse = Record<CryptoSymbol, PrecioCrypto>;
