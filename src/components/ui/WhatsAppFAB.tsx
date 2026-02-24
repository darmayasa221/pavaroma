import { motion } from 'motion/react'
import { WHATSAPP_NUMBER } from '../../data/products'
import { useLang } from '../../contexts/LangContext'

export default function WhatsAppFAB() {
  const { t } = useLang()
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsapp.message'))}`

  return (
    /* Outer fixed anchor — never animates, just positions */
    <div className="fixed bottom-6 right-6 z-50">

      {/* Entry wrapper — fades + scales in after hero loads */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.8, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Relative container so pulse rings anchor to button bounds */}
        <div className="relative">

          {/* Pulse ring 1 */}
          <motion.span
            className="absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"
            animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 3.4 }}
          />

          {/* Pulse ring 2 — offset by half cycle */}
          <motion.span
            className="absolute inset-0 rounded-full bg-[#25D366] pointer-events-none"
            animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 4.5 }}
          />

          {/* Button — idle float + hover/tap */}
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-2.5 bg-[#25D366] text-white rounded-full shadow-lg shadow-black/40 px-4 py-3 md:px-5 md:py-3.5"
            animate={{ y: [0, -5, 0] }}
            transition={{
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 4 },
            }}
            whileHover={{
              scale: 1.08,
              y: -6,
              boxShadow: '0 8px 32px rgba(37,211,102,0.5)',
            }}
            whileTap={{ scale: 0.93 }}
          >
            {/* Icon — spring wiggle on hover */}
            <motion.svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 flex-shrink-0"
              aria-hidden="true"
              whileHover={{ rotate: [0, -18, 18, -10, 10, 0] }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </motion.svg>

            {/* Label — desktop only */}
            <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">
              {t('whatsapp.label')}
            </span>
          </motion.a>
        </div>
      </motion.div>
    </div>
  )
}
