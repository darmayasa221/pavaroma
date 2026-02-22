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
