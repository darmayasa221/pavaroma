import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import GoldLine from '../ui/GoldLine'
import AmbientLight from '../ui/AmbientLight'
import { useScrollContainer } from '../../contexts/ScrollContext'
import { useLang } from '../../contexts/LangContext'

export default function RoastingSection() {
  const { t } = useLang()
  const ref = useRef<HTMLElement>(null)
  const container = useScrollContainer()
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['12%', '-12%'])

  return (
    <section
      ref={ref}
      className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-bg py-16 md:py-12"
      style={{ scrollSnapAlign: 'start' }}
    >
      <AmbientLight
        gradient="radial-gradient(ellipse 80% 70% at 65% 50%, #1f1205 0%, #120c03 45%, transparent 72%)"
        opacity={0.7}
        duration={13}
        parallaxY={bgY}
      />

      {/* Decorative flame / heat mark — faint number or glyph */}
      <div
        className="absolute top-1/2 right-[15%] -translate-y-1/2 font-display text-[20rem] leading-none select-none pointer-events-none text-gold"
        style={{ opacity: 0.03 }}
        aria-hidden="true"
      >
        °
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full px-8">

        {/* Label */}
        <motion.p
          className="text-gold tracking-[0.35em] text-xs uppercase mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8 }}
        >
          {t('roasting.eyebrow')}
        </motion.p>

        {/* Heading */}
        <motion.h2
          className="font-display text-3xl md:text-5xl text-text font-normal italic leading-snug mb-8 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {t('roasting.heading')}
        </motion.h2>

        <GoldLine className="w-12 mx-auto mb-10" delay={0.4} />

        {/* Spec cards */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 md:gap-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {(['roastType', 'process', 'freshness'] as const).map((key) => (
            <div
              key={key}
              className="border border-gold/25 px-5 md:px-6 py-3.5 md:py-4 text-left min-w-[132px] md:min-w-[170px]"
            >
              <p className="text-gold text-[10px] tracking-[0.25em] uppercase mb-2 font-body">
                {t(`roasting.spec.${key}.label`)}
              </p>
              <p className="text-text text-sm md:text-base font-display font-normal leading-snug">
                {t(`roasting.spec.${key}.value`)}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Body */}
        <motion.p
          className="text-text-muted text-sm md:text-base leading-relaxed font-body font-light max-w-sm md:max-w-md"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          {t('roasting.body')}
        </motion.p>
      </div>
    </section>
  )
}
