import arabicaImg from "../assets/products/arabica.jpg";
import robustaImg from "../assets/products/robusta.jpg";
import blendImg from "../assets/products/blend.jpg";

export type ProductLayout = "left" | "right" | "center";

export interface Product {
  id: string;
  name: string;
  label: string;
  ratio?: string;
  tagline: string;
  description: string;
  notes: string[];
  image: string;
  layout: ProductLayout;
}

export const products: Product[] = [
  {
    id: "arabica",
    name: "Arabica",
    label: "PREMIUM",
    tagline: "Light. Floral. Complex.",
    description:
      "Single-origin roasted beans from the highlands — delivering a bright, nuanced cup with a natural sweetness that lingers.",
    notes: ["Floral", "Bright Acidity", "Natural Sweetness"],
    image: arabicaImg,
    layout: "right",
  },
  {
    id: "robusta",
    name: "Robusta",
    label: "PREMIUM",
    tagline: "Bold. Intense. Full Body.",
    description:
      "High-caffeine, low-acid roasted beans with a rich, earthy depth — the unmistakable backbone of a powerful espresso.",
    notes: ["Earthy Depth", "High Caffeine", "Dark Chocolate"],
    image: robustaImg,
    layout: "left",
  },
  {
    id: "blend",
    name: "Premium Blend",
    label: "PREMIUM",
    ratio: "60% Arabica · 40% Robusta",
    tagline: "The best of both worlds.",
    description:
      "A masterfully balanced blend — where the brightness of Arabica meets the boldness of Robusta in perfect harmony.",
    notes: ["Balanced", "Full Crema", "Smooth Finish"],
    image: blendImg,
    layout: "center",
  },
];

export const WHATSAPP_NUMBER = "6282144703290"; // replace with real number
export const WHATSAPP_MESSAGE =
  "Hi Pavaroma, I'd like to know more about your roasted coffee.";
