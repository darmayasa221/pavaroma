import { useState, useEffect } from 'react'

interface NavDotsProps {
  sections: string[]
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function NavDots({ sections, containerRef }: NavDotsProps) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handler = () => {
      const height = container.clientHeight
      const index = Math.round(container.scrollTop / height)
      setActive(index)
    }

    container.addEventListener('scroll', handler, { passive: true })
    return () => container.removeEventListener('scroll', handler)
  }, [containerRef])

  const scrollTo = (index: number) => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ top: index * container.clientHeight, behavior: 'smooth' })
  }

  return (
    <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
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
