# Pavaroma Coffee Website — Design Document
**Date:** 2026-02-22
**Type:** Pure storytelling landing page
**Brand tagline:** "Awaken the True Aroma"

---

## Goals
- Apple-style scrollytelling experience for Pavaroma coffee beans
- Introduce 3 products: Arabica Premium, Robusta Premium, Premium Blend
- End with a WhatsApp CTA — no cart, no checkout
- Responsive: mobile-first, full desktop experience

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 19 + Vite 7 + SWC | Existing setup |
| Language | TypeScript 5.9 | Existing setup |
| Package manager | pnpm | Existing setup |
| Animation | `motion` (Motion for React) | React-native, useScroll/useTransform, no license issues |
| Styling | Tailwind CSS v4 + `@tailwindcss/vite` | No config file, CSS-first tokens |
| Icons | `lucide-react` | Minimal, tree-shakeable |

**Install commands:**
```bash
pnpm add motion lucide-react
pnpm add -D tailwindcss @tailwindcss/vite
```

---

## Page Architecture

6 full-screen sections with CSS `scroll-snap-type: y mandatory`.

| # | Section | Content |
|---|---|---|
| 1 | Hero | Brand mark fade-in, tagline word-by-word reveal, scroll cue |
| 2 | Origin Story | Brand narrative, atmospheric text reveal, forest parallax BG |
| 3 | Arabica Premium | Bag floats in from right, flavor notes stagger, gold line extends |
| 4 | Robusta Premium | Bag floats in from left, bold/strong copy, reversed layout |
| 5 | Premium Blend | Centered, 60/40 balance narrative |
| 6 | Contact CTA | "Let's Talk Coffee", WhatsApp gold glow button, footer |

---

## Visual Design System

### Colors
```css
@theme {
  --color-bg:         #080808;
  --color-surface:    #111111;
  --color-surface-2:  #1a1a1a;
  --color-gold:       #C9A84C;
  --color-gold-light: #E8C96D;
  --color-text:       #F5F0E8;
  --color-text-muted: #8C7D6E;
  --color-forest:     #2D3B2F;
}
```

### Typography
- **Display / Product names:** `Playfair Display` — serif, mirrors the script style on product photos
- **Body / UI:** `DM Sans` — clean, modern, legible at small sizes
- Load via Google Fonts in `index.html`

### Spacing
- Section padding: `px-6 py-20` mobile, `px-20 py-32` desktop
- Max content width: `max-w-7xl mx-auto`

---

## Animation System

### Scroll Container
```css
.scroll-container {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}
.scroll-section {
  height: 100dvh;
  scroll-snap-align: start;
}
```

### Per-section Parallax (Motion pattern)
```tsx
const ref = useRef(null)
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"]
})
const y = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"])
// Apply to background image layer
```

### Entry Animations
- Product bag: `initial={{ opacity: 0, scale: 0.88, y: 40 }}` → `whileInView={{ opacity: 1, scale: 1, y: 0 }}`
- Text lines: staggered `delay: index * 0.1` via `variants`
- Gold accent line: `scaleX: 0 → 1`, `originX: 0` (reveal left to right)
- All transitions: `{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }` (custom ease-out cubic)

---

## Product Data

```ts
const products = [
  {
    id: "arabica",
    name: "Arabica",
    label: "PREMIUM",
    tagline: "Light. Floral. Complex.",
    description: "Single-origin beans from the highlands, delivering a bright, nuanced cup with natural sweetness.",
    image: "/src/assets/products/arabica.jpg",
    layout: "right", // image floats from right
  },
  {
    id: "robusta",
    name: "Robusta",
    label: "PREMIUM",
    tagline: "Bold. Intense. Full Body.",
    description: "High-caffeine, low-acid beans with a rich, earthy depth — the backbone of a powerful espresso.",
    image: "/src/assets/products/robusta.jpg",
    layout: "left",
  },
  {
    id: "blend",
    name: "Premium Blend",
    label: "60% ARABICA · 40% ROBUSTA",
    tagline: "The best of both worlds.",
    description: "A carefully balanced blend — the brightness of Arabica meeting the boldness of Robusta.",
    image: "/src/assets/products/blend.jpg",
    layout: "center",
  },
]
```

---

## File Structure

```
src/
  assets/
    products/
      arabica.jpg
      robusta.jpg
      blend.jpg
  components/
    sections/
      HeroSection.tsx
      OriginSection.tsx
      ProductSection.tsx      ← reusable, accepts product data
      ContactSection.tsx
    ui/
      GoldLine.tsx            ← animated gold accent line
      ScrollCue.tsx           ← bouncing scroll arrow
      NavDots.tsx             ← section indicator dots (right side)
  hooks/
    useParallax.ts            ← wraps useScroll + useTransform
  data/
    products.ts               ← product data array
  App.tsx
  index.css                   ← @import "tailwindcss" + @theme tokens
  main.tsx
```

---

## Responsive Approach
- Mobile: single column, product image top / text below
- Tablet+: split layout (image | text), 50/50
- Desktop: wider gap, larger type scale, more parallax travel distance
- Breakpoints follow Tailwind defaults: `sm:640 md:768 lg:1024 xl:1280`

---

## Contact CTA
- WhatsApp link format: `https://wa.me/<number>?text=Hi%20Pavaroma%2C%20...`
- Number: TBD (placeholder in `data/products.ts` or `.env`)
- Button: gold background, dark text, glow shadow on hover (`shadow-[0_0_30px_#C9A84C40]`)

---

## Assets To Move
Before implementation, copy from project root to `src/assets/products/`:
```bash
cp ../PHOTO-2026-02-22-18-49-09.jpg src/assets/products/arabica.jpg
cp ../PHOTO-2026-02-22-18-49-09\ 2.jpg src/assets/products/robusta.jpg
cp ../PHOTO-2026-02-22-18-49-08.jpg src/assets/products/blend.jpg
```
