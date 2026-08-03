// Supabase Edge Function — menerima order dari form, menyimpannya dengan
// service role, lalu mengirim notifikasi ke owner.
//
// Deploy:  supabase functions deploy submit-order
// Secrets: supabase secrets set NOTIFY_PROVIDER=callmebot CALLMEBOT_PHONE=... CALLMEBOT_APIKEY=...
//
// Kenapa lewat function, bukan insert langsung dari browser: tabel `orders`
// sengaja tidak punya policy anon sama sekali. Kalau browser boleh insert, ia
// juga bisa mengirim harga karangan sendiri, dan anon key yang terlihat publik
// jadi satu-satunya penjaga data pelanggan.

import { createClient } from 'jsr:@supabase/supabase-js@2'

// ── Harga: sengaja diduplikasi dari src/data/pricing.ts ──────────────────
// Angka yang dikirim browser tidak pernah dipercaya. Kalau harga berubah,
// ubah di KEDUA tempat.
const BLEND_PRICES: Record<string, number> = {
  '75:25': 230_000,
  '70:30': 225_000,
  '65:35': 220_000,
  '60:40': 215_000,
  '50:50': 205_000,
}
const SINGLE_PRICES: Record<string, number> = {
  arabica: 280_000,
  robusta: 150_000,
}
const PRODUCT_NAMES: Record<string, string> = {
  arabica: 'Arabica Kintamani',
  robusta: 'Fine Robusta Pupuan',
  blend: 'House Blend Premium',
}

function resolveUnitPrice(productId: string, variant: string | null): number | null {
  if (productId === 'blend') return variant ? BLEND_PRICES[variant] ?? null : null
  return SINGLE_PRICES[productId] ?? null
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const MIN_DELIVERY_DAYS = 3
const MAX_DELIVERY_DAYS = 90

/** `YYYY-MM-DD` (UTC) hasil geser n hari dari sekarang. */
function utcDatePlus(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "2026-08-08" → "Sab, 8 Agu 2026" untuk ditampilkan di notifikasi. */
function formatTanggal(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${iso}T00:00:00Z`))
  } catch {
    return iso
  }
}

/**
 * 08xx → 628xx. Browser sudah melakukan ini, tapi diulang di sini supaya link
 * `wa.me` di notifikasi tetap benar walau request datang bukan dari form kita.
 */
function normalisePhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('62')) return d
  if (d.startsWith('0')) return `62${d.slice(1)}`
  if (d.startsWith('8')) return `62${d}`
  return d
}

// ── Notifikasi ───────────────────────────────────────────────────────────

interface OrderNotice {
  ref: string
  productName: string
  variant: string | null
  quantityKg: number
  unitPrice: number
  totalPrice: number
  customerName: string
  customerPhone: string
  customerAddress: string
  deliveryDate: string
  hasPaid: boolean
  proofUrl: string | null
}

/** Nama dan alamat diketik pelanggan — tanpa ini, satu tanda `<` merusak pesan. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Error jaringan dari fetch memuat URL lengkap — termasuk token bot Telegram
 * dan apikey CallMeBot. Pesan itu disimpan ke kolom notify_status, jadi harus
 * disensor dulu supaya kredensial tidak ikut mengendap di tabel order.
 */
const redact = (s: string) =>
  s
    .replace(/bot\d{6,}:[A-Za-z0-9_-]{20,}/g, 'bot***')
    .replace(/apikey=[^&\s]+/gi, 'apikey=***')
    .replace(/access_token=[^&\s]+/gi, 'access_token=***')

/** Versi teks polos untuk provider yang tidak mengerti format. */
function plainText(o: OrderNotice): string {
  return [
    `🛒 Order baru #${o.ref}`,
    '',
    `${o.productName}${o.variant ? ` (${o.variant})` : ''}`,
    `${o.quantityKg} kg × ${rupiah(o.unitPrice)} = ${rupiah(o.totalPrice)}`,
    o.hasPaid ? '✅ Sudah bayar' : '⚠️ BELUM bayar',
    `🚚 Kirim: ${formatTanggal(o.deliveryDate)}`,
    '',
    `Nama   : ${o.customerName}`,
    `WA     : ${o.customerPhone}`,
    `Alamat : ${o.customerAddress}`,
    o.proofUrl ? `Bukti  : ${o.proofUrl}` : '',
    '',
    `Balas: https://wa.me/${o.customerPhone}`,
  ].filter(Boolean).join('\n')
}

/**
 * Blok siap-salin untuk ditempel ke aplikasi kurir / nota. Satu ketukan pada
 * blok <pre> menyalin semuanya sekaligus, jadi tidak perlu salin per baris.
 */
function copyBlock(o: OrderNotice): string {
  return [
    `Nama    : ${o.customerName}`,
    `No HP   : ${o.customerPhone}`,
    `Alamat  : ${o.customerAddress}`,
    `Produk  : ${o.productName}${o.variant ? ` · ${o.variant}` : ''} · ${o.quantityKg} kg`,
    `Kirim   : ${formatTanggal(o.deliveryDate)}`,
  ].join('\n')
}

/**
 * Telegram merender `<pre>` sebagai blok monospace yang bisa disalin sekali
 * ketuk, tanpa batas panjang — beda dengan tombol copy_text yang dibatasi 256
 * karakter. Caption sendPhoto sendiri dibatasi 1024 karakter.
 */
function telegramHtml(o: OrderNotice): string {
  return [
    `🛒 <b>Order Baru</b>  ·  <code>${esc(o.ref)}</code>`,
    '',
    `<b>${esc(o.productName)}</b>${o.variant ? ` · ${esc(o.variant)}` : ''}`,
    `${o.quantityKg} kg × ${rupiah(o.unitPrice)} = <b>${rupiah(o.totalPrice)}</b>`,
    o.hasPaid ? '✅ Sudah bayar' : '⚠️ <b>BELUM bayar</b>',
    `🚚 Kirim: <b>${esc(formatTanggal(o.deliveryDate))}</b>`,
    '',
    `<pre>${esc(copyBlock(o))}</pre>`,
    '<i>Ketuk blok di atas untuk menyalin semua</i>',
  ].join('\n')
}

async function notify(o: OrderNotice): Promise<void> {
  const provider = Deno.env.get('NOTIFY_PROVIDER') ?? 'console'
  const text = plainText(o)

  switch (provider) {
    case 'callmebot': {
      const phone = Deno.env.get('CALLMEBOT_PHONE')
      const apikey = Deno.env.get('CALLMEBOT_APIKEY')
      if (!phone || !apikey) throw new Error('CALLMEBOT_PHONE/APIKEY belum diset')
      const url =
        `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
        `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`CallMeBot ${res.status}: ${await res.text()}`)
      return
    }

    case 'whatsapp_cloud': {
      const phoneId = Deno.env.get('WA_PHONE_NUMBER_ID')
      const token = Deno.env.get('WA_ACCESS_TOKEN')
      const to = Deno.env.get('WA_RECIPIENT')
      if (!phoneId || !token || !to) throw new Error('WA_* env belum lengkap')

      const template = Deno.env.get('WA_TEMPLATE_NAME')
      // Pesan teks biasa hanya terkirim kalau jendela 24 jam terbuka (yaitu
      // Anda pernah membalas nomor bisnis dalam 24 jam terakhir). Di luar itu
      // Meta menolak, dan template berbayar yang dipakai.
      const payload = template
        ? {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
              name: template,
              language: { code: 'id' },
              components: [{ type: 'body', parameters: [{ type: 'text', text }] }],
            },
          }
        : { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }

      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`WhatsApp Cloud ${res.status}: ${await res.text()}`)
      return
    }

    // Provider uji: kirim ke URL apa pun (mis. webhook.site). Berguna untuk
    // membuktikan seluruh alur jalan sebelum repot menyiapkan WhatsApp.
    case 'webhook': {
      const hook = Deno.env.get('WEBHOOK_URL')
      if (!hook) throw new Error('WEBHOOK_URL belum diset')
      const res = await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(`Webhook ${res.status}: ${await res.text()}`)
      return
    }

    case 'telegram': {
      const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
      if (!token || !chatId) throw new Error('TELEGRAM_* env belum lengkap')
      const caption = telegramHtml(o)
      const info = copyBlock(o)
      // Telegram membatasi copy_text pada 256 karakter. Alamat boleh sampai 500,
      // jadi tombolnya hanya dipasang kalau muat — blok <pre> di pesan tetap
      // bisa disalin utuh berapa pun panjangnya, jadi tidak ada yang hilang.
      const rows: Record<string, unknown>[][] = [
        [{ text: '💬 Balas via WhatsApp', url: `https://wa.me/${o.customerPhone}` }],
      ]
      if (info.length <= 256) {
        rows.push([{ text: '📋 Salin info lengkap', copy_text: { text: info } }])
      } else if (o.customerAddress.length <= 256) {
        rows.push([{ text: '📋 Salin alamat', copy_text: { text: o.customerAddress } }])
      }
      const keyboard = { inline_keyboard: rows }
      const textFallback = {
        chat_id: chatId,
        text: o.proofUrl ? `${caption}\n\n🧾 ${o.proofUrl}` : caption,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }

      const send = async (endpoint: string, payload: unknown) => {
        const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          throw new Error(`Telegram ${endpoint} ${res.status}: ${(await res.text()).slice(0, 160)}`)
        }
      }

      // Ada bukti transfer → kirim sebagai FOTO supaya owner langsung melihat
      // buktinya di chat. Caption sendPhoto dibatasi 1024 karakter.
      const asPhoto = Boolean(o.proofUrl) && caption.length <= 1024
      if (asPhoto) {
        try {
          await send('sendPhoto', {
            chat_id: chatId,
            photo: o.proofUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: keyboard,
          })
          return
        } catch {
          // Telegram bisa menolak fotonya, ATAU koneksi ke Telegram putus di
          // tengah jalan. Keduanya melempar, dan keduanya tidak boleh membuat
          // notifikasi hilang — turunkan ke pesan teks dengan link buktinya.
        }
      }
      await send('sendMessage', textFallback)
      return
    }

    default:
      console.log('[notify:console]\n' + text)
  }
}

// ── Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body bukan JSON yang valid' }, 400)
  }

  const ref = String(body.ref ?? '')
  const productId = String(body.productId ?? '')
  const variant = body.variant == null ? null : String(body.variant)
  const quantityKg = Number(body.quantityKg ?? 0)
  const customerName = String(body.customerName ?? '').trim()
  const customerPhone = normalisePhone(String(body.customerPhone ?? ''))
  const customerAddress = String(body.customerAddress ?? '').trim()
  const deliveryDate = String(body.deliveryDate ?? '').trim()
  const hasPaid = Boolean(body.hasPaid)
  const proofPath = body.proofPath == null ? null : String(body.proofPath)

  if (!/^[2-9A-HJ-NP-Z]{6}$/.test(ref)) return json({ error: 'Ref tidak valid' }, 400)
  if (!PRODUCT_NAMES[productId]) return json({ error: 'Produk tidak dikenal' }, 400)
  if (!Number.isFinite(quantityKg) || quantityKg <= 0 || quantityKg > 500) {
    return json({ error: 'Jumlah tidak valid' }, 400)
  }
  if (customerName.length < 2 || customerName.length > 100) {
    return json({ error: 'Nama tidak valid' }, 400)
  }
  if (customerPhone.length < 8 || customerPhone.length > 20) {
    return json({ error: 'Nomor HP tidak valid' }, 400)
  }
  if (customerAddress.length < 10 || customerAddress.length > 500) {
    return json({ error: 'Alamat tidak valid' }, 400)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || Number.isNaN(Date.parse(deliveryDate))) {
    return json({ error: 'Tanggal pengiriman tidak valid' }, 400)
  }
  // Batas dihitung dalam UTC, sementara pengunjung memilih dalam waktu lokal.
  // Diberi kelonggaran 1 hari supaya pemilihan yang sah di zona waktu mana pun
  // tidak ditolak hanya karena beda tanggal UTC — aturan 3 harinya sudah
  // ditegakkan di form, ini jaring pengaman terhadap request buatan.
  if (deliveryDate < utcDatePlus(MIN_DELIVERY_DAYS - 1)) {
    return json({ error: `Tanggal kirim minimal ${MIN_DELIVERY_DAYS} hari dari sekarang` }, 400)
  }
  if (deliveryDate > utcDatePlus(MAX_DELIVERY_DAYS + 1)) {
    return json({ error: `Tanggal kirim maksimal ${MAX_DELIVERY_DAYS} hari ke depan` }, 400)
  }

  const unitPrice = resolveUnitPrice(productId, variant)
  if (unitPrice === null) return json({ error: 'Varian tidak dikenal' }, 400)
  const totalPrice = Math.round(unitPrice * quantityKg)

  // Supabase menyuntikkan SUPABASE_SERVICE_ROLE_KEY otomatis; SUPABASE_SECRET_KEY
  // adalah nama barunya. Terima keduanya supaya deploy tidak tergantung versi.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  // Rem darurat: tanpa ini satu skrip bisa membanjiri tabel order.
  const { count } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', new Date(Date.now() - 60_000).toISOString())
  if ((count ?? 0) >= 10) return json({ error: 'Terlalu banyak order, coba sebentar lagi' }, 429)

  const { error: insertError } = await admin.from('orders').insert({
    ref,
    product_id: productId,
    variant,
    quantity_kg: quantityKg,
    unit_price: unitPrice,
    total_price: totalPrice,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    delivery_date: deliveryDate,
    has_paid: hasPaid,
    proof_path: proofPath,
  })
  if (insertError) return json({ error: insertError.message }, 400)

  // Signed URL supaya owner bisa membuka bukti transfer tanpa bucket dibuat public.
  let proofUrl: string | null = null
  if (proofPath) {
    const { data } = await admin.storage
      .from('payment-proofs')
      .createSignedUrl(proofPath, 60 * 60 * 24 * 7) // 7 hari
    proofUrl = data?.signedUrl ?? null
  }

  // Order sudah tersimpan. Kalau notifikasi gagal, JANGAN gagalkan request —
  // pelanggan mungkin sudah membayar dan ordernya valid. Hasilnya dicatat di
  // baris order supaya bisa diperiksa lewat SQL, bukan ditebak dari log.
  let notifyStatus = 'sent'
  try {
    await notify({
      ref,
      productName: PRODUCT_NAMES[productId],
      variant,
      quantityKg,
      unitPrice,
      totalPrice,
      customerName,
      customerPhone,
      customerAddress,
      deliveryDate,
      hasPaid,
      proofUrl,
    })
  } catch (e) {
    notifyStatus = redact(`error: ${e instanceof Error ? e.message : String(e)}`).slice(0, 300)
    console.error('[notify] gagal:', notifyStatus)
  }
  await admin
    .from('orders')
    .update({ notify_status: notifyStatus, notified_at: new Date().toISOString() })
    .eq('ref', ref)

  return json({ ref, totalPrice, notify: notifyStatus })
})
