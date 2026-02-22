import { useState, useEffect } from 'react'

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
