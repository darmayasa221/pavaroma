import { useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { products } from '../data/products'
import { BLEND_PRICES, formatPrice, resolveUnitPrice, DEFAULT_BLEND_VARIANT } from '../data/pricing'
import OrderForm from '../components/order/OrderForm'
import Reviews from '../components/reviews/Reviews'
import GoldLine from '../components/ui/GoldLine'
import { useLang } from '../contexts/LangContext'

export default function ProductDetail() {
  const { productId } = useParams()
  const { t } = useLang()
  const product = products.find((p) => p.id === productId)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [productId])

  if (!product) return <Navigate to="/" replace />

  const isBlend = product.id === 'blend'
  const basePrice = resolveUnitPrice(product.id, isBlend ? DEFAULT_BLEND_VARIANT : undefined) ?? 0
  const cheapestBlend = Math.min(...BLEND_PRICES.map((r) => r.price))
  const name = t(`product.${product.id}.name`)

  return (
    <main className="min-h-dvh bg-bg pb-24">
      {/* Photo banner — same full-bleed treatment as the landing page, shorter. */}
      <div className="relative h-[45dvh] md:h-[55dvh] overflow-hidden">
        <motion.img
          src={product.image}
          alt={name}
          // A wide, short banner crops hard vertically; bias upward so the frame
          // lands on the bag and beans rather than the middle of the pouch.
          className="absolute inset-0 w-full h-full object-cover object-[20%_38%] md:object-[center_40%]"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-bg from-8% via-bg/70 via-55% to-bg/40 pointer-events-none" />

        <Link
          to="/"
          className="absolute top-5 left-5 z-10 inline-flex items-center gap-2 text-text-muted hover:text-gold text-xs tracking-[0.18em] uppercase font-body transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          {t('nav.back')}
        </Link>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8 -mt-20">
        <motion.p
          className="text-gold tracking-[0.3em] text-[10px] md:text-xs uppercase mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {t(`product.${product.id}.label`)}
        </motion.p>

        <motion.h1
          className="font-display text-4xl md:text-5xl text-text font-normal italic leading-[1.05] mb-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {name}
        </motion.h1>

        <p className="text-gold/70 tracking-[0.2em] text-[10px] md:text-xs uppercase mb-5 font-body">
          {t(`product.${product.id}.origin`)}
        </p>

        <GoldLine className="w-16 mb-6" delay={0.35} />

        <p className="text-gold-light text-lg md:text-xl font-display mb-4">
          {t(`product.${product.id}.tagline`)}
        </p>

        <p className="text-text-muted text-sm md:text-base leading-relaxed font-light mb-7">
          {t(`product.${product.id}.description`)}
        </p>

        <div className="flex flex-wrap gap-2 md:gap-3 mb-7">
          {Array.from({ length: product.noteCount }, (_, i) => (
            <span
              key={i}
              className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gold border border-gold/30 px-3 py-1.5"
            >
              {t(`product.${product.id}.note.${i}`)}
            </span>
          ))}
        </div>

        <div className="mb-8">
          <p className="text-gold/60 text-[10px] tracking-[0.25em] uppercase font-body mb-1.5">
            {t('product.bestFor')}
          </p>
          <p className="text-text-muted/80 text-xs md:text-sm font-body">
            {t(`product.${product.id}.bestFor`)}
          </p>
        </div>

        <div className="flex items-baseline gap-2 border-t border-gold/20 pt-6 mb-10">
          <span className="text-gold/70 text-[10px] tracking-[0.25em] uppercase font-body">
            {isBlend ? t('product.priceFrom') : t('product.price')}
          </span>
          <span className="text-text font-display text-2xl ml-auto">
            {formatPrice(isBlend ? cheapestBlend : basePrice)}
            <span className="text-text-muted/60 text-xs font-body">{t('price.unit')}</span>
          </span>
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-text italic mb-2">
          {t('order.title')}
        </h2>
        <GoldLine className="w-12 mb-8" />
        <OrderForm product={product} />

        <Reviews productId={product.id} />
      </div>
    </main>
  )
}
