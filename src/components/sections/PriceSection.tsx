import { motion } from 'motion/react'
import { BLEND_PRICES, SINGLE_PRICES, formatPrice } from '../../data/pricing'
import GoldLine from '../ui/GoldLine'
import AmbientLight from '../ui/AmbientLight'
import { useLang } from '../../contexts/LangContext'

// Deliberately no negative viewport margin on the reveal animations below: on a short
// screen the table plus CTA nearly fills the section, and a shrunken trigger area leaves
// the last row stuck at opacity 0 permanently (once: true never re-fires).

/** Shared row so blend ratios and single origins stay visually identical. */
function PriceRow({ label, price, delay }: { label: string; price: number; delay: number }) {
  const { t } = useLang()

  return (
    <motion.li
      className="flex items-baseline justify-between gap-4 border-b border-gold/10 py-2.5"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <span className="text-text-muted text-xs md:text-sm font-body">{label}</span>
      <span className="text-text text-sm md:text-base font-display whitespace-nowrap">
        {formatPrice(price)}
        <span className="text-text-muted/60 text-[10px] md:text-xs font-body">
          {t('price.unit')}
        </span>
      </span>
    </motion.li>
  )
}

function GroupHeading({ children, delay }: { children: string; delay: number }) {
  return (
    <motion.p
      className="text-gold tracking-[0.25em] text-[10px] uppercase font-body mb-1 mt-6 first:mt-0"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.p>
  )
}

export default function PriceSection() {
  const { t } = useLang()

  return (
    <section
      className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-bg px-6 py-16 md:py-12"
      style={{ scrollSnapAlign: 'start' }}
    >
      <AmbientLight
        gradient="radial-gradient(ellipse 70% 60% at 50% 45%, #1f1205 0%, #120c03 50%, transparent 75%)"
        opacity={0.8}
        duration={19}
      />

      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        <motion.p
          className="text-gold tracking-[0.35em] text-xs uppercase mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {t('price.eyebrow')}
        </motion.p>

        <motion.h2
          className="font-display text-3xl md:text-4xl text-text font-normal italic leading-snug mb-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {t('price.heading')}
        </motion.h2>

        <GoldLine className="w-12 mx-auto mb-7" delay={0.25} />

        <div className="text-left">
          <GroupHeading delay={0.3}>{t('price.group.blend')}</GroupHeading>
          <ul>
            {BLEND_PRICES.map((row, i) => (
              <PriceRow
                key={`${row.arabica}-${row.robusta}`}
                label={`Arabica ${row.arabica}% · Robusta ${row.robusta}%`}
                price={row.price}
                delay={0.35 + i * 0.07}
              />
            ))}
          </ul>

          <GroupHeading delay={0.7}>{t('price.group.single')}</GroupHeading>
          <ul>
            {SINGLE_PRICES.map((row, i) => (
              <PriceRow
                key={row.id}
                label={t(`product.${row.id}.name`)}
                price={row.price}
                delay={0.75 + i * 0.07}
              />
            ))}
          </ul>
        </div>

        {/* Tanpa CTA WhatsApp: pemesanan kini lewat form di halaman produk, dan
            tombol chat manual di sini justru menariknya keluar dari alur itu. */}
        <motion.p
          className="text-text-muted/60 text-[10px] md:text-xs tracking-[0.15em] uppercase font-body mt-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {t('price.note')}
        </motion.p>
      </div>
    </section>
  )
}
