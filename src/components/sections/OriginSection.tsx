import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { MapPin } from 'lucide-react'
import GoldLine from '../ui/GoldLine'
import AmbientLight from '../ui/AmbientLight'
import { useScrollContainer } from '../../contexts/ScrollContext'
import { useLang } from '../../contexts/LangContext'

export default function OriginSection() {
  const { t } = useLang()
  const ref = useRef<HTMLElement>(null)
  const container = useScrollContainer()
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['15%', '-15%'])

  return (
    <section
      ref={ref}
      className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-bg py-16 md:py-12"
      style={{ scrollSnapAlign: 'start' }}
    >
      <AmbientLight
        gradient="radial-gradient(ellipse 90% 80% at 25% 55%, #1c3320 0%, #0f1f10 45%, transparent 72%)"
        opacity={0.6}
        duration={16}
        parallaxY={bgY}
      />

      {/* Decorative large quote mark */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] font-display text-[18rem] md:text-[24rem] leading-none select-none pointer-events-none text-gold"
        style={{ opacity: 0.045 }}
        aria-hidden="true"
      >
        "
      </div>

      {/* Content — flex column, items-center aligns children reliably */}
      <div className="relative z-10 flex flex-col items-center text-center w-full px-8">

        {/* Label */}
        <motion.p
          className="text-gold tracking-[0.35em] text-xs uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8 }}
        >
          {t('origin.eyebrow')}
        </motion.p>

        {/* Location badges — one per terroir */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
          {(['origin.location.robusta', 'origin.location.arabica'] as const).map((key, i) => (
            <motion.div
              key={key}
              className="inline-flex items-center gap-2 text-text-muted text-[11px] md:text-xs font-body border border-gold/20 px-4 py-2 rounded-full"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.12 }}
            >
              <MapPin size={10} className="text-gold flex-shrink-0" />
              <span>{t(key)}</span>
            </motion.div>
          ))}
        </div>

        {/* Heading */}
        <h2 className="font-display text-3xl md:text-5xl text-text font-normal leading-snug mb-8 max-w-3xl mx-auto">
          {(['origin.heading1', 'origin.heading2'] as const).map((key, i) => (
            <motion.span
              key={key}
              className="block"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{
                duration: 0.9,
                delay: 0.2 + i * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {t(key)}
            </motion.span>
          ))}
        </h2>

        <GoldLine className="w-12 mx-auto mb-8" delay={0.6} />

        {/* Body */}
        <motion.p
          className="text-text-muted text-sm md:text-base leading-relaxed font-body font-light max-w-sm md:max-w-md mx-auto px-4 md:px-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          {t('origin.body')}
        </motion.p>
      </div>
    </section>
  )
}
