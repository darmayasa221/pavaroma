import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import {
  fetchReviews,
  fetchRatingSummary,
  submitReview,
  ReviewError,
  type Review,
  type RatingSummary,
} from '../../lib/reviews'
import { isSupabaseConfigured } from '../../lib/supabase'
import { useLang } from '../../contexts/LangContext'
import StarRating from '../ui/StarRating'
import GoldLine from '../ui/GoldLine'

const field =
  'w-full bg-transparent border border-gold/25 px-4 py-3 text-text text-sm font-body ' +
  'placeholder:text-text-muted/40 focus:outline-none focus:border-gold transition-colors duration-200'

const labelCls = 'block text-gold/70 text-[10px] tracking-[0.25em] uppercase font-body mb-2'

/** Jeda antar ulasan saat berotasi otomatis. */
const ROTATE_MS = 5500

interface Props {
  productId: string
}

export default function Reviews({ productId }: Props) {
  const { t, lang } = useLang()
  const reducedMotion = useReducedMotion()

  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [author, setAuthor] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [thanks, setThanks] = useState(false)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return setLoading(false)
    try {
      const [list, sum] = await Promise.all([fetchReviews(productId), fetchRatingSummary(productId)])
      setReviews(list)
      setSummary(sum)
      setIndex(0)
    } catch {
      // A failed read shouldn't break the page — the product still sells.
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  // Rotasi otomatis. Berhenti saat: hanya ada 1 ulasan, daftar sedang dibuka
  // penuh, pengunjung sedang menunjuk/fokus ke sana, atau sistem operasinya
  // minta animasi dikurangi.
  useEffect(() => {
    if (reducedMotion || paused || expanded || reviews.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % reviews.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, paused, expanded, reviews.length])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (author.trim().length < 2 || busy) return

    setBusy(true)
    setErrorKey(null)
    try {
      await submitReview({ productId, authorName: author, rating, comment, honeypot })
      setAuthor('')
      setComment('')
      setRating(5)
      setThanks(true)
      await load()
    } catch (err) {
      setErrorKey(err instanceof ReviewError ? err.key : 'review.error.submit')
    } finally {
      setBusy(false)
    }
  }

  const dateFmt = new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const ReviewBody = ({ r }: { r: Review }) => (
    <>
      <div className="flex items-center gap-3 mb-1.5">
        <StarRating value={r.rating} size={13} label={`${r.rating} / 5`} />
        <span className="text-text text-sm font-body">{r.author_name}</span>
        <span className="text-text-muted/50 text-[10px] font-body ml-auto shrink-0">
          {dateFmt.format(new Date(r.created_at))}
        </span>
      </div>
      {r.comment && (
        <p className="text-text-muted text-sm font-body leading-relaxed">{r.comment}</p>
      )}
    </>
  )

  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h2 className="font-display text-2xl md:text-3xl text-text italic">{t('review.title')}</h2>
        {summary && summary.count > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <StarRating value={summary.average} label={`${summary.average} / 5`} />
            <span className="text-text-muted text-xs font-body">
              {summary.average.toFixed(1)} · {summary.count}
            </span>
          </div>
        )}
      </div>
      <GoldLine className="w-12 mb-8" />

      {loading ? (
        <Loader2 size={18} className="animate-spin text-gold/60" />
      ) : reviews.length === 0 ? (
        <p className="text-text-muted text-sm font-body mb-10">{t('review.empty')}</p>
      ) : expanded ? (
        <>
          <ul className="space-y-6 mb-6">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-gold/10 pb-5">
                <ReviewBody r={r} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-gold text-xs tracking-[0.18em] uppercase font-body hover:text-gold-light transition-colors mb-12"
          >
            {t('review.showLess')}
          </button>
        </>
      ) : (
        <div
          className="mb-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Tinggi dikunci supaya halaman tidak melompat tiap ganti ulasan. */}
          <div className="relative min-h-[120px] border-b border-gold/10 pb-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={reviews[index]?.id ?? index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {reviews[index] && <ReviewBody r={reviews[index]} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {reviews.length > 1 && (
            <div className="flex items-center gap-4 mt-5">
              {/* Titik navigasi hanya sampai 10; lebih dari itu jadi penghitung. */}
              {reviews.length <= 10 ? (
                <div className="flex gap-2" role="tablist" aria-label={t('review.title')}>
                  {reviews.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`${i + 1} / ${reviews.length}`}
                      onClick={() => setIndex(i)}
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background: i === index ? '#C9A84C' : 'rgba(201,168,76,0.25)',
                        transform: i === index ? 'scale(1.5)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-text-muted/60 text-[10px] tracking-[0.2em] font-body tabular-nums">
                  {index + 1} / {reviews.length}
                </span>
              )}

              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="ml-auto text-gold text-[10px] md:text-xs tracking-[0.18em] uppercase font-body hover:text-gold-light transition-colors"
              >
                {t('review.showAll')} ({reviews.length})
              </button>
            </div>
          )}
        </div>
      )}

      {!isSupabaseConfigured ? null : thanks ? (
        <p className="text-gold text-sm font-body">{t('review.thanks')}</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5 border-t border-gold/20 pt-8">
          <p className="font-display text-lg text-text italic">{t('review.writeTitle')}</p>

          <div>
            <span className={labelCls}>{t('review.rating')}</span>
            <StarRating value={rating} onChange={setRating} size={22} label={t('review.rating')} />
          </div>

          <div>
            <label htmlFor="review-name" className={labelCls}>
              {t('review.name')}
            </label>
            <input
              id="review-name"
              type="text"
              className={field}
              placeholder={t('order.namePlaceholder')}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="review-comment" className={labelCls}>
              {t('review.comment')}
            </label>
            <textarea
              id="review-comment"
              rows={3}
              maxLength={600}
              className={`${field} resize-none`}
              placeholder={t('review.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Honeypot — hidden from people, irresistible to bots. Never remove. */}
          <div aria-hidden="true" className="absolute left-[-9999px] w-px h-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {errorKey && (
            <p role="alert" className="text-red-400 text-xs font-body">
              {t(errorKey)}
            </p>
          )}

          <button
            type="submit"
            disabled={author.trim().length < 2 || busy}
            className="inline-flex items-center gap-2 border border-gold text-gold px-6 py-3 text-xs tracking-[0.15em] uppercase font-body disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-bg transition-colors duration-200"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {t('review.submit')}
          </button>
        </form>
      )}
    </section>
  )
}
