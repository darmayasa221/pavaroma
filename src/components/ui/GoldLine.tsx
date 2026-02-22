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
