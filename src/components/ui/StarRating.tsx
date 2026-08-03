import { Star } from 'lucide-react'

interface Props {
  value: number
  /** Renders radio-style buttons instead of static stars. */
  onChange?: (value: number) => void
  size?: number
  label?: string
}

export default function StarRating({ value, onChange, size = 16, label }: Props) {
  const stars = [1, 2, 3, 4, 5]

  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
        {stars.map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(value) ? 'text-gold' : 'text-gold/20'}
            fill={n <= Math.round(value) ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        ))}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label={label}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          className="p-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm"
        >
          <Star
            size={size}
            className={n <= value ? 'text-gold' : 'text-gold/25 hover:text-gold/50'}
            fill={n <= value ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </span>
  )
}
