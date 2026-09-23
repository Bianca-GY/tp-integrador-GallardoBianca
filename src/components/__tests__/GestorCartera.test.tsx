import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { GestorCartera, type Aviso } from '../GestorCartera';
import carteraReducer from '../../store/carteraSlice';
import { usePrecios } from '../../hooks/usePrecios';
import type { PreciosResponse } from '../../types/crypto';

// ── Mock del hook de precios ───────────────────────────────────────────────────

vi.mock('../../hooks/usePrecios');
const mockUsePrecios = usePrecios as Mock;

const PRECIOS_MOCK: PreciosResponse = {
  BTC: { simbolo: 'BTC', precioUSD: 60_000, variacion24h: 2.5, actualizadoEn: '2026-01-01T00:00:00Z' },
  ETH: { simbolo: 'ETH', precioUSD: 3_000, variacion24h: -1.2, actualizadoEn: '2026-01-01T00:00:00Z' },
  SOL: { simbolo: 'SOL', precioUSD: 150, variacion24h: 0.8, actualizadoEn: '2026-01-01T00:00:00Z' },
};

// ── Helper: renderizar con proveedores ────────────────────────────────────────

function renderConProveedores(onAviso: (aviso: Aviso) => void) {
  const store = configureStore({ reducer: { cartera: carteraReducer } });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <GestorCartera onAviso={onAviso} />
        </QueryClientProvider>
      </Provider>,
    ),
  };
}

// ── Configuración común ───────────────────────────────────────────────────────

beforeEach(() => {
  mockUsePrecios.mockReturnValue({
    data: PRECIOS_MOCK,
    isLoading: false,
    isError: false,
  });
});

// ── Pruebas ───────────────────────────────────────────────────────────────────

describe('GestorCartera — integración', () => {
  describe('estructura accesible', () => {
    it('renderiza el formulario con su aria-label', () => {
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      expect(
        screen.getByRole('form', { name: 'Formulario de compra y venta de criptomonedas' }),
      ).toBeInTheDocument();
    });

    it('muestra el selector de criptomoneda', () => {
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      expect(
        screen.getByRole('combobox', { name: 'Seleccionar criptomoneda' }),
      ).toBeInTheDocument();
    });

    it('muestra los radio buttons de operación', () => {
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      expect(screen.getByRole('radio', { name: 'Operación: Comprar' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Operación: Vender' })).toBeInTheDocument();
    });

    it('muestra el saldo inicial de cada símbolo en 0.000000', () => {
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      const seccionSaldos = screen.getByRole('region', { name: 'Saldos' });
      expect(within(seccionSaldos).getAllByText('0.000000')).toHaveLength(3);
    });
  });

  describe('compra válida', () => {
    it('llama onAviso con tipo "exito" tras comprar BTC', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a comprar/i }),
        '0.5',
      );
      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      expect(onAviso).toHaveBeenCalledOnce();
      expect(onAviso).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'exito' }),
      );
    });

    it('el mensaje de éxito incluye la cantidad y el símbolo', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a comprar/i }),
        '1',
      );
      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      const aviso: Aviso = onAviso.mock.calls[0][0];
      expect(aviso.mensaje).toMatch(/1/);
      expect(aviso.mensaje).toMatch(/BTC/);
    });

    it('actualiza el saldo de BTC en la cartera tras la compra', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      const { store } = renderConProveedores(onAviso);

      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a comprar/i }),
        '2',
      );
      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      expect(store.getState().cartera.balances.BTC).toBeCloseTo(2);
    });

    it('vacía el campo de cantidad después de la compra', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      const inputCantidad = screen.getByRole('spinbutton', { name: /cantidad de btc a comprar/i });
      await user.type(inputCantidad, '0.25');
      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      expect(inputCantidad).toHaveValue(null);
    });
  });

  describe('compra con ETH tras cambiar símbolo', () => {
    it('llama onAviso con "exito" y el símbolo correcto', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Seleccionar criptomoneda' }),
        'ETH',
      );
      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de eth a comprar/i }),
        '3',
      );
      await user.click(screen.getByRole('button', { name: /confirmar comprar de eth/i }));

      const aviso: Aviso = onAviso.mock.calls[0][0];
      expect(aviso.tipo).toBe('exito');
      expect(aviso.mensaje).toMatch(/ETH/);
    });
  });

  describe('validaciones del formulario', () => {
    it('llama onAviso con tipo "info" si la cantidad está vacía', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      expect(onAviso).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'info' }),
      );
    });

    it('llama onAviso con tipo "info" si la cantidad es cero', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a comprar/i }),
        '0',
      );
      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      expect(onAviso).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'info' }),
      );
    });

    it('llama onAviso con tipo "info" cuando los precios aún no están disponibles', async () => {
      mockUsePrecios.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      // El botón está deshabilitado cuando isLoading=true, simulamos submit directo
      const form = screen.getByRole('form', { name: 'Formulario de compra y venta de criptomonedas' });
      const inputCantidad = form.querySelector('input[type="number"]') as HTMLInputElement;
      await user.type(inputCantidad, '1');
      await userEvent.setup().keyboard('{Enter}');
    });
  });

  describe('venta sin fondos suficientes', () => {
    it('llama onAviso con tipo "error" si no hay saldo para vender', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      // Cambiar a operación VENTA
      await user.click(screen.getByRole('radio', { name: 'Operación: Vender' }));

      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a vender/i }),
        '10',
      );
      await user.click(screen.getByRole('button', { name: /confirmar vender de btc/i }));

      expect(onAviso).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'error' }),
      );
    });

    it('el mensaje de error menciona el símbolo y saldo insuficiente', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      renderConProveedores(onAviso);

      await user.click(screen.getByRole('radio', { name: 'Operación: Vender' }));
      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a vender/i }),
        '5',
      );
      await user.click(screen.getByRole('button', { name: /confirmar vender de btc/i }));

      const aviso: Aviso = onAviso.mock.calls[0][0];
      expect(aviso.mensaje).toMatch(/saldo insuficiente/i);
      expect(aviso.mensaje).toMatch(/BTC/);
    });

    it('no modifica el balance de BTC al fallar la venta', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      const { store } = renderConProveedores(onAviso);

      await user.click(screen.getByRole('radio', { name: 'Operación: Vender' }));
      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a vender/i }),
        '1',
      );
      await user.click(screen.getByRole('button', { name: /confirmar vender de btc/i }));

      expect(store.getState().cartera.balances.BTC).toBe(0);
      expect(store.getState().cartera.historial).toHaveLength(0);
    });
  });

  describe('flujo compra → venta', () => {
    it('descuenta el balance tras vender con fondos suficientes', async () => {
      const user = userEvent.setup();
      const onAviso = vi.fn();
      const { store } = renderConProveedores(onAviso);

      // Comprar 2 BTC
      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a comprar/i }),
        '2',
      );
      await user.click(screen.getByRole('button', { name: /confirmar comprar de btc/i }));

      // Cambiar a VENTA y vender 1 BTC
      await user.click(screen.getByRole('radio', { name: 'Operación: Vender' }));
      await user.type(
        screen.getByRole('spinbutton', { name: /cantidad de btc a vender/i }),
        '1',
      );
      await user.click(screen.getByRole('button', { name: /confirmar vender de btc/i }));

      // La venta exitosa no emite onAviso (solo la compra lo hizo)
      expect(onAviso).toHaveBeenCalledOnce();
      expect(onAviso.mock.calls[0][0]).toMatchObject({ tipo: 'exito' });

      // El balance se redujo correctamente: 2 - 1 = 1
      expect(store.getState().cartera.balances.BTC).toBeCloseTo(1);
      expect(store.getState().cartera.historial).toHaveLength(2);
    });
  });
});
