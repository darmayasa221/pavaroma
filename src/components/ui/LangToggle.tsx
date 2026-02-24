import { useLang } from '../../contexts/LangContext'

export default function LangToggle() {
  const { lang, toggle } = useLang()

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${lang === 'en' ? 'Indonesian' : 'English'}`}
      className="fixed top-4 right-6 z-50 flex items-center gap-1.5 text-xs tracking-[0.18em] uppercase font-body select-none"
    >
      <span style={{ color: lang === 'id' ? '#C9A84C' : 'rgba(245,240,232,0.35)' }}>
        ID
      </span>
      <span style={{ color: 'rgba(245,240,232,0.2)' }}>·</span>
      <span style={{ color: lang === 'en' ? '#C9A84C' : 'rgba(245,240,232,0.35)' }}>
        EN
      </span>
    </button>
  )
}
