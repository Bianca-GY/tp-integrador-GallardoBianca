import { describe, it, expect, beforeEach } from 'vitest';
import reducer, { comprar, vender, limpiarError } from '../carteraSlice';
import type { CarteraState, TransaccionPayload } from '../../types/crypto';

// ── Estado base reutilizable ──────────────────────────────────────────────────

const estadoVacio: CarteraState = {
  balances: { BTC: 0, ETH: 0, SOL: 0 },
  historial: [],
  cargando: false,
  error: null,
};

const estadoConFondos: CarteraState = {
  ...estadoVacio,
  balances: { BTC: 1.5, ETH: 10, SOL: 50 },
};

// ── Payloads de prueba ────────────────────────────────────────────────────────

const compraBTC: TransaccionPayload = {
  simbolo: 'BTC',
  tipo: 'COMPRA',
  cantidad: 0.5,
  precioUnitario: 60_000,
};

const ventaBTC: TransaccionPayload = {
  simbolo: 'BTC',
  tipo: 'VENTA',
  cantidad: 0.5,
  precioUnitario: 61_000,
};

const ventaExcesivaBTC: TransaccionPayload = {
  simbolo: 'BTC',
  tipo: 'VENTA',
  cantidad: 999,
  precioUnitario: 60_000,
};

// ── Comprar ───────────────────────────────────────────────────────────────────

describe('reducer cartera — comprar', () => {
  it('incrementa el balance del símbolo correcto', () => {
    const siguiente = reducer(estadoVacio, comprar(compraBTC));

    expect(siguiente.balances.BTC).toBeCloseTo(0.5);
    expect(siguiente.balances.ETH).toBe(0); // otros saldos no cambian
    expect(siguiente.balances.SOL).toBe(0);
  });

  it('acumula compras sucesivas del mismo símbolo', () => {
    const tras1 = reducer(estadoVacio, comprar(compraBTC));
    const tras2 = reducer(tras1, comprar(compraBTC));

    expect(tras2.balances.BTC).toBeCloseTo(1.0);
  });

  it('añade un registro al inicio del historial', () => {
    const siguiente = reducer(estadoVacio, comprar(compraBTC));

    expect(siguiente.historial).toHaveLength(1);
    const tx = siguiente.historial[0];
    expect(tx.tipo).toBe('COMPRA');
    expect(tx.simbolo).toBe('BTC');
    expect(tx.cantidad).toBe(0.5);
    expect(tx.precioUnitario).toBe(60_000);
    expect(tx.total).toBeCloseTo(30_000);
  });

  it('inserta las transacciones en orden cronológico descendente', () => {
    const compraETH: TransaccionPayload = { simbolo: 'ETH', tipo: 'COMPRA', cantidad: 2, precioUnitario: 3_000 };
    const tras1 = reducer(estadoVacio, comprar(compraBTC));
    const tras2 = reducer(tras1, comprar(compraETH));

    expect(tras2.historial[0].simbolo).toBe('ETH'); // la más reciente es la primera
    expect(tras2.historial[1].simbolo).toBe('BTC');
  });

  it('asigna un id único a cada transacción', () => {
    const tras1 = reducer(estadoVacio, comprar(compraBTC));
    const tras2 = reducer(tras1, comprar(compraBTC));
    const ids = tras2.historial.map((tx) => tx.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('limpia el error al procesar una compra', () => {
    const estadoConError: CarteraState = { ...estadoVacio, error: 'error previo' };
    const siguiente = reducer(estadoConError, comprar(compraBTC));

    expect(siguiente.error).toBeNull();
  });
});

// ── Vender ────────────────────────────────────────────────────────────────────

describe('reducer cartera — vender', () => {
  it('reduce el balance cuando hay fondos suficientes', () => {
    const siguiente = reducer(estadoConFondos, vender(ventaBTC));

    expect(siguiente.balances.BTC).toBeCloseTo(1.0); // 1.5 - 0.5
  });

  it('no modifica balances de otros símbolos', () => {
    const siguiente = reducer(estadoConFondos, vender(ventaBTC));

    expect(siguiente.balances.ETH).toBe(10);
    expect(siguiente.balances.SOL).toBe(50);
  });

  it('añade un registro de venta al historial', () => {
    const siguiente = reducer(estadoConFondos, vender(ventaBTC));

    expect(siguiente.historial).toHaveLength(1);
    expect(siguiente.historial[0].tipo).toBe('VENTA');
    expect(siguiente.historial[0].total).toBeCloseTo(30_500); // 0.5 × 61_000
  });

  it('no modifica el balance cuando no hay fondos suficientes', () => {
    const siguiente = reducer(estadoVacio, vender(ventaExcesivaBTC));

    expect(siguiente.balances.BTC).toBe(0); // sin cambios
  });

  it('no agrega entrada al historial cuando la venta falla por saldo', () => {
    const siguiente = reducer(estadoVacio, vender(ventaExcesivaBTC));

    expect(siguiente.historial).toHaveLength(0);
  });

  it('escribe un mensaje de error descriptivo al fallar por saldo', () => {
    const siguiente = reducer(estadoVacio, vender(ventaExcesivaBTC));

    expect(siguiente.error).toMatch(/saldo insuficiente/i);
    expect(siguiente.error).toContain('BTC');
    expect(siguiente.error).toContain('999');
  });

  it('permite vender exactamente el saldo disponible', () => {
    const ventaTotal: TransaccionPayload = {
      simbolo: 'BTC',
      tipo: 'VENTA',
      cantidad: 1.5,
      precioUnitario: 60_000,
    };
    const siguiente = reducer(estadoConFondos, vender(ventaTotal));

    expect(siguiente.balances.BTC).toBeCloseTo(0);
    expect(siguiente.error).toBeNull();
  });
});

// ── limpiarError ──────────────────────────────────────────────────────────────

describe('reducer cartera — limpiarError', () => {
  it('pone error en null', () => {
    const estadoConError: CarteraState = { ...estadoVacio, error: 'algo salió mal' };
    const siguiente = reducer(estadoConError, limpiarError());

    expect(siguiente.error).toBeNull();
  });
});

// ── Estado desconocido ────────────────────────────────────────────────────────

describe('reducer cartera — estado inicial', () => {
  it('devuelve el estado inicial cuando recibe undefined', () => {
    const siguiente = reducer(undefined, { type: '@@INIT' });

    expect(siguiente.balances).toEqual({ BTC: 0, ETH: 0, SOL: 0 });
    expect(siguiente.historial).toEqual([]);
    expect(siguiente.error).toBeNull();
    expect(siguiente.cargando).toBe(false);
  });
});
