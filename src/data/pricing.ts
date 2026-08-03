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
