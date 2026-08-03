# Pavaroma Frontend

## Project
- Brand: Pavaroma — "Awaken the True Aroma"
- Landing page (scroll-snap) + halaman detail produk dengan form order & review.
  Pembayaran di luar sistem — pelanggan transfer manual lalu upload bukti.
- Products — all Grade 1, Medium to Dark Roast, Semi Wash:
  - **Arabica Kintamani** — Bangli highlands, Bali
  - **Fine Robusta Pupuan** — Tabanan highlands, Bali
  - **House Blend Premium** — customer-chosen ratio, 50:50 to 75:25 Arabica
- Type: Storytelling landing page + price list. No cart, no checkout — every CTA is a WhatsApp deep link.

## Stack
- React 19 + Vite 7 + SWC + TypeScript 5.9 + pnpm
- Animation: `motion` package (NOT framer-motion) — import from `motion/react`
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` plugin — no tailwind.config.js
- Icons: `lucide-react`
- Routing: `react-router-dom` — `/` dan `/product/:productId`
- Backend: Supabase (Postgres + Storage + Edge Functions)
- `tsconfig.app.json` menyalakan **`erasableSyntaxOnly`** — parameter property
  (`constructor(private x)`), enum, dan namespace ditolak. Deklarasikan field manual.

## Backend & data
- Skema ada di `supabase/schema.sql` — jalankan di SQL Editor. Idempotent.
- **Tabel `orders` sengaja tidak punya policy anon.** Browser tidak pernah menulis
  ke sana; semua lewat Edge Function `submit-order` (service_role). Kalau browser
  boleh insert, ia juga bisa mengarang harga, dan anon key itu terlihat publik.
- Harga dihitung ulang di Edge Function. Tabel harga **diduplikasi** di
  `src/data/pricing.ts` dan `supabase/functions/submit-order/index.ts` —
  ubah di KEDUA tempat.
- Bucket `payment-proofs` **private**, anon hanya boleh INSERT. Owner melihat
  bukti transfer lewat signed URL yang dibuat Edge Function.
- Review tampil langsung tanpa moderasi. Proteksi: honeypot di form + trigger
  throttle di DB. Kalau spam lolos, pasang Cloudflare Turnstile.
- Notifikasi order: `NOTIFY_PROVIDER` env di Supabase Edge Function Secrets —
  `console` (default, hanya log) | `callmebot` | `whatsapp_cloud` | `telegram`.
  Menambah provider = satu `case` baru di `notify()`, tidak menyentuh form/DB.
- Kegagalan notifikasi TIDAK menggagalkan order — pelanggan mungkin sudah bayar.

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
- Product photos are used **uncropped, as supplied** (1536-wide, 3:2-ish landscape). The wide
  aspect matters: `ProductSection` uses `object-cover`, so an image narrower than the photo
  panel gets cropped *vertically* and loses the top of the beans and the base of the bag.
  Keep any replacement at aspect ≥ ~1.05.
- Known trade-off: the artwork has the product name typeset into its right side. At a given
  viewport only ~575 × (width/height) px of the 1536px source is visible, so below roughly a
  1850px-wide window that typeset name truncates mid-word. The bag and the typeset name cannot
  both fit at 1440px. Current setting favours the bag. Fixing this properly needs artwork
  without the baked-in name (it also says the old product names).

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
