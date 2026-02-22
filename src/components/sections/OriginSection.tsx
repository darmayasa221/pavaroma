import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import GoldLine from '../ui/GoldLine'

const lines = [
  'Every great cup begins',
  'with a single, exceptional bean.',
]

const body =
  "At Pavaroma, we source only the finest beans from Indonesia's rich highlands — where volcanic soil, altitude, and care produce coffee that speaks for itself."

export default function OriginSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['10%', '-10%'])

  return (
    <section
      ref={ref}
      className="relative h-dvh flex items-center justify-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          y: bgY,
          background:
            'radial-gradient(ellipse 70% 60% at 30% 50%, #2D3B2F 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
        <motion.p
          className="text-gold tracking-[0.3em] text-xs uppercase mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8 }}
        >
          Our Story
        </motion.p>

        <h2 className="font-display text-3xl md:text-5xl text-text font-normal leading-tight mb-6">
          {lines.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{
                duration: 0.9,
                delay: i * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {line}
            </motion.span>
          ))}
        </h2>

        <GoldLine className="w-12 mx-auto mb-8" delay={0.4} />

        <motion.p
          className="text-text-muted text-base md:text-lg leading-relaxed font-body font-light"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {body}
        </motion.p>
      </div>
    </section>
  )
}
