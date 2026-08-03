import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL

// Supabase menamai ulang anon key menjadi "publishable key" (sb_publishable_…).
// Nama lama tetap diterima supaya key lama tidak mendadak berhenti bekerja.
// Kunci ini MEMANG boleh terlihat publik — pengamannya adalah RLS, bukan kerahasiaan.
// Yang tidak boleh ada di sini: sb_secret_… / service_role.
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

if (import.meta.env.DEV && /^sb_secret_|service_role/.test(publishableKey ?? '')) {
  throw new Error(
    '[pavaroma] Secret key terdeteksi di env frontend. Kunci itu akan ter-bundle ke ' +
      'browser dan menembus seluruh RLS. Gunakan sb_publishable_… saja.',
  )
}

/**
 * False when the env vars are missing — the landing page still renders fine,
 * only the order form and reviews degrade to a clear message instead of
 * throwing on load.
 */
export const isSupabaseConfigured = Boolean(url && publishableKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[pavaroma] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY belum diisi — ' +
      'form order dan review dinonaktifkan. Lihat .env.example',
  )
}

export const supabase = createClient(url ?? 'http://localhost', publishableKey ?? 'anon', {
  auth: { persistSession: false },
})
