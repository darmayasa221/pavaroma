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

    // Sections are min-h-dvh, so any of them can be taller than the viewport
    // on a short screen. Measure real offsets rather than assuming a uniform height.
    const offsets = () => {
      const containerTop = container.getBoundingClientRect().top
      return [...container.querySelectorAll<HTMLElement>(':scope > section')].map(
        (s) => s.getBoundingClientRect().top - containerTop + container.scrollTop,
      )
    }

    const handler = () => {
      const midpoint = container.scrollTop + container.clientHeight / 2
      const tops = offsets()
      let index = 0
      tops.forEach((top, i) => {
        if (top < midpoint) index = i
      })
      setActive(index)
    }

    handler()
    container.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      container.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [containerRef])

  const scrollTo = (index: number) => {
    const container = containerRef.current
    if (!container) return
    const section = container.querySelectorAll<HTMLElement>(':scope > section')[index]
    if (!section) return
    const containerTop = container.getBoundingClientRect().top
    container.scrollTo({
      top: section.getBoundingClientRect().top - containerTop + container.scrollTop,
      behavior: 'smooth',
    })
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
