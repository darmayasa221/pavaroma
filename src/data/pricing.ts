/** Prices in IDR per kilogram. Source: Pavaroma price list, Feb 2026. */

export interface BlendPrice {
  arabica: number;
  robusta: number;
  price: number;
}

export interface SinglePrice {
  /** Matches a Product id, so the row reuses `product.<id>.name` from i18n. */
  id: string;
  price: number;
}

export const BLEND_PRICES: BlendPrice[] = [
  { arabica: 75, robusta: 25, price: 230_000 },
  { arabica: 70, robusta: 30, price: 225_000 },
  { arabica: 65, robusta: 35, price: 220_000 },
  { arabica: 60, robusta: 40, price: 215_000 },
  { arabica: 50, robusta: 50, price: 205_000 },
];

export const SINGLE_PRICES: SinglePrice[] = [
  { id: "arabica", price: 280_000 },
  { id: "robusta", price: 150_000 },
];

const idr = new Intl.NumberFormat("id-ID");

/** 230000 → "Rp 230.000" — dot separators in both locales, as printed on the list. */
export const formatPrice = (value: number): string => `Rp ${idr.format(value)}`;

/** Jarak tersingkat antara order masuk dan tanggal kirim. */
export const MIN_DELIVERY_DAYS = 3
/** Sejauh mana pelanggan boleh menjadwalkan ke depan. */
export const MAX_DELIVERY_DAYS = 90

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * `YYYY-MM-DD` dalam waktu LOKAL pengunjung — bukan `toISOString()`, yang
 * memakai UTC dan bisa meleset satu hari bagi pengguna di WITA/WIT.
 */
export const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function deliveryDateBounds(from: Date = new Date()): { min: string; max: string } {
  const min = new Date(from)
  min.setDate(min.getDate() + MIN_DELIVERY_DAYS)
  const max = new Date(from)
  max.setDate(max.getDate() + MAX_DELIVERY_DAYS)
  return { min: toDateInput(min), max: toDateInput(max) }
}

/** "75:25" — the wire format for a blend ratio, stored on the order row. */
export const blendVariant = (row: BlendPrice): string => `${row.arabica}:${row.robusta}`;

/** The default blend ratio offered when the detail page first opens. */
export const DEFAULT_BLEND_VARIANT = blendVariant(BLEND_PRICES[3]); // 60:40

/**
 * Price per kg for a product, resolved the same way on the detail page and in
 * the Edge Function, so the total a customer sees is the total that gets stored.
 * Returns null when the variant doesn't exist — callers must reject the order
 * rather than guess a price.
 */
export function resolveUnitPrice(productId: string, variant?: string | null): number | null {
  if (productId === "blend") {
    const row = BLEND_PRICES.find((r) => blendVariant(r) === variant);
    return row ? row.price : null;
  }
  const single = SINGLE_PRICES.find((r) => r.id === productId);
  return single ? single.price : null;
}
