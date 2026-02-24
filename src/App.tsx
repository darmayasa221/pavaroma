import { useRef } from 'react'
import HeroSection from './components/sections/HeroSection'
import OriginSection from './components/sections/OriginSection'
import RoastingSection from './components/sections/RoastingSection'
import ProductSection from './components/sections/ProductSection'
import ContactSection from './components/sections/ContactSection'
import NavDots from './components/ui/NavDots'
import WhatsAppFAB from './components/ui/WhatsAppFAB'
import { products } from './data/products'
import { ScrollContext } from './contexts/ScrollContext'

const SECTIONS = ['hero', 'origin', 'roasting', 'arabica', 'robusta', 'blend', 'contact']

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <ScrollContext.Provider value={containerRef}>
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
        <ContactSection />
      </div>
    </ScrollContext.Provider>
  )
}
