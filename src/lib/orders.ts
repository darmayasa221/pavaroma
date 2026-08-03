import { supabase } from './supabase'

export interface OrderDraft {
  productId: string
  /** Blend ratio like "75:25". Undefined for single origins. */
  variant?: string
  quantityKg: number
  customerName: string
  customerPhone: string
  customerAddress: string
  hasPaid: boolean
  proofFile?: File | null
}

export interface OrderResult {
  ref: string
  totalPrice: number
}

export const MAX_PROOF_BYTES = 5 * 1024 * 1024
export const ACCEPTED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

/** 08xx / +62 8xx / 62-8xx → 628xx. Keeps digits only so wa.me links work. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export class OrderError extends Error {
  /** i18n key so the form can show a translated message. */
  readonly key: string

  constructor(message: string, key: string) {
    super(message)
    this.name = 'OrderError'
    this.key = key
  }
}

function randomRef(): string {
  // Crockford-ish alphabet: no 0/O/1/I, so refs stay readable over the phone.
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/**
 * Uploads the payment proof (when present) then hands the order to the
 * `submit-order` Edge Function, which re-derives the price, writes the row with
 * the service role, and notifies the owner. The browser never writes to
 * `orders` directly — anon has no policy on that table.
 */
export async function submitOrder(draft: OrderDraft): Promise<OrderResult> {
  const ref = randomRef()
  let proofPath: string | undefined

  if (draft.hasPaid && draft.proofFile) {
    const file = draft.proofFile
    if (file.size > MAX_PROOF_BYTES) throw new OrderError('Proof too large', 'order.error.fileTooLarge')
    if (!ACCEPTED_PROOF_TYPES.includes(file.type)) {
      throw new OrderError('Unsupported file type', 'order.error.fileType')
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg'
    proofPath = `${ref}/proof.${ext}`

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(proofPath, file, { contentType: file.type, upsert: false })

    if (error) throw new OrderError(error.message, 'order.error.upload')
  }

  const { data, error } = await supabase.functions.invoke<OrderResult & { error?: string }>(
    'submit-order',
    {
      body: {
        ref,
        productId: draft.productId,
        variant: draft.variant ?? null,
        quantityKg: draft.quantityKg,
        customerName: draft.customerName.trim(),
        customerPhone: normalisePhone(draft.customerPhone),
        customerAddress: draft.customerAddress.trim(),
        hasPaid: draft.hasPaid,
        proofPath: proofPath ?? null,
      },
    },
  )

  if (error) throw new OrderError(error.message, 'order.error.submit')
  if (!data || data.error) throw new OrderError(data?.error ?? 'Unknown', 'order.error.submit')

  return { ref: data.ref, totalPrice: data.totalPrice }
}
