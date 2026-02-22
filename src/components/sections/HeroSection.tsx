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
      {/* Background bokeh gradient — richer visibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 65%, #1a2e1c 0%, #0d0d0d 55%, #080808 100%)',
        }}
      />

      {/* Brand mark */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <motion.p
          className="text-gold tracking-[0.4em] text-xs uppercase font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Pavaroma
        </motion.p>

        <GoldLine className="w-16" delay={0.5} />

        {/* Tagline — flex wrap with gap to prevent word concatenation */}
        <h1 className="font-display text-4xl md:text-7xl xl:text-8xl text-text font-normal leading-tight flex flex-wrap justify-center gap-x-4 md:gap-x-5">
          {taglineWords.map((word, i) => (
            <motion.span
              key={i}
              className="block"
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
          className="text-text-muted text-xs md:text-sm tracking-[0.25em] uppercase font-body"
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
