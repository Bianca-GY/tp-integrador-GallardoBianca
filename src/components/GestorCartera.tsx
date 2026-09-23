import { useState, useEffect, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { comprar, vender, limpiarError } from '../store/carteraSlice';
import { usePrecios } from '../hooks/usePrecios';
import type { CryptoSymbol, TipoOperacion } from '../types/crypto';

// ── Tipos del componente ───────────────────────────────────────────────────────

export type TipoAviso = 'exito' | 'error' | 'info';

export interface Aviso {
  tipo: TipoAviso;
  mensaje: string;
}

interface GestorCarteraProps {
  onAviso: (aviso: Aviso) => void;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const SIMBOLOS: CryptoSymbol[] = ['BTC', 'ETH', 'SOL'];

const ETIQUETA_OPERACION: Record<TipoOperacion, string> = {
  COMPRA: 'Comprar',
  VENTA: 'Vender',
};

// ── Componente ────────────────────────────────────────────────────────────────

export function GestorCartera({ onAviso }: GestorCarteraProps) {
  const dispatch = useAppDispatch();
  const { balances, historial, error } = useAppSelector((s) => s.cartera);
  const { data: precios, isLoading, isError } = usePrecios();

  const [simbolo, setSimbolo] = useState<CryptoSymbol>('BTC');
  const [operacion, setOperacion] = useState<TipoOperacion>('COMPRA');
  const [cantidad, setCantidad] = useState('');

  // Propagar errores del slice al callback del padre
  useEffect(() => {
    if (error) {
      onAviso({ tipo: 'error', mensaje: error });
      dispatch(limpiarError());
    }
  }, [error, dispatch, onAviso]);

  const precioActual = precios?.[simbolo]?.precioUSD ?? null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cantidadNum = parseFloat(cantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      onAviso({ tipo: 'info', mensaje: 'Ingresa una cantidad válida mayor a 0.' });
      return;
    }
    if (precioActual === null) {
      onAviso({ tipo: 'info', mensaje: 'Esperando precio de mercado. Intenta de nuevo.' });
      return;
    }

    const payload = { simbolo, tipo: operacion, cantidad: cantidadNum, precioUnitario: precioActual };

    if (operacion === 'COMPRA') {
      dispatch(comprar(payload));
      onAviso({
        tipo: 'exito',
        mensaje: `Compra de ${cantidadNum} ${simbolo} registrada a $${precioActual.toLocaleString('es-MX')}.`,
      });
    } else {
      dispatch(vender(payload));
      // El aviso de error por saldo insuficiente llega por el useEffect de arriba
    }

    setCantidad('');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <h1 className="text-2xl font-bold text-white mb-8 tracking-tight">
        Cartera de Criptomonedas
      </h1>

      {/* ── Saldos ── */}
      <section aria-labelledby="titulo-saldos" className="mb-8">
        <h2 id="titulo-saldos" className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Saldos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SIMBOLOS.map((s) => {
            const precio = precios?.[s];
            const variacion = precio?.variacion24h ?? 0;
            const positivo = variacion >= 0;

            return (
              <div
                key={s}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-2"
              >
                <span className="text-xs font-bold text-gray-500 tracking-widest">{s}</span>
                <span className="text-2xl font-semibold text-white">
                  {balances[s].toFixed(6)}
                </span>
                {isLoading && (
                  <span className="text-xs text-gray-500 animate-pulse">Cargando precio…</span>
                )}
                {isError && (
                  <span className="text-xs text-red-400">Sin precio</span>
                )}
                {precio && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-300">
                      ${precio.precioUSD.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={positivo ? 'text-emerald-400' : 'text-red-400'}>
                      {positivo ? '+' : ''}{variacion.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Formulario ── */}
      <section aria-labelledby="titulo-operacion" className="mb-8">
        <h2 id="titulo-operacion" className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Nueva Operación
        </h2>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5 max-w-md"
          aria-label="Formulario de compra y venta de criptomonedas"
        >
          {/* Selector de símbolo */}
          <div className="flex flex-col gap-1">
            <label htmlFor="selector-simbolo" className="text-xs text-gray-400 font-medium">
              Cripto
            </label>
            <select
              id="selector-simbolo"
              value={simbolo}
              onChange={(e) => setSimbolo(e.target.value as CryptoSymbol)}
              aria-label="Seleccionar criptomoneda"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SIMBOLOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Selector de operación */}
          <fieldset>
            <legend className="text-xs text-gray-400 font-medium mb-2">Tipo de operación</legend>
            <div className="flex gap-3" role="group" aria-label="Seleccionar tipo de operación">
              {(Object.keys(ETIQUETA_OPERACION) as TipoOperacion[]).map((op) => (
                <label
                  key={op}
                  className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm font-semibold
                    transition-colors select-none
                    ${operacion === op
                      ? op === 'COMPRA'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-red-600 border-red-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                >
                  <input
                    type="radio"
                    name="operacion"
                    value={op}
                    checked={operacion === op}
                    onChange={() => setOperacion(op)}
                    aria-label={`Operación: ${ETIQUETA_OPERACION[op]}`}
                    className="sr-only"
                  />
                  {ETIQUETA_OPERACION[op]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Cantidad */}
          <div className="flex flex-col gap-1">
            <label htmlFor="input-cantidad" className="text-xs text-gray-400 font-medium">
              Cantidad
            </label>
            <input
              id="input-cantidad"
              type="number"
              min="0"
              step="any"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0.00000000"
              aria-label={`Cantidad de ${simbolo} a ${ETIQUETA_OPERACION[operacion].toLowerCase()}`}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white
                         placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {precioActual !== null && cantidad && parseFloat(cantidad) > 0 && (
              <p className="text-xs text-gray-500 mt-1" aria-live="polite">
                Total estimado: $
                {(parseFloat(cantidad) * precioActual).toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} USD
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !precioActual}
            aria-label={`Confirmar ${ETIQUETA_OPERACION[operacion].toLowerCase()} de ${simbolo}`}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
              disabled:opacity-40 disabled:cursor-not-allowed
              ${operacion === 'COMPRA'
                ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 focus:ring-red-500 text-white'
              }`}
          >
            {ETIQUETA_OPERACION[operacion]} {simbolo}
          </button>
        </form>
      </section>

      {/* ── Historial ── */}
      {historial.length > 0 && (
        <section aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Historial
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm" aria-label="Historial de transacciones">
              <thead>
                <tr className="bg-gray-900 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3" scope="col">Fecha</th>
                  <th className="text-left px-4 py-3" scope="col">Símbolo</th>
                  <th className="text-left px-4 py-3" scope="col">Tipo</th>
                  <th className="text-right px-4 py-3" scope="col">Cantidad</th>
                  <th className="text-right px-4 py-3" scope="col">Precio</th>
                  <th className="text-right px-4 py-3" scope="col">Total USD</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`border-t border-gray-800 ${i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}`}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(tx.fecha).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{tx.simbolo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold
                          ${tx.tipo === 'COMPRA' ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}
                      >
                        {tx.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200">{tx.cantidad.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right text-gray-200">
                      ${tx.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      ${tx.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
