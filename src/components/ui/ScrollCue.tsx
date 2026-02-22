import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

export default function ScrollCue() {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gold/60"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ChevronDown size={28} strokeWidth={1.5} />
    </motion.div>
  )
}
