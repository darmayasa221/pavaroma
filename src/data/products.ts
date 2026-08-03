import arabicaImg from "../assets/products/arabica.jpg";
import robustaImg from "../assets/products/robusta.jpg";
import blendImg from "../assets/products/blend.jpg";

/** Which side the full-bleed photo panel sits on (desktop only — mobile is always full bleed). */
export type ProductLayout = "left" | "right";

/**
 * Structure only — every string a visitor reads lives in src/i18n
 * under the `product.<id>.*` namespace.
 */
export interface Product {
  id: string;
  image: string;
  layout: ProductLayout;
  /** How many `product.<id>.note.<n>` flavour chips exist in i18n. */
  noteCount: number;
  /** Blend is the only product sold at a customer-chosen ratio. */
  customRatio?: boolean;
}

export const products: Product[] = [
  { id: "arabica", image: arabicaImg, layout: "right", noteCount: 3 },
  { id: "robusta", image: robustaImg, layout: "left", noteCount: 3 },
  { id: "blend", image: blendImg, layout: "right", noteCount: 3, customRatio: true },
];

export const WHATSAPP_NUMBER = "6282144703290";
