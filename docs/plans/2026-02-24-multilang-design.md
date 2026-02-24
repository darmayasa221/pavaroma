# Multilang (ID / EN) — Design Doc

**Date:** 2026-02-24
**Status:** Approved

## Overview

Add Indonesian (ID) and English (EN) language support to the Pavaroma landing page. Default language is EN. Preference is persisted in `localStorage`. No external i18n library — custom React Context.

## File Structure

```
src/
  i18n/
    en.json
    id.json
  contexts/
    LangContext.tsx     ← context + useLang() hook
  components/ui/
    LangToggle.tsx      ← fixed top-right toggle
```

## Translation Approach

**Approach A — flat key-value JSON.**

```json
{
  "hero.tagline": "Awaken the True Aroma.",
  "hero.category": "Premium Roasted Coffee"
}
```

One `en.json` and one `id.json`. `t('key')` resolves against active language.

## LangContext API

```ts
const { lang, toggle, t } = useLang()
// lang: 'en' | 'id'
// toggle: () => void
// t: (key: string) => string
```

Init order: `localStorage.getItem('lang')` → fallback `'en'`.
On toggle: flip lang, `localStorage.setItem('lang', newLang)`.

## Toggle UI

- Position: `fixed top-4 right-6 z-50`
- Style: dark bg, gold active label, muted inactive
- Format: `ID · EN` — active language is gold, inactive is muted
- Visible on all screen sizes (unlike NavDots which hides on mobile)

## Translation Scope

All user-facing strings across:

| Section | Keys |
|---|---|
| HeroSection | `hero.tagline`, `hero.category` |
| OriginSection | `origin.eyebrow`, `origin.heading`, `origin.body` |
| RoastingSection | `roasting.eyebrow`, `roasting.heading`, `roasting.body` |
| ProductSection | `product.{id}.tagline`, `product.{id}.description`, `product.{id}.note.{i}` |
| ContactSection | `contact.eyebrow`, `contact.heading`, `contact.body`, `contact.cta`, `contact.footer` |
| WhatsAppFAB | `whatsapp.label` |
| WhatsApp message | `whatsapp.message` |

## products.ts

Structural fields stay in `products.ts` (id, name, label, ratio, image, layout).
Translatable fields (tagline, description, notes) move to JSON and are looked up via `t('product.arabica.tagline')` etc.

## Data Flow

```
localStorage('lang') → LangContext init
       ↕
  LangToggle click → toggle() → re-render all t() calls
```

## Default Language

English (`en`). Indonesian translation uses natural, conversational Bahasa Indonesia — not literal word-for-word translation.
