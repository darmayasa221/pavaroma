import { supabase } from './supabase'

export interface Review {
  id: string
  author_name: string
  rating: number
  comment: string | null
  created_at: string
}

export interface RatingSummary {
  average: number
  count: number
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, rating, comment, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data ?? []
}

export async function fetchRatingSummary(productId: string): Promise<RatingSummary | null> {
  const { data, error } = await supabase
    .from('product_rating_summary')
    .select('average_rating, review_count')
    .eq('product_id', productId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { average: Number(data.average_rating), count: Number(data.review_count) }
}

export interface ReviewDraft {
  productId: string
  authorName: string
  rating: number
  comment: string
  /** Hidden field — bots fill every input they find, humans never see this one. */
  honeypot: string
}

export class ReviewError extends Error {
  readonly key: string

  constructor(message: string, key: string) {
    super(message)
    this.name = 'ReviewError'
    this.key = key
  }
}

export async function submitReview(draft: ReviewDraft): Promise<void> {
  // Silently succeed for bots so they get no signal to retry differently.
  if (draft.honeypot.trim() !== '') return

  if (draft.rating < 1 || draft.rating > 5) {
    throw new ReviewError('Rating out of range', 'review.error.rating')
  }

  const { error } = await supabase.from('reviews').insert({
    product_id: draft.productId,
    author_name: draft.authorName.trim(),
    rating: draft.rating,
    comment: draft.comment.trim() || null,
  })

  // The throttle trigger raises a plain exception; surface it as "too fast"
  // rather than a generic failure so the visitor knows to simply wait.
  if (error) {
    const throttled = error.message.includes('Terlalu banyak')
    throw new ReviewError(error.message, throttled ? 'review.error.throttled' : 'review.error.submit')
  }
}
