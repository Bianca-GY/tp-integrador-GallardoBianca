import { useQuery } from '@tanstack/react-query';
import type { CryptoSymbol, PreciosResponse } from '../types/crypto';

const SIMBOLOS: CryptoSymbol[] = ['BTC', 'ETH', 'SOL'];

const ID_COINGECKO: Record<CryptoSymbol, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
};

async function fetchPrecios(): Promise<PreciosResponse> {
  const ids = Object.values(ID_COINGECKO).join(',');
  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al obtener precios: ${res.status}`);

  const data = await res.json();
  const ahora = new Date().toISOString();

  return SIMBOLOS.reduce<PreciosResponse>((acc, simbolo) => {
    const id = ID_COINGECKO[simbolo];
    acc[simbolo] = {
      simbolo,
      precioUSD: data[id]?.usd ?? 0,
      variacion24h: data[id]?.usd_24h_change ?? 0,
      actualizadoEn: ahora,
    };
    return acc;
  }, {} as PreciosResponse);
}

export function usePrecios() {
  return useQuery<PreciosResponse, Error>({
    queryKey: ['precios-crypto'],
    queryFn: fetchPrecios,
    refetchInterval: 30_000, // refresca cada 30 s
    staleTime: 25_000,
  });
}
