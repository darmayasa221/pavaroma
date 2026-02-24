# Pavaroma Coffee Website — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 6-section Apple-style scrollytelling landing page for Pavaroma coffee beans with Motion-powered parallax animations and a WhatsApp CTA.

**Architecture:** CSS scroll-snap container holds 6 full-screen sections (100dvh each). Motion `useScroll` + `useTransform` drives per-section parallax. Each product section reuses a single `ProductSection` component fed by a data array.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7 + SWC, Motion (`motion/react`), Tailwind CSS v4 (`@tailwindcss/vite`), lucide-react, Google Fonts (Playfair Display + DM Sans)

**Design reference:** `docs/plans/2026-02-22-pavaroma-coffee-design.md`

---

## Task 1: Install dependencies + configure Tailwind v4

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Modify: `index.html`

**Step 1: Install packages**

```bash
cd pavaroma-fe
pnpm add motion lucide-react
pnpm add -D tailwindcss @tailwindcss/vite
```

Expected: packages installed, pnpm-lock.yaml updated.

**Step 2: Update vite.config.ts**

Replace the full file:

```ts
import { defineConfig } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**Step 3: Replace src/index.css entirely**

```css
@import "tailwindcss";

@theme {
  --color-bg:         #080808;
  --color-surface:    #111111;
  --color-surface-2:  #1a1a1a;
  --color-gold:       #C9A84C;
  --color-gold-light: #E8C96D;
  --color-text:       #F5F0E8;
  --color-text-muted: #8C7D6E;
  --color-forest:     #2D3B2F;

  --font-display: "Playfair Display", Georgia, serif;
  --font-body:    "DM Sans", system-ui, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  background: #080808;
  color: #F5F0E8;
  font-family: var(--font-body);
}

/* Hide scrollbar on snap container */
.snap-container::-webkit-scrollbar {
  display: none;
}
.snap-container {
  scrollbar-width: none;
}
```

**Step 4: Add Google Fonts to index.html `<head>`**

Add before `</head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

**Step 5: Verify build compiles**

```bash
pnpm build
```
Expected: no errors.

**Step 6: Commit**

```bash
git init  # if not already a git repo
git add vite.config.ts src/index.css index.html package.json pnpm-lock.yaml
git commit -m "chore: add motion, tailwind v4, lucide-react; configure fonts and theme tokens"
```

---

## Task 2: Copy product images + set up data file

**Files:**
- Create: `src/assets/products/arabica.jpg`
- Create: `src/assets/products/robusta.jpg`
- Create: `src/assets/products/blend.jpg`
- Create: `src/data/products.ts`

**Step 1: Create assets directory and copy images**

```bash
mkdir -p src/assets/products
cp "../PHOTO-2026-02-22-18-49-09.jpg"   src/assets/products/arabica.jpg
cp "../PHOTO-2026-02-22-18-49-09 2.jpg" src/assets/products/robusta.jpg
cp "../PHOTO-2026-02-22-18-49-08.jpg"   src/assets/products/blend.jpg
```

**Step 2: Create src/data/products.ts**

```ts
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
export const WHATSAPP_MESSAGE = 'Hi Pavaroma, I\'d like to know more about your coffee beans.'
```

**Step 3: Commit**

```bash
git add src/assets/products/ src/data/products.ts
git commit -m "feat: add product assets and data file"
```

---

## Task 3: Set up scroll container + shared hooks

**Files:**
- Create: `src/hooks/useParallax.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.css` → delete contents (Tailwind replaces it)

**Step 1: Create src/hooks/useParallax.ts**

```ts
import { useRef } from 'react'
import { useScroll, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'

interface ParallaxResult {
  ref: React.RefObject<HTMLElement | null>
  y: MotionValue<string>
}

/**
 * Returns a ref and a y motion value that moves the element
 * at `speed` ratio as it scrolls through the viewport.
 * speed=0.15 means it moves 15% of the section height = subtle parallax.
 */
export function useParallax(speed = 0.15): ParallaxResult {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const travel = speed * 100
  const y = useTransform(scrollYProgress, [0, 1], [`${travel}%`, `-${travel}%`])
  return { ref: ref as React.RefObject<HTMLElement | null>, y }
}
```

**Step 2: Replace src/App.tsx**

```tsx
import HeroSection from './components/sections/HeroSection'
import OriginSection from './components/sections/OriginSection'
import ProductSection from './components/sections/ProductSection'
import ContactSection from './components/sections/ContactSection'
import NavDots from './components/ui/NavDots'
import { products } from './data/products'

const SECTIONS = ['hero', 'origin', 'arabica', 'robusta', 'blend', 'contact']

export default function App() {
  return (
    <div
      className="snap-container h-dvh overflow-y-scroll"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      <NavDots sections={SECTIONS} />
      <HeroSection />
      <OriginSection />
      {products.map((product) => (
        <ProductSection key={product.id} product={product} />
      ))}
      <ContactSection />
    </div>
  )
}
```

**Step 3: Clear src/App.css**

Delete all content — leave the file empty (Tailwind handles everything).

**Step 4: Verify dev server starts without errors**

```bash
pnpm dev
```
Expected: page loads (broken layout is fine — components don't exist yet).

**Step 5: Commit**

```bash
git add src/hooks/useParallax.ts src/App.tsx src/App.css
git commit -m "feat: set up scroll snap container, app shell, and parallax hook"
```

---

## Task 4: Shared UI components (GoldLine, ScrollCue, NavDots)

**Files:**
- Create: `src/components/ui/GoldLine.tsx`
- Create: `src/components/ui/ScrollCue.tsx`
- Create: `src/components/ui/NavDots.tsx`

**Step 1: Create src/components/ui/GoldLine.tsx**

```tsx
import { motion } from 'motion/react'

interface GoldLineProps {
  className?: string
  delay?: number
}

export default function GoldLine({ className = '', delay = 0 }: GoldLineProps) {
  return (
    <motion.div
      className={`h-px bg-gold origin-left ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    />
  )
}
```

**Step 2: Create src/components/ui/ScrollCue.tsx**

```tsx
import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

export default function ScrollCue() {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gold/60"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ChevronDown size={28} strokeWidth={1.5} />
    </motion.div>
  )
}
```

**Step 3: Create src/components/ui/NavDots.tsx**

```tsx
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'

interface NavDotsProps {
  sections: string[]
}

export default function NavDots({ sections }: NavDotsProps) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const container = document.querySelector('.snap-container')
    if (!container) return

    const handler = () => {
      const scrollTop = container.scrollTop
      const height = window.innerHeight
      const index = Math.round(scrollTop / height)
      setActive(index)
    }

    container.addEventListener('scroll', handler, { passive: true })
    return () => container.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (index: number) => {
    const container = document.querySelector('.snap-container')
    container?.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' })
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {sections.map((_, i) => (
        <button
          key={i}
          onClick={() => scrollTo(i)}
          aria-label={`Go to section ${i + 1}`}
          className="w-2 h-2 rounded-full transition-all duration-300 focus:outline-none"
          style={{
            background: active === i ? '#C9A84C' : 'rgba(200,169,76,0.3)',
            transform: active === i ? 'scale(1.4)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}
```

**Step 4: Verify dev server**

```bash
pnpm dev
```
Expected: UI components created, app shell renders (sections still missing).

**Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add GoldLine, ScrollCue, NavDots UI components"
```

---

## Task 5: Hero Section

**Files:**
- Create: `src/components/sections/HeroSection.tsx`

**Step 1: Create src/components/sections/HeroSection.tsx**

```tsx
import { motion } from 'motion/react'
import ScrollCue from '../ui/ScrollCue'
import GoldLine from '../ui/GoldLine'

const taglineWords = ['Awaken', 'the', 'True', 'Aroma.']

export default function HeroSection() {
  return (
    <section
      className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Background bokeh gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 60%, #2D3B2F 0%, transparent 70%)',
        }}
      />

      {/* Brand mark */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        {/* Logo / brand name */}
        <motion.p
          className="text-gold tracking-[0.35em] text-xs uppercase font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Pavaroma
        </motion.p>

        <GoldLine className="w-16" delay={0.5} />

        {/* Tagline word-by-word */}
        <h1 className="font-display text-5xl md:text-7xl xl:text-8xl text-text font-normal leading-tight">
          {taglineWords.map((word, i) => (
            <motion.span
              key={word}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.7 + i * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <GoldLine className="w-16" delay={1.4} />

        <motion.p
          className="text-text-muted text-sm tracking-[0.2em] uppercase font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
        >
          Premium Coffee Beans
        </motion.p>
      </motion.div>

      <ScrollCue />
    </section>
  )
}
```

**Step 2: Verify in dev server**

```bash
pnpm dev
```
Expected: Hero section renders with word-by-word animation, scroll cue bounces.

**Step 3: Commit**

```bash
git add src/components/sections/HeroSection.tsx
git commit -m "feat: add HeroSection with word-by-word tagline animation"
```

---

## Task 6: Origin Section

**Files:**
- Create: `src/components/sections/OriginSection.tsx`

**Step 1: Create src/components/sections/OriginSection.tsx**

```tsx
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import GoldLine from '../ui/GoldLine'

const lines = [
  'Every great cup begins',
  'with a single, exceptional bean.',
]

const body =
  'At Pavaroma, we source only the finest beans from Indonesia\'s rich highlands — where volcanic soil, altitude, and care produce coffee that speaks for itself.'

export default function OriginSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['10%', '-10%'])

  return (
    <section
      ref={ref}
      className="relative h-dvh flex items-center justify-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Atmospheric background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          y: bgY,
          background:
            'radial-gradient(ellipse 70% 60% at 30% 50%, #2D3B2F 0%, transparent 65%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
        <motion.p
          className="text-gold tracking-[0.3em] text-xs uppercase mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8 }}
        >
          Our Story
        </motion.p>

        <div className="mb-6">
          {lines.map((line, i) => (
            <motion.h2
              key={i}
              className="font-display text-3xl md:text-5xl text-text font-normal leading-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{
                duration: 0.9,
                delay: i * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {line}
            </motion.h2>
          ))}
        </div>

        <GoldLine className="w-12 mx-auto mb-8" delay={0.4} />

        <motion.p
          className="text-text-muted text-base md:text-lg leading-relaxed font-body font-light"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {body}
        </motion.p>
      </div>
    </section>
  )
}
```

**Step 2: Verify in dev server**

Navigate to section 2. Expected: text reveals on scroll, background gradient has subtle parallax.

**Step 3: Commit**

```bash
git add src/components/sections/OriginSection.tsx
git commit -m "feat: add OriginSection with parallax background and text reveal"
```

---

## Task 7: Product Section (reusable)

**Files:**
- Create: `src/components/sections/ProductSection.tsx`

**Step 1: Create src/components/sections/ProductSection.tsx**

```tsx
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import type { Product } from '../../data/products'
import GoldLine from '../ui/GoldLine'

interface Props {
  product: Product
}

export default function ProductSection({ product }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])

  const isCenter = product.layout === 'center'
  const isRight = product.layout === 'right'

  return (
    <section
      ref={ref}
      className="relative h-dvh flex items-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Subtle gold glow behind product */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: isCenter
            ? 'radial-gradient(ellipse 50% 60% at 50% 50%, #C9A84C 0%, transparent 70%)'
            : isRight
            ? 'radial-gradient(ellipse 40% 60% at 70% 50%, #C9A84C 0%, transparent 70%)'
            : 'radial-gradient(ellipse 40% 60% at 30% 50%, #C9A84C 0%, transparent 70%)',
        }}
      />

      <div
        className={`relative z-10 w-full max-w-7xl mx-auto px-8 flex flex-col ${
          isCenter
            ? 'items-center text-center gap-8 md:flex-col'
            : isRight
            ? 'md:flex-row-reverse items-center gap-12'
            : 'md:flex-row items-center gap-12'
        }`}
      >
        {/* Product Image */}
        <motion.div
          className="w-full md:w-1/2 flex justify-center"
          style={{ y: imgY }}
          initial={{ opacity: 0, scale: 0.88, x: isRight ? 60 : isCenter ? 0 : -60 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-72 md:w-96 xl:w-[420px] object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Text Content */}
        <div className={`w-full md:w-1/2 ${isCenter ? 'max-w-xl' : ''}`}>
          <motion.p
            className="text-gold tracking-[0.3em] text-xs uppercase mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7 }}
          >
            {product.label}
          </motion.p>

          <motion.h2
            className="font-display text-5xl md:text-6xl xl:text-7xl text-text font-normal italic leading-none mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {product.name}
          </motion.h2>

          <GoldLine className="w-16 mb-6" delay={0.3} />

          <motion.p
            className="text-gold-light text-lg md:text-xl font-display font-normal mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {product.tagline}
          </motion.p>

          <motion.p
            className="text-text-muted text-base leading-relaxed font-light mb-8 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {product.description}
          </motion.p>

          {/* Flavor notes */}
          <div className="flex flex-wrap gap-3">
            {product.notes.map((note, i) => (
              <motion.span
                key={note}
                className="text-xs tracking-[0.2em] uppercase text-gold border border-gold/30 px-3 py-1.5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              >
                {note}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Verify in dev server**

Scroll through sections 3–5. Expected: each product bag animates in from its direction, text staggers, flavor note tags appear.

**Step 3: Commit**

```bash
git add src/components/sections/ProductSection.tsx
git commit -m "feat: add reusable ProductSection with parallax, layout variants, and flavor notes"
```

---

## Task 8: Contact / CTA Section

**Files:**
- Create: `src/components/sections/ContactSection.tsx`

**Step 1: Create src/components/sections/ContactSection.tsx**

```tsx
import { motion } from 'motion/react'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from '../../data/products'
import GoldLine from '../ui/GoldLine'

export default function ContactSection() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <section
      className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-bg px-6"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Gold center glow */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, #C9A84C 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 text-center max-w-xl mx-auto">
        <motion.p
          className="text-gold tracking-[0.3em] text-xs uppercase mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Get in Touch
        </motion.p>

        <motion.h2
          className="font-display text-4xl md:text-6xl text-text font-normal leading-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Let's Talk Coffee.
        </motion.h2>

        <GoldLine className="w-12 mx-auto mb-8" delay={0.3} />

        <motion.p
          className="text-text-muted text-base md:text-lg leading-relaxed font-light mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Whether you're a café, a roaster, or simply someone who loves great coffee —
          we'd love to hear from you.
        </motion.p>

        {/* WhatsApp CTA */}
        <motion.a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-gold text-bg px-8 py-4 text-sm tracking-[0.15em] uppercase font-body font-medium transition-all duration-300"
          style={{ boxShadow: '0 0 0 rgba(201,168,76,0)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{
            boxShadow: '0 0 40px rgba(201,168,76,0.4)',
            y: -2,
          }}
          whileTap={{ scale: 0.97 }}
        >
          <MessageCircle size={18} />
          Chat on WhatsApp
        </motion.a>

        {/* Footer */}
        <motion.p
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-muted/40 text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
        >
          © 2026 Pavaroma · Awaken the True Aroma
        </motion.p>
      </div>
    </section>
  )
}
```

**Step 2: Verify in dev server**

Scroll to the last section. Expected: text animates in, WhatsApp button glows gold on hover.

**Step 3: Commit**

```bash
git add src/components/sections/ContactSection.tsx
git commit -m "feat: add ContactSection with WhatsApp CTA and gold glow hover"
```

---

## Task 9: Responsive polish

**Files:**
- Modify: `src/components/sections/ProductSection.tsx`
- Modify: `src/components/sections/HeroSection.tsx`

**Step 1: Verify mobile layout (375px viewport)**

In browser DevTools, set viewport to 375px wide and scroll through all 6 sections.

Check:
- [ ] Hero: tagline doesn't overflow, text is readable
- [ ] Origin: text doesn't overflow
- [ ] Products: image stacks above text, both are readable
- [ ] Contact: button is full-width-friendly, text fits

**Step 2: Fix any overflows or font sizing**

Common fixes needed — adjust these in the relevant component if needed:
- Hero title: add `text-4xl` base, `md:text-7xl` responsive
- Product image: cap at `w-64` on mobile, `md:w-96` on desktop
- Product layout: `flex-col` on mobile, `md:flex-row` on desktop (already set)

**Step 3: Verify final build**

```bash
pnpm build
```
Expected: no TypeScript errors, no build warnings.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: responsive polish for mobile layout"
```

---

## Task 10: Final verification

**Step 1: Run dev server and do full walkthrough**

```bash
pnpm dev
```

Check each section:
- [ ] §1 Hero: word-by-word animation fires on load, scroll cue bounces
- [ ] §2 Origin: text reveals on scroll, parallax background visible
- [ ] §3 Arabica: bag slides from right, flavor notes stagger
- [ ] §4 Robusta: bag slides from left, reversed layout
- [ ] §5 Blend: centered layout, bag scales in
- [ ] §6 Contact: WhatsApp button opens `wa.me` link in new tab, glow on hover
- [ ] NavDots: active dot is gold, clicking navigates to section
- [ ] All sections snap cleanly on scroll
- [ ] No console errors

**Step 2: Update WHATSAPP_NUMBER in products.ts**

Replace `62xxxxxxxxxx` with the real WhatsApp number.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Pavaroma storytelling landing page"
```

---

## Quick Reference

```bash
# Dev
pnpm dev

# Build check
pnpm build

# Install all deps (fresh clone)
pnpm install
```

**WhatsApp number:** Update `WHATSAPP_NUMBER` in `src/data/products.ts`

**Add new product:** Add entry to `products` array in `src/data/products.ts` — `ProductSection` renders automatically.
