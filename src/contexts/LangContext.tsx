import { createContext, useContext, useState, type ReactNode } from 'react'
import en from '../i18n/en.json'
import id from '../i18n/id.json'

type Lang = 'en' | 'id'
type Translations = Record<string, string>

const translations: Record<Lang, Translations> = { en, id }

interface LangContextValue {
  lang: Lang
  toggle: () => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang')
    return saved === 'id' ? 'id' : 'en'
  })

  const toggle = () => {
    const next: Lang = lang === 'en' ? 'id' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const t = (key: string): string => translations[lang][key] ?? key

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
