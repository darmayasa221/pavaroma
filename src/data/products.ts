export type ProductLayout = 'left' | 'right' | 'center'

export interface Product {
  id: string
  name: string
  label: string
  tagline: string
  description: string
  notes: string[]
  image: string
  layout: ProductLayout
}

export const products: Product[] = [
  {
    id: 'arabica',
    name: 'Arabica',
    label: 'PREMIUM',
    tagline: 'Light. Floral. Complex.',
    description:
      'Single-origin beans from the highlands — delivering a bright, nuanced cup with a natural sweetness that lingers.',
    notes: ['Floral', 'Bright Acidity', 'Natural Sweetness'],
    image: '/src/assets/products/arabica.jpg',
    layout: 'right',
  },
  {
    id: 'robusta',
    name: 'Robusta',
    label: 'PREMIUM',
    tagline: 'Bold. Intense. Full Body.',
    description:
      'High-caffeine, low-acid beans with a rich, earthy depth — the unmistakable backbone of a powerful espresso.',
    notes: ['Earthy Depth', 'High Caffeine', 'Dark Chocolate'],
    image: '/src/assets/products/robusta.jpg',
    layout: 'left',
  },
  {
    id: 'blend',
    name: 'Premium Blend',
    label: '60% ARABICA · 40% ROBUSTA',
    tagline: 'The best of both worlds.',
    description:
      'A masterfully balanced blend — where the brightness of Arabica meets the boldness of Robusta in perfect harmony.',
    notes: ['Balanced', 'Full Crema', 'Smooth Finish'],
    image: '/src/assets/products/blend.jpg',
    layout: 'center',
  },
]

export const WHATSAPP_NUMBER = '62xxxxxxxxxx' // replace with real number
export const WHATSAPP_MESSAGE = "Hi Pavaroma, I'd like to know more about your coffee beans."
