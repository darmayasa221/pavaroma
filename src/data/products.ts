import arabicaImg from "../assets/products/arabica.jpg";
import robustaImg from "../assets/products/robusta.jpg";
import blendImg from "../assets/products/blend.jpg";

export type ProductLayout = "left" | "right" | "center";

export interface Product {
  id: string;
  name: string;
  label: string;
  ratio?: string;
  image: string;
  layout: ProductLayout;
}

export const products: Product[] = [
  { id: "arabica", name: "Arabica", label: "PREMIUM", image: arabicaImg, layout: "right" },
  { id: "robusta", name: "Robusta", label: "PREMIUM", image: robustaImg, layout: "left" },
  { id: "blend", name: "Premium Blend", label: "PREMIUM", ratio: "60% Arabica · 40% Robusta", image: blendImg, layout: "center" },
];

export const WHATSAPP_NUMBER = "6282144703290";
