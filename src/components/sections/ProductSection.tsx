import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import type { Product } from '../../data/products'
import GoldLine from '../ui/GoldLine'
import { useScrollContainer } from '../../contexts/ScrollContext'

interface Props {
  product: Product
}

export default function ProductSection({ product }: Props) {
  const ref = useRef<HTMLElement>(null)
  const container = useScrollContainer()
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ['start end', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])

  const isCenter = product.layout === 'center'
  const isRight = product.layout === 'right'

  return (
    <section
      ref={ref}
      className="relative h-dvh flex items-center overflow-hidden bg-bg"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: isCenter
            ? 'radial-gradient(ellipse 50% 60% at 50% 50%, #C9A84C 0%, transparent 70%)'
            : isRight
            ? 'radial-gradient(ellipse 40% 60% at 72% 50%, #C9A84C 0%, transparent 70%)'
            : 'radial-gradient(ellipse 40% 60% at 28% 50%, #C9A84C 0%, transparent 70%)',
        }}
      />

      <div
        className={`relative z-10 w-full max-w-6xl mx-auto px-8 md:px-16 flex flex-col gap-8 md:gap-12 ${
          isCenter
            ? 'items-center text-center'
            : isRight
            ? 'md:flex-row-reverse md:items-center'
            : 'md:flex-row md:items-center'
        }`}
      >
        {/* Product Image */}
        <motion.div
          className={`flex justify-center ${isCenter ? 'w-full' : 'w-full md:w-1/2'}`}
          style={{ y: imgY }}
          initial={{ opacity: 0, scale: 0.88, x: isRight ? 60 : isCenter ? 0 : -60 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img
            src={product.image}
            alt={product.name}
            className={`object-contain drop-shadow-2xl ${
              isCenter ? 'w-64 md:w-80 xl:w-96' : 'w-64 md:w-80 xl:w-[380px]'
            }`}
          />
        </motion.div>

        {/* Text Content */}
        <div className={isCenter ? 'w-full max-w-lg' : 'w-full md:w-1/2'}>
          <motion.p
            className="text-gold tracking-[0.3em] text-xs uppercase mb-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7 }}
          >
            {product.label}
          </motion.p>

          <motion.h2
            className="font-display text-5xl md:text-6xl xl:text-7xl text-text font-normal italic leading-none mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {product.name}
          </motion.h2>

          <GoldLine className={`w-16 mb-6 ${isCenter ? 'mx-auto' : ''}`} delay={0.3} />

          <motion.p
            className="text-gold-light text-lg md:text-xl font-display font-normal mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {product.tagline}
          </motion.p>

          <motion.p
            className={`text-text-muted text-base leading-relaxed font-light mb-8 ${
              isCenter ? 'max-w-md mx-auto' : 'max-w-md'
            }`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {product.description}
          </motion.p>

          <div className={`flex flex-wrap gap-3 ${isCenter ? 'justify-center' : ''}`}>
            {product.notes.map((note, i) => (
              <motion.span
                key={note}
                className="text-xs tracking-[0.2em] uppercase text-gold border border-gold/30 px-3 py-1.5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
              >
                {note}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
