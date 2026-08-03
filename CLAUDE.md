# Pavaroma Frontend

## Project
- Brand: Pavaroma — "Awaken the True Aroma"
- Products — all Grade 1, Medium to Dark Roast, Semi Wash:
  - **Arabica Kintamani** — Bangli highlands, Bali
  - **Fine Robusta Pupuan** — Tabanan highlands, Bali
  - **House Blend Special** — customer-chosen ratio, 50:50 to 75:25 Arabica
- Type: Storytelling landing page + price list. No cart, no checkout — every CTA is a WhatsApp deep link.

## Stack
- React 19 + Vite 7 + SWC + TypeScript 5.9 + pnpm
- Animation: `motion` package (NOT framer-motion) — import from `motion/react`
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin — no tailwind.config.js
- Icons: `lucide-react`

## Commands
- `pnpm dev` — start dev server
- `pnpm build` — tsc + vite build
- If pnpm aborts with `ERR_PNPM_IGNORED_BUILDS`, run `pnpm approve-builds` once to allow
  `@swc/core` and `esbuild` postinstall scripts.

## Content & i18n
- **All visitor-facing copy lives in `src/i18n/{en,id}.json`** as flat dot-keys. Keep the two files
  key-identical — Indonesian is the source of truth for product copy.
- `src/data/products.ts` is structure only (id, image, layout, noteCount, customRatio). No strings.
- `src/data/pricing.ts` holds the IDR price table; `PriceSection` typesets it in HTML.
  Don't ship the price list as an image — it can't be translated and is unreadable on a phone.

## Assets
- Product images in `src/assets/products/`: `arabica.jpg`, `robusta.jpg`, `blend.jpg`, plus `logo.png`
- Photos stay JPEG — PNG triples the file size for no gain on a photographic image.
- **Preparing a product photo** (the supplied shots are 1536-wide with the product name typeset
  into the artwork on the right, which would duplicate the section headline):
  1. Crop away the typeset name — for the current source that means keeping roughly `x < 915`.
  2. Pad the dark edges back out so the aspect ratio is **≥ 1.04**. `ProductSection` uses
     `object-cover`, and the photo panel's aspect reaches ~1.037 on a 16:9 screen. If the image
     is narrower than the panel, cover crops it *vertically* and lops off the top of the beans
     and the base of the bag. The padding is sacrificial — cover eats it first.

## Design Decisions
- 8 scroll-snap sections: hero → origin → roasting → arabica → robusta → blend → price → contact
- **ProductSection is a full-bleed photo panel, not a contained image.** The photo is
  `absolute inset-0 object-cover` in a `md:w-7/12` panel with gradient scrims fading it into
  `--color-bg` (horizontal on desktop, vertical on mobile). Its dark edges dissolve into the page.
  Do NOT give it a ring, border, or rounded corner — that turns the bleed into a visible card.
  Photo side alternates: arabica right, robusta left, blend right.
- Content sections (origin, roasting, price, contact) are **`min-h-dvh`, not `h-dvh`**. Combined
  with `overflow-hidden`, a fixed height silently clips the longer Indonesian copy on short
  phones (verified at 360×640). ProductSection stays `h-dvh` — its children are absolutely
  positioned, so they never contribute height anyway.
- **Never use a negative `viewport.margin` on a `whileInView` element near a section's bottom
  edge.** The margin shrinks the trigger area, so the element never intersects, and with
  `once: true` it stays at `opacity: 0` permanently. This silently hid the "Best for" line and
  the price CTA on 640px-tall screens.
- `NavDots` measures real section offsets rather than assuming a uniform section height,
  so it stays accurate when a section grows past the viewport.
- Color: bg #080808, gold #C9A84C, text #F5F0E8
- Fonts: Playfair Display (display) + DM Sans (body) via Google Fonts
- Scroll: CSS scroll-snap-type mandatory + Motion useScroll/useTransform for parallax

## Tailwind v4 Pattern
- Add plugin to vite.config.ts: `import tailwindcss from '@tailwindcss/vite'`
- In index.css: `@import "tailwindcss";`
- Custom tokens: `@theme { --color-gold: #C9A84C; }` in CSS
