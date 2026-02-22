import { useRef } from 'react'
import { useScroll, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useScrollContainer } from '../contexts/ScrollContext'

interface ParallaxResult {
  ref: React.RefObject<HTMLElement | null>
  y: MotionValue<string>
}

export function useParallax(speed = 0.15): ParallaxResult {
  const ref = useRef<HTMLElement | null>(null)
  const container = useScrollContainer()
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ['start end', 'end start'],
  })
  const travel = speed * 100
  const y = useTransform(scrollYProgress, [0, 1], [`${travel}%`, `-${travel}%`])
  return { ref, y }
}
