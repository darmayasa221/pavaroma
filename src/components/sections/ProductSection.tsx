import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { Product } from '../../data/products'
import GoldLine from '../ui/GoldLine'
import { useLang } from '../../contexts/LangContext'

interface Props {
  product: Product
}

const RISE = { opacity: 0, y: 22 }
const SETTLE = { opacity: 1, y: 0 }
// No negative margin: the copy is pinned to the bottom of a full-height section, so a
// shrunken trigger area never reaches the last block and it would stay at opacity 0 forever.
const VIEWPORT = { once: true } as const

export default function ProductSection({ product }: Props) {
  const { t } = useLang()
  const imageRight = product.layout === 'right'
  const name = t(`product.${product.id}.name`)

  return (
    <section className="relative h-dvh overflow-hidden bg-bg" style={{ scrollSnapAlign: 'start' }}>
      {/* Photo panel — full bleed on mobile, 7/12 of the viewport beside the copy on desktop. */}
      <div
        className={`absolute inset-0 overflow-hidden md:inset-y-0 md:w-7/12 ${
          imageRight ? 'md:right-0 md:left-auto' : 'md:left-0 md:right-auto'
        }`}
      >
        <motion.img
          src={product.image}
          alt={name}
          // The source photos are 3:2 landscape with the bag left of centre. In the narrow
          // mobile panel, object-center would frame the beans and background instead of the
          // bag, so pull the focal point left. Desktop's wider panel needs no shift.
          className="absolute inset-0 w-full h-full object-cover object-[20%_center] md:object-center"
          initial={{ opacity: 0, scale: 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Scrims dissolve the photo into the page background so the copy stays legible.
            Desktop fades horizontally toward the text column; mobile fades upward. */}
        <div
          className={`hidden md:block absolute inset-y-0 w-2/3 from-bg to-transparent pointer-events-none ${
            imageRight ? 'left-0 bg-linear-to-r' : 'right-0 bg-linear-to-l'
          }`}
        />
        {/* Full-height on mobile with tuned stops: the copy block can reach ~85% of a short
            viewport, so a bottom-anchored 4/5 scrim leaves the headline over bare photo. */}
        <div className="md:hidden absolute inset-0 bg-linear-to-t from-bg from-28% via-bg/88 via-64% to-transparent pointer-events-none" />
      </div>

      {/* Copy — overlays the bottom of the photo on mobile, sits in its own 5/12 column on desktop. */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 px-8 pb-10 md:inset-y-0 md:w-5/12 md:flex md:flex-col md:justify-center md:px-16 md:pb-0 ${
          imageRight ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'
        }`}
      >
        <motion.p
          className="text-gold tracking-[0.3em] text-[10px] md:text-xs uppercase mb-2 md:mb-3"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.7 }}
        >
          {t(`product.${product.id}.label`)}
        </motion.p>

        <motion.h2
          className="font-display text-4xl md:text-5xl xl:text-6xl text-text font-normal italic leading-[1.05] mb-2 md:mb-3"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {name}
        </motion.h2>

        <motion.p
          className="text-gold/70 tracking-[0.2em] text-[10px] md:text-xs uppercase mb-3 md:mb-4 font-body"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {t(`product.${product.id}.origin`)}
        </motion.p>

        <GoldLine className="w-12 md:w-16 mb-4 md:mb-6" delay={0.3} />

        <motion.p
          className="text-gold-light text-base md:text-xl font-display font-normal mb-3 md:mb-4"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {t(`product.${product.id}.tagline`)}
        </motion.p>

        <motion.p
          className="text-text-muted text-sm md:text-base leading-relaxed font-light mb-4 md:mb-6 max-w-sm line-clamp-3 md:line-clamp-none"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t(`product.${product.id}.description`)}
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-2 md:gap-3"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {Array.from({ length: product.noteCount }, (_, i) => (
            <span
              key={i}
              className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gold border border-gold/30 px-3 py-1.5"
            >
              {t(`product.${product.id}.note.${i}`)}
            </span>
          ))}
        </motion.div>

        {/* Brewing recommendations */}
        <motion.div
          className="mt-4 md:mt-6"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <p className="text-gold/60 text-[10px] tracking-[0.25em] uppercase font-body mb-1.5">
            {t('product.bestFor')}
          </p>
          <p className="text-text-muted/80 text-xs md:text-sm font-body max-w-sm">
            {t(`product.${product.id}.bestFor`)}
          </p>
        </motion.div>

        <motion.div
          className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-gold/20"
          initial={RISE}
          whileInView={SETTLE}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          {/* The ratio is now picked in the order form, so this is just context. */}
          {product.customRatio && (
            <p className="text-text-muted text-xs md:text-sm font-body mb-3 max-w-sm">
              {t('product.blend.customText')}
            </p>
          )}
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center gap-2 border border-gold text-gold px-6 py-3 text-xs tracking-[0.15em] uppercase font-body hover:bg-gold hover:text-bg transition-colors duration-300"
          >
            {t('product.orderCta')}
            <span className="text-base leading-none">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
