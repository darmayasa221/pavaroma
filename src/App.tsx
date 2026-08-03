import { useRef } from 'react'
import HeroSection from './components/sections/HeroSection'
import OriginSection from './components/sections/OriginSection'
import RoastingSection from './components/sections/RoastingSection'
import ProductSection from './components/sections/ProductSection'
import PriceSection from './components/sections/PriceSection'
import ContactSection from './components/sections/ContactSection'
import NavDots from './components/ui/NavDots'
import WhatsAppFAB from './components/ui/WhatsAppFAB'
import LangToggle from './components/ui/LangToggle'
import { products } from './data/products'
import { ScrollContext } from './contexts/ScrollContext'
import { LangProvider } from './contexts/LangContext'

// Derived from `products` so the nav dots can never desync from the rendered sections.
const SECTIONS = [
  'hero',
  'origin',
  'roasting',
  ...products.map((p) => p.id),
  'price',
  'contact',
]

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <LangProvider>
      <ScrollContext.Provider value={containerRef}>
        <LangToggle />
        <WhatsAppFAB />
        <div
          ref={containerRef}
          className="snap-container h-dvh overflow-y-scroll"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <NavDots sections={SECTIONS} containerRef={containerRef} />
          <HeroSection />
          <OriginSection />
          <RoastingSection />
          {products.map((product) => (
            <ProductSection key={product.id} product={product} />
          ))}
          <PriceSection />
          <ContactSection />
        </div>
      </ScrollContext.Provider>
    </LangProvider>
  )
}
