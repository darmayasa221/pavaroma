import { motion } from 'motion/react'
import ScrollCue from '../ui/ScrollCue'
import GoldLine from '../ui/GoldLine'

const taglineWords = ['Awaken', 'the', 'True', 'Aroma.']

export default function HeroSection() {
  return (
    <section
      className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Background bokeh gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 60%, #2D3B2F 0%, transparent 70%)',
        }}
      />

      {/* Brand mark */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <motion.p
          className="text-gold tracking-[0.35em] text-xs uppercase font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Pavaroma
        </motion.p>

        <GoldLine className="w-16" delay={0.5} />

        <h1 className="font-display text-4xl md:text-7xl xl:text-8xl text-text font-normal leading-tight">
          {taglineWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.7 + i * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <GoldLine className="w-16" delay={1.4} />

        <motion.p
          className="text-text-muted text-sm tracking-[0.2em] uppercase font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
        >
          Premium Coffee Beans
        </motion.p>
      </motion.div>

      <ScrollCue />
    </section>
  )
}
