# Pavaroma Frontend

## Project
- Brand: Pavaroma — "Awaken the True Aroma"
- Products: Arabica Premium, Robusta Premium, Premium Blend (60% Arabica + 40% Robusta)
- Type: Pure storytelling landing page (no e-commerce)

## Stack
- React 19 + Vite 7 + SWC + TypeScript 5.9 + pnpm
- Animation: `motion` package (NOT framer-motion) — import from `motion/react`
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin — no tailwind.config.js
- Icons: `lucide-react`

## Commands
- `pnpm dev` — start dev server
- `pnpm build` — tsc + vite build

## Assets
- Product images live in `src/assets/products/` (copied from project root)
- 3 images: arabica.jpg, robusta.jpg, blend.jpg

## Design Decisions
- 6 full-screen scroll-snap sections (100dvh each)
- Color: bg #080808, gold #C9A84C, text #F5F0E8
- Fonts: Playfair Display (display) + DM Sans (body) via Google Fonts
- CTA: WhatsApp direct link (no form, no cart)
- Scroll: CSS scroll-snap-type mandatory + Motion useScroll/useTransform for parallax

## Tailwind v4 Pattern
- Add plugin to vite.config.ts: `import tailwindcss from '@tailwindcss/vite'`
- In index.css: `@import "tailwindcss";`
- Custom tokens: `@theme { --color-gold: #C9A84C; }` in CSS
