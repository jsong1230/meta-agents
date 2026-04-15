/**
 * Price service — CoinGecko API with 30s cache.
 * Server stamps price to prevent agent gaming.
 */

const CACHE_TTL = 30_000; // 30 seconds
const cache = new Map<string, { price: number; fetchedAt: number }>();

const COINGECKO_IDS: Record<string, string> = {
  "BTC/USDT": "bitcoin",
  "ETH/USDT": "ethereum",
  "META/USDT": "metadium",
  "SOL/USDT": "solana",
  "BNB/USDT": "binancecoin",
};

export async function getPrice(pair: string): Promise<number> {
  const now = Date.now();
  const cached = cache.get(pair);
  if (cached && now - cached.fetchedAt < CACHE_TTL) {
    return cached.price;
  }

  const coinId = COINGECKO_IDS[pair];
  if (!coinId) {
    throw new Error(`Unsupported pair: ${pair}. Supported: ${Object.keys(COINGECKO_IDS).join(", ")}`);
  }

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    { next: { revalidate: 30 } }
  );

  if (!res.ok) {
    // Fallback: return cached price if available, or throw
    if (cached) return cached.price;
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json();
  const price = data[coinId]?.usd;
  if (!price) {
    if (cached) return cached.price;
    throw new Error(`No price data for ${coinId}`);
  }

  cache.set(pair, { price, fetchedAt: now });
  return price;
}

export function getSupportedPairs(): string[] {
  return Object.keys(COINGECKO_IDS);
}
