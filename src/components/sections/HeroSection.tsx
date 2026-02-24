import { motion } from 'motion/react'
import ScrollCue from '../ui/ScrollCue'
import GoldLine from '../ui/GoldLine'
import AmbientLight from '../ui/AmbientLight'
import logoImg from '../../assets/products/logo.png'

export default function HeroSection() {
  return (
    <section
      className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      <AmbientLight
        gradient="radial-gradient(ellipse 70% 55% at 50% 65%, #1a2e1c 0%, #0d0d0d 55%, #080808 100%)"
        opacity={1}
        duration={18}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">

        {/* Logo mark */}
        <motion.img
          src={logoImg}
          alt="Pavaroma logo"
          className="w-20 md:w-28 xl:w-32 mb-2"
          style={{ filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.35))' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Brand name — primary identity, dominant */}
        <motion.h1
          className="font-display text-5xl md:text-8xl xl:text-9xl text-gold font-normal tracking-[0.18em] md:tracking-[0.22em]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          PAVAROMA
        </motion.h1>

        <GoldLine className="w-24" delay={0.8} />

        {/* Tagline — secondary, elegant */}
        <motion.p
          className="font-display text-lg md:text-2xl xl:text-3xl text-text font-normal italic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Awaken the True Aroma.
        </motion.p>

        <GoldLine className="w-16" delay={1.3} />

        {/* Category label — tertiary */}
        <motion.p
          className="text-text-muted text-xs md:text-sm tracking-[0.3em] uppercase font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 1.6 }}
        >
          Premium Roasted Coffee
        </motion.p>
      </div>

      <ScrollCue />
    </section>
  )
}
