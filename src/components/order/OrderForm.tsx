import { useMemo, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Check, Loader2, Upload, X } from 'lucide-react'
import type { Product } from '../../data/products'
import {
  BLEND_PRICES,
  blendVariant,
  DEFAULT_BLEND_VARIANT,
  deliveryDateBounds,
  formatPrice,
  MIN_DELIVERY_DAYS,
  resolveUnitPrice,
} from '../../data/pricing'
import { submitOrder, OrderError, MAX_PROOF_BYTES, ACCEPTED_PROOF_TYPES } from '../../lib/orders'
import BankTransferInfo from './BankTransferInfo'
import { isSupabaseConfigured } from '../../lib/supabase'
import { useLang } from '../../contexts/LangContext'
import GoldLine from '../ui/GoldLine'

const field =
  'w-full bg-transparent border border-gold/25 px-4 py-3 text-text text-sm font-body ' +
  'placeholder:text-text-muted/40 focus:outline-none focus:border-gold transition-colors duration-200'

const labelCls = 'block text-gold/70 text-[10px] tracking-[0.25em] uppercase font-body mb-2'

interface Props {
  product: Product
}

export default function OrderForm({ product }: Props) {
  const { t } = useLang()

  const isBlend = product.id === 'blend'
  const [variant, setVariant] = useState(isBlend ? DEFAULT_BLEND_VARIANT : undefined)
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  // Dihitung sekali per mount: kalau dihitung ulang tiap render, batasnya bisa
  // bergeser di tengah pengisian saat tengah malam terlewati.
  const dateBounds = useMemo(() => deliveryDateBounds(), [])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [hasPaid, setHasPaid] = useState<boolean | null>(null)
  const [proof, setProof] = useState<File | null>(null)

  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [doneRef, setDoneRef] = useState<string | null>(null)

  const unitPrice = resolveUnitPrice(product.id, variant) ?? 0
  const total = Math.round(unitPrice * quantity)

  // "Sudah bayar" must be answered, and answering yes means the proof is required —
  // an order marked paid with no evidence is worse than one marked unpaid.
  const complete =
    name.trim().length >= 2 &&
    phone.replace(/\D/g, '').length >= 8 &&
    address.trim().length >= 10 &&
    quantity > 0 &&
    // Tanggal harus dipilih DAN tidak lebih cepat dari batas. Atribut `min`
    // pada input date hanya membatasi date-picker; nilai yang diketik manual
    // tetap lolos, jadi harus dicek di sini juga.
    deliveryDate >= dateBounds.min &&
    deliveryDate <= dateBounds.max &&
    hasPaid !== null &&
    (!hasPaid || proof !== null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!complete || busy) return

    setBusy(true)
    setErrorKey(null)
    try {
      const result = await submitOrder({
        productId: product.id,
        variant,
        quantityKg: quantity,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        deliveryDate,
        hasPaid: hasPaid!,
        proofFile: proof,
      })
      setDoneRef(result.ref)
    } catch (err) {
      setErrorKey(err instanceof OrderError ? err.key : 'order.error.submit')
    } finally {
      setBusy(false)
    }
  }

  function pickProof(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_PROOF_BYTES) return setErrorKey('order.error.fileTooLarge')
    if (!ACCEPTED_PROOF_TYPES.includes(file.type)) return setErrorKey('order.error.fileType')
    setErrorKey(null)
    setProof(file)
  }

  if (doneRef) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="border border-gold/30 px-6 py-10 text-center">
          <Check size={32} className="text-gold mx-auto mb-4" />
          <p className="font-display text-2xl text-text italic mb-2">{t('order.successTitle')}</p>
          <p className="text-text-muted text-sm font-body mb-4">{t('order.successBody')}</p>
          <p className="text-gold tracking-[0.3em] text-lg font-display">#{doneRef}</p>
        </div>

        {/* Yang belum bayar masih butuh nomor rekeningnya di layar ini —
            kalau tidak, mereka harus kembali ke form yang sudah hilang. */}
        {!hasPaid && <BankTransferInfo />}
      </motion.div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="border border-gold/20 px-6 py-8 text-center">
        <p className="text-text-muted text-sm font-body">{t('order.unavailable')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {isBlend && (
        <div>
          <label htmlFor="variant" className={labelCls}>
            {t('order.ratio')}
          </label>
          {/* `appearance-none` membuang panah bawaan browser, sehingga select
              terlihat seperti input biasa. Penanda ini yang memberi tahu
              pengunjung bahwa isinya bisa dipilih. */}
          <div className="relative">
            <select
              id="variant"
              className={`${field} appearance-none pr-12 cursor-pointer`}
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              {BLEND_PRICES.map((row) => (
                <option key={blendVariant(row)} value={blendVariant(row)} className="bg-surface">
                  Arabica {row.arabica}% · Robusta {row.robusta}% — {formatPrice(row.price)}/kg
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-[3px]"
            >
              <span className="w-1 h-1 rounded-full bg-gold" />
              <span className="w-1 h-1 rounded-full bg-gold" />
              <span className="w-1 h-1 rounded-full bg-gold" />
            </span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="qty" className={labelCls}>
          {t('order.quantity')}
        </label>
        <input
          id="qty"
          type="number"
          inputMode="decimal"
          min={0.5}
          max={500}
          step={0.5}
          className={field}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      <div>
        <label htmlFor="name" className={labelCls}>
          {t('order.name')}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className={field}
          placeholder={t('order.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelCls}>
          {t('order.phone')}
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={field}
          placeholder={t('order.phonePlaceholder')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="address" className={labelCls}>
          {t('order.address')}
        </label>
        <textarea
          id="address"
          rows={3}
          autoComplete="street-address"
          className={`${field} resize-none`}
          placeholder={t('order.addressPlaceholder')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="delivery" className={labelCls}>
          {t('order.deliveryDate')}
        </label>
        <input
          id="delivery"
          type="date"
          className={`${field} cursor-pointer [color-scheme:dark]`}
          min={dateBounds.min}
          max={dateBounds.max}
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
        <p className="text-text-muted/50 text-[10px] font-body mt-2">
          {t('order.deliveryHint').replace('{n}', String(MIN_DELIVERY_DAYS))}
        </p>
      </div>

      {/* Ditaruh SEBELUM pertanyaan "sudah bayar" — pelanggan butuh nomor
          rekeningnya untuk membayar, bukan setelah menyatakan sudah. */}
      <BankTransferInfo />

      <div>
        <span className={labelCls}>{t('order.paidQuestion')}</span>
        <div className="flex gap-3">
          {([true, false] as const).map((choice) => (
            <button
              key={String(choice)}
              type="button"
              aria-pressed={hasPaid === choice}
              onClick={() => {
                setHasPaid(choice)
                if (!choice) setProof(null)
              }}
              className={`flex-1 border px-4 py-3 text-xs tracking-[0.15em] uppercase font-body transition-colors duration-200 ${
                hasPaid === choice
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-gold/25 text-text-muted hover:border-gold/50'
              }`}
            >
              {choice ? t('order.paidYes') : t('order.paidNo')}
            </button>
          ))}
        </div>
      </div>

      {/* Upload only appears once "sudah bayar" is answered yes. */}
      {hasPaid === true && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
          <span className={labelCls}>{t('order.proof')}</span>
          {proof ? (
            <div className="flex items-center justify-between gap-3 border border-gold/30 px-4 py-3">
              <span className="text-text text-xs font-body truncate">{proof.name}</span>
              <button
                type="button"
                onClick={() => setProof(null)}
                aria-label={t('order.proofRemove')}
                className="text-text-muted hover:text-gold transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed border-gold/30 px-4 py-6 cursor-pointer hover:border-gold/60 transition-colors">
              <Upload size={16} className="text-gold" />
              <span className="text-text-muted text-xs font-body">{t('order.proofPick')}</span>
              <input
                type="file"
                accept={ACCEPTED_PROOF_TYPES.join(',')}
                className="sr-only"
                onChange={(e) => pickProof(e.target.files?.[0])}
              />
            </label>
          )}
          <p className="text-text-muted/50 text-[10px] font-body mt-2">{t('order.proofHint')}</p>
        </motion.div>
      )}

      <div className="flex items-baseline justify-between border-t border-gold/20 pt-5">
        <span className="text-gold/70 text-[10px] tracking-[0.25em] uppercase font-body">
          {t('order.total')}
        </span>
        <span className="text-text font-display text-xl">{formatPrice(total)}</span>
      </div>

      {errorKey && (
        <p role="alert" className="text-red-400 text-xs font-body">
          {t(errorKey)}
        </p>
      )}

      <button
        type="submit"
        disabled={!complete || busy}
        className="w-full inline-flex items-center justify-center gap-2.5 bg-gold text-bg px-8 py-4 text-xs tracking-[0.15em] uppercase font-body font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        {busy && <Loader2 size={15} className="animate-spin" />}
        {busy ? t('order.submitting') : t('order.submit')}
      </button>

      <GoldLine className="w-10 mx-auto" delay={0} />
      <p className="text-text-muted/50 text-[10px] font-body text-center leading-relaxed">
        {t('order.privacy')}
      </p>
    </form>
  )
}
