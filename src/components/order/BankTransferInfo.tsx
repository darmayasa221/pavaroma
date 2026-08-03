import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { BANK_ACCOUNT, formatAccountNumber } from '../../data/bank'
import { useLang } from '../../contexts/LangContext'

/**
 * `navigator.clipboard` butuh secure context (https / localhost). Kalau tidak
 * tersedia — sebagian browser dalam WebView, atau http biasa — dipakai cara
 * lama yang sudah usang tapi masih jalan di mana-mana.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // jatuh ke cara di bawah
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export default function BankTransferInfo() {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2200)
    return () => clearTimeout(id)
  }, [copied])

  async function handleCopy() {
    const ok = await copyToClipboard(BANK_ACCOUNT.number)
    setCopied(ok)
    setFailed(!ok)
  }

  return (
    <div className="border border-gold/25 px-5 py-4">
      <p className="text-gold/70 text-[10px] tracking-[0.25em] uppercase font-body mb-3">
        {t('bank.title')}
      </p>

      <p className="text-text text-sm font-body mb-0.5">
        {BANK_ACCOUNT.bank} · <span className="text-text-muted">{t('bank.holder')}</span>{' '}
        {BANK_ACCOUNT.holder}
      </p>

      <div className="flex items-center justify-between gap-3 mt-2">
        {/* tabular-nums supaya digitnya sejajar dan mudah dicocokkan */}
        <span className="text-gold-light text-lg md:text-xl font-body tracking-wider tabular-nums select-all">
          {formatAccountNumber(BANK_ACCOUNT.number)}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className="shrink-0 inline-flex items-center gap-1.5 border border-gold/40 text-gold px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-body hover:bg-gold hover:text-bg transition-colors duration-200"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t('bank.copied') : t('bank.copy')}
        </button>
      </div>

      {failed && (
        <p className="text-text-muted/60 text-[10px] font-body mt-2">{t('bank.copyFailed')}</p>
      )}
      <p className="text-text-muted/50 text-[10px] font-body mt-3 leading-relaxed">
        {t('bank.hint')}
      </p>
    </div>
  )
}
