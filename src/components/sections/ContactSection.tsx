import { motion } from 'motion/react'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from '../../data/products'
import GoldLine from '../ui/GoldLine'

export default function ContactSection() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <section
      className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-bg px-6"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, #C9A84C 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 text-center max-w-xl mx-auto">
        <motion.p
          className="text-gold tracking-[0.3em] text-xs uppercase mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Get in Touch
        </motion.p>

        <motion.h2
          className="font-display text-4xl md:text-6xl text-text font-normal leading-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Let's Talk Coffee.
        </motion.h2>

        <GoldLine className="w-12 mx-auto mb-8" delay={0.3} />

        <motion.p
          className="text-text-muted text-base md:text-lg leading-relaxed font-light mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Whether you're a café, a roaster, or simply someone who loves great
          coffee — we'd love to hear from you.
        </motion.p>

        <motion.a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-gold text-bg px-8 py-4 text-sm tracking-[0.15em] uppercase font-body font-medium"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{
            boxShadow: '0 0 40px rgba(201,168,76,0.4)',
            y: -2,
          }}
          whileTap={{ scale: 0.97 }}
        >
          <MessageCircle size={18} />
          Chat on WhatsApp
        </motion.a>

        <motion.p
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-muted/40 text-xs tracking-widest uppercase whitespace-nowrap"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
        >
          © 2026 Pavaroma · Awaken the True Aroma
        </motion.p>
      </div>
    </section>
  )
}
