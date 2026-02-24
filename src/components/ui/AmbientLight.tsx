import { motion, type MotionValue } from 'motion/react'

interface Props {
  gradient: string
  opacity?: number
  duration?: number
  parallaxY?: MotionValue<string>
}

/**
 * Floating ambient background light — GPU-accelerated via transform.
 * Outer wrapper handles scroll parallax (if provided).
 * Inner blob drifts independently for an organic, living feel.
 */
export default function AmbientLight({ gradient, opacity = 0.6, duration = 14, parallaxY }: Props) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={parallaxY ? { y: parallaxY } : {}}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: gradient, opacity }}
        animate={{
          x: ['0%', '2.5%', '-1.5%', '1.8%', '-0.8%', '0%'],
          y: ['0%', '-2.5%', '1.8%', '-1.2%', '0.6%', '0%'],
          scale: [1, 1.04, 0.97, 1.05, 0.99, 1],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
