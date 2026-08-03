// Supabase Edge Function - webhook Telegram untuk membuat invoice.
//
// PENTING: function ini di-deploy dengan verify_jwt = FALSE, karena Telegram
// tidak mengirim JWT Supabase. Gantinya, setiap request diverifikasi lewat
// header X-Telegram-Bot-Api-Secret-Token yang hanya diketahui Telegram dan
// kita (diset saat setWebhook). Tanpa pemeriksaan itu, endpoint ini terbuka
// untuk siapa saja.
//
// Deploy : supabase functions deploy telegram-bot --no-verify-jwt
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_CHAT_ID

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''
/** Hanya chat ini yang boleh memakai bot. Invoice memuat data pelanggan. */
const OWNER_CHAT = Deno.env.get('TELEGRAM_CHAT_ID') ?? ''

const BUSINESS = {
  name: 'PAVAROMA',
  tagline: 'Awaken the True Aroma',
  address:
    'Jl. Diponegoro No.262, Dauh Puri Klod, Kec. Denpasar Bar., Kota Denpasar, Bali 80113',
  phone: '082144703290',
  site: 'https://pavaroma.vercel.app',
  logo: 'https://pavaroma.vercel.app/logo.png',
  bank: { name: 'BRI (Bank Rakyat Indonesia)', holder: 'Yoga Pratama', number: '001701091008505' },
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

// -- Util -----------------------------------------------------------------

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const redact = (s: string) =>
  s.replace(/bot\d{6,}:[A-Za-z0-9_-]{20,}/g, 'bot***')

/**
 * Font standar PDF (Helvetica) memakai WinAnsi - emoji dan sebagian tanda
 * baca tipografis membuat pdf-lib melempar. Diganti padanan ASCII-nya
 * daripada membiarkan pembuatan PDF gagal karena satu karakter.
 */
function pdfSafe(s: string): string {
  return (s ?? '')
    .replace(/[\u00D7\u2715]/g, 'x')          // x  multiplication / cross
    .replace(/[\u2014\u2013]/g, '-')          // em dash / en dash
    .replace(/[\u00B7\u2022]/g, '-')          // middot / bullet
    .replace(/[\u201C\u201D]/g, '"')          // kutip lengkung ganda
    .replace(/[\u2018\u2019]/g, "'")          // kutip lengkung tunggal
    .replace(/\u00A0/g, ' ')                   // spasi tak-putus
    // sisanya: buang apa pun di luar Latin-1 (emoji, aksara non-latin)
    .replace(/[^\x20-\x7E\u00A1-\u00FF]/g, '')
}


function tanggalPanjang(d = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar',
  }).format(d)
}

// -- Telegram API ---------------------------------------------------------

async function tg(method: string, payload: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const j = await res.json()
  if (!j.ok) throw new Error(redact(`${method}: ${j.description}`))
  return j.result
}

async function sendPdf(chatId: string | number, bytes: Uint8Array, filename: string, caption: string) {
  const fd = new FormData()
  fd.append('chat_id', String(chatId))
  fd.append('caption', caption)
  fd.append('parse_mode', 'HTML')
  fd.append('document', new Blob([bytes], { type: 'application/pdf' }), filename)
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
    method: 'POST',
    body: fd,
  })
  const j = await res.json()
  if (!j.ok) throw new Error(redact(`sendDocument: ${j.description}`))
  return j.result
}

// -- State percakapan -----------------------------------------------------

interface Item { name: string; desc: string; qty: number; unit: string; price: number }
interface Draft {
  orderRef: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  note: string
  hasPaid: boolean
  items: Item[]
}
interface State {
  draft?: Draft
  awaiting?: { field: string; index?: number }
  cardId?: number
}

async function getState(chatId: number): Promise<State> {
  const { data } = await admin
    .from('telegram_sessions').select('state').eq('chat_id', chatId).maybeSingle()
  return (data?.state as State) ?? {}
}

async function setState(chatId: number, state: State): Promise<void> {
  await admin.from('telegram_sessions')
    .upsert({ chat_id: chatId, state, updated_at: new Date().toISOString() })
}

const totalDraft = (d: Draft) => d.items.reduce((s, i) => s + Math.round(i.qty * i.price), 0)

// -- Tampilan kartu draft -------------------------------------------------

function kartu(d: Draft): { text: string; reply_markup: unknown } {
  const baris = d.items.map((it, i) =>
    `${i + 1}. <b>${esc(it.name)}</b>${it.desc ? `\n   <i>${esc(it.desc)}</i>` : ''}` +
    `\n   ${it.qty} ${esc(it.unit)} x ${rupiah(it.price)} = <b>${rupiah(it.qty * it.price)}</b>`,
  ).join('\n')

  const text = [
    '🧾 <b>Draft Invoice</b>',
    '',
    `Kepada : <b>${esc(d.customerName || '(belum diisi)')}</b>`,
    d.customerPhone ? `No HP  : <code>${esc(d.customerPhone)}</code>` : '',
    d.customerAddress ? `Alamat : ${esc(d.customerAddress)}` : '',
    d.note ? `Catatan: ${esc(d.note)}` : '',
    '',
    baris || '<i>Belum ada item.</i>',
    '',
    `Status : ${d.hasPaid ? '✅ Lunas' : '⏳ Belum dibayar'}`,
    `<b>TOTAL  : ${rupiah(totalDraft(d))}</b>`,
  ].filter(Boolean).join('\n')

  const itemBtns = d.items.map((it, i) => [
    { text: `✏️ ${i + 1}. ${it.name.slice(0, 22)}`, callback_data: `it:${i}` },
  ])

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Nama', callback_data: 'ed:name' },
          { text: '✏️ No HP', callback_data: 'ed:phone' },
        ],
        [
          { text: '✏️ Alamat', callback_data: 'ed:addr' },
          { text: '✏️ Catatan', callback_data: 'ed:note' },
        ],
        ...itemBtns,
        [
          { text: '➕ Tambah item', callback_data: 'add' },
          { text: d.hasPaid ? '⏳ Tandai belum lunas' : '✅ Tandai lunas', callback_data: 'ed:paid' },
        ],
        [{ text: '📄 Buat PDF', callback_data: 'pdf' }],
        [{ text: '✖️ Batal', callback_data: 'cancel' }],
      ],
    },
  }
}

async function tampilkanKartu(chatId: number, st: State) {
  const k = kartu(st.draft!)
  if (st.cardId) {
    try {
      await tg('editMessageText', {
        chat_id: chatId, message_id: st.cardId,
        text: k.text, parse_mode: 'HTML', reply_markup: k.reply_markup,
      })
      return
    } catch {
      // pesan mungkin sudah terlalu lama untuk diedit - kirim yang baru
    }
  }
  const m = await tg('sendMessage', {
    chat_id: chatId, text: k.text, parse_mode: 'HTML', reply_markup: k.reply_markup,
  }) as { message_id: number }
  st.cardId = m.message_id
  await setState(chatId, st)
}

// -- PDF ------------------------------------------------------------------

const BIRU = rgb(0.24, 0.44, 0.79)
const ABU = rgb(0.45, 0.45, 0.45)
const HITAM = rgb(0.1, 0.1, 0.1)
const GARIS = rgb(0.8, 0.8, 0.8)

async function buatPdf(nomor: string, d: Draft): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89]) // A4
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const W = 595.28
  const L = 40
  const R = W - 40

  const tulis = (
    t: string, x: number, y: number,
    o: { size?: number; font?: typeof reg; color?: typeof HITAM; align?: 'left' | 'right' | 'center' } = {},
  ) => {
    const size = o.size ?? 9
    const font = o.font ?? reg
    const s = pdfSafe(t)
    let px = x
    if (o.align === 'right') px = x - font.widthOfTextAtSize(s, size)
    if (o.align === 'center') px = x - font.widthOfTextAtSize(s, size) / 2
    page.drawText(s, { x: px, y, size, font, color: o.color ?? HITAM })
  }

  /** Pecah teks agar muat di lebar tertentu. */
  const bungkus = (t: string, maxW: number, size: number, font: typeof reg): string[] => {
    const kata = pdfSafe(t).split(/\s+/).filter(Boolean)
    const out: string[] = []
    let baris = ''
    for (const k of kata) {
      const coba = baris ? `${baris} ${k}` : k
      if (font.widthOfTextAtSize(coba, size) > maxW && baris) {
        out.push(baris)
        baris = k
      } else baris = coba
    }
    if (baris) out.push(baris)
    return out
  }

  let y = 800

  // Logo - diambil dari situs. Kalau gagal, invoice tetap dibuat tanpa logo.
  try {
    const res = await fetch(BUSINESS.logo)
    if (res.ok) {
      const img = await pdf.embedPng(new Uint8Array(await res.arrayBuffer()))
      const h = 52
      const w = (img.width / img.height) * h
      page.drawImage(img, { x: L, y: y - h + 10, width: w, height: h })
    }
  } catch { /* lanjut tanpa logo */ }

  tulis(BUSINESS.name, L + 70, y, { size: 16, font: bold })
  tulis(BUSINESS.address, L + 70, y - 14, { size: 7.5, color: ABU })
  tulis(BUSINESS.phone, L + 70, y - 25, { size: 7.5, color: ABU })
  tulis(BUSINESS.site, L + 70, y - 36, { size: 7.5, color: ABU })

  y -= 60
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1.2, color: HITAM })

  y -= 34
  tulis('INVOICE', W / 2, y, { size: 20, font: bold, align: 'center' })

  y -= 34
  tulis('Kepada', L, y, { size: 7.5, color: ABU })
  tulis(nomor, R, y + 2, { size: 15, font: bold, color: BIRU, align: 'right' })
  y -= 13
  tulis(d.customerName, L, y, { size: 10, font: bold })
  tulis(tanggalPanjang(), R, y, { size: 8.5, color: BIRU, align: 'right' })
  if (d.customerPhone) { y -= 11; tulis(d.customerPhone, L, y, { size: 8, color: ABU }) }
  if (d.customerAddress) {
    for (const b of bungkus(d.customerAddress, 250, 8, reg)) { y -= 10; tulis(b, L, y, { size: 8, color: ABU }) }
  }

  // -- Tabel --
  y -= 26
  const kolNo = L + 6, kolProduk = L + 34, kolQty = L + 330, kolHarga = L + 420, kolJumlah = R - 6
  page.drawRectangle({ x: L, y: y - 4, width: R - L, height: 18, color: BIRU })
  tulis('No', kolNo, y + 1, { size: 8, font: bold, color: rgb(1, 1, 1) })
  tulis('Produk', kolProduk, y + 1, { size: 8, font: bold, color: rgb(1, 1, 1) })
  tulis('Qty', kolQty, y + 1, { size: 8, font: bold, color: rgb(1, 1, 1), align: 'right' })
  tulis('Harga', kolHarga, y + 1, { size: 8, font: bold, color: rgb(1, 1, 1), align: 'right' })
  tulis('Jumlah', kolJumlah, y + 1, { size: 8, font: bold, color: rgb(1, 1, 1), align: 'right' })

  y -= 10
  d.items.forEach((it, i) => {
    const namaBaris = bungkus(it.name, 270, 9, bold)
    const descBaris = it.desc ? bungkus(it.desc, 270, 7.5, reg) : []
    const tinggi = 12 + namaBaris.length * 11 + descBaris.length * 9

    y -= tinggi
    if (i % 2 === 1) {
      page.drawRectangle({ x: L, y: y - 2, width: R - L, height: tinggi, color: rgb(0.97, 0.97, 0.98) })
    }

    let ty = y + tinggi - 14
    tulis(String(i + 1), kolNo, ty, { size: 9 })
    namaBaris.forEach((b) => { tulis(b, kolProduk, ty, { size: 9, font: bold }); ty -= 11 })
    descBaris.forEach((b) => { tulis(b, kolProduk, ty, { size: 7.5, color: ABU }); ty -= 9 })

    const baseline = y + tinggi - 14
    tulis(`${it.qty}`, kolQty, baseline, { size: 9, align: 'right' })
    tulis(`${it.unit}`, kolQty, baseline - 10, { size: 7, color: ABU, align: 'right' })
    tulis(rupiah(it.price), kolHarga, baseline, { size: 9, align: 'right' })
    tulis(rupiah(it.qty * it.price), kolJumlah, baseline, { size: 9, font: bold, align: 'right' })

    page.drawLine({ start: { x: L, y: y - 2 }, end: { x: R, y: y - 2 }, thickness: 0.5, color: GARIS })
  })

  const total = totalDraft(d)

  // -- Ringkasan kanan --
  y -= 24
  const boxX = W - 40 - 220
  page.drawRectangle({ x: boxX, y: y - 6, width: 220, height: 22, color: BIRU })
  tulis('Grand Total', boxX + 8, y, { size: 9, font: bold, color: rgb(1, 1, 1) })
  tulis(rupiah(total), R - 8, y, { size: 10, font: bold, color: rgb(1, 1, 1), align: 'right' })

  y -= 22
  tulis(d.hasPaid ? 'Sudah dibayar' : 'Belum dibayar', boxX + 8, y, { size: 8.5, color: ABU })
  tulis(d.hasPaid ? rupiah(total) : rupiah(0), R - 8, y, { size: 8.5, align: 'right' })
  y -= 13
  tulis('Sisa tagihan', boxX + 8, y, { size: 8.5, font: bold })
  tulis(d.hasPaid ? rupiah(0) : rupiah(total), R - 8, y, { size: 8.5, font: bold, align: 'right' })

  // -- Stempel LUNAS --
  if (d.hasPaid) {
    const sx = L + 10, sy = y - 46
    page.drawRectangle({
      x: sx, y: sy, width: 108, height: 34,
      borderColor: rgb(0.78, 0.16, 0.16), borderWidth: 2.2, color: undefined,
    })
    tulis('LUNAS', sx + 54, sy + 11, { size: 17, font: bold, color: rgb(0.78, 0.16, 0.16), align: 'center' })
  }

  // -- Catatan --
  if (d.note) {
    y -= 62
    tulis('Catatan', L, y, { size: 7.5, color: ABU })
    for (const b of bungkus(d.note, R - L, 8.5, reg)) { y -= 11; tulis(b, L, y, { size: 8.5 }) }
  }

  // -- Rekening --
  const bankY = 132
  page.drawRectangle({
    x: L, y: bankY - 8, width: R - L, height: 56,
    borderColor: GARIS, borderWidth: 1, color: undefined,
  })
  tulis('Pembayaran', L + 10, bankY + 32, { size: 7.5, color: ABU })
  tulis(`${BUSINESS.bank.name} a.n. ${BUSINESS.bank.holder}`, L + 10, bankY + 18, { size: 9 })
  tulis(BUSINESS.bank.number, L + 10, bankY + 4, { size: 12, font: bold })

  // -- Kaki --
  tulis(
    'Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan.',
    W / 2, 70, { size: 7.5, color: ABU, align: 'center' },
  )
  tulis(`${BUSINESS.name} - ${BUSINESS.tagline}`, W / 2, 58, { size: 7.5, color: ABU, align: 'center' })

  return await pdf.save()
}

// -- Alur bot -------------------------------------------------------------

async function mulaiInvoice(chatId: number) {
  const { data: orders } = await admin
    .from('orders')
    .select('ref, customer_name, total_price, has_paid')
    .order('created_at', { ascending: false })
    .limit(8)

  const rows = (orders ?? []).map((o) => [{
    text: `${o.ref} · ${o.customer_name} · ${rupiah(o.total_price)}${o.has_paid ? ' ✅' : ''}`,
    callback_data: `pick:${o.ref}`,
  }])
  rows.push([{ text: '➕ Invoice kosong', callback_data: 'pick:blank' }])

  await tg('sendMessage', {
    chat_id: chatId,
    text: (orders ?? []).length
      ? '🧾 Pilih order yang mau dijadikan invoice:'
      : '🧾 Belum ada order. Mulai dari invoice kosong:',
    reply_markup: { inline_keyboard: rows },
  })
}

async function draftDariOrder(ref: string): Promise<Draft | null> {
  const { data: o } = await admin.from('orders').select('*').eq('ref', ref).maybeSingle()
  if (!o) return null
  const nama: Record<string, string> = {
    arabica: 'Arabica Kintamani', robusta: 'Fine Robusta Pupuan', blend: 'House Blend Premium',
  }
  return {
    orderRef: o.ref,
    customerName: o.customer_name,
    customerPhone: o.customer_phone ?? '',
    customerAddress: o.customer_address ?? '',
    note: o.delivery_date ? `Pengiriman: ${o.delivery_date}` : '',
    hasPaid: Boolean(o.has_paid),
    items: [{
      name: nama[o.product_id] ?? o.product_id,
      desc: o.variant ? `Arabica ${o.variant.split(':')[0]}% : Robusta ${o.variant.split(':')[1]}%` : '',
      qty: Number(o.quantity_kg),
      unit: 'Kg',
      price: Number(o.unit_price),
    }],
  }
}

const draftKosong = (): Draft => ({
  orderRef: null, customerName: '', customerPhone: '', customerAddress: '',
  note: '', hasPaid: false, items: [],
})

async function tanya(chatId: number, st: State, field: string, prompt: string, index?: number) {
  st.awaiting = { field, index }
  await setState(chatId, st)
  await tg('sendMessage', { chat_id: chatId, text: prompt, parse_mode: 'HTML' })
}

async function terbitkan(chatId: number, st: State) {
  const d = st.draft!
  if (!d.items.length) {
    await tg('sendMessage', { chat_id: chatId, text: '⚠️ Belum ada item. Tambahkan minimal satu.' })
    return
  }
  if (!d.customerName.trim()) {
    await tg('sendMessage', { chat_id: chatId, text: '⚠️ Nama pembeli belum diisi.' })
    return
  }

  const { data: seq } = await admin.rpc('next_invoice_number')
  const nomor = String(seq)

  const total = totalDraft(d)
  const { data: inv, error } = await admin.from('invoices').insert({
    number: nomor, order_ref: d.orderRef, customer_name: d.customerName,
    customer_phone: d.customerPhone || null, customer_address: d.customerAddress || null,
    note: d.note || null, has_paid: d.hasPaid, total, created_by: chatId,
  }).select('id').single()
  if (error) throw new Error(error.message)

  await admin.from('invoice_items').insert(
    d.items.map((it, i) => ({
      invoice_id: inv.id, position: i + 1, name: it.name, description: it.desc || null,
      qty: it.qty, unit: it.unit, unit_price: it.price, amount: Math.round(it.qty * it.price),
    })),
  )

  const bytes = await buatPdf(nomor, d)
  const path = `${nomor}.pdf`
  await admin.storage.from('invoices').upload(path, bytes, {
    contentType: 'application/pdf', upsert: true,
  })
  await admin.from('invoices').update({ pdf_path: path }).eq('id', inv.id)

  const waText =
    `Halo Kak ${d.customerName}, berikut invoice ${nomor} untuk pesanan Anda di ${BUSINESS.name}.\n\n` +
    `Total: ${rupiah(total)}\n` +
    (d.hasPaid
      ? 'Pembayaran sudah kami terima. Terima kasih 🙏'
      : `Silakan transfer ke:\n${BUSINESS.bank.name} a.n. ${BUSINESS.bank.holder}\n${BUSINESS.bank.number}\nNominal: ${rupiah(total)}`) +
    `\n\nSalam hangat,\n${BUSINESS.name}`

  await sendPdf(chatId, bytes, `${nomor}.pdf`, [
    `🧾 <b>${nomor}</b> siap`,
    `${esc(d.customerName)} · <b>${rupiah(total)}</b>`,
    d.hasPaid ? '✅ Lunas' : '⏳ Belum dibayar',
    '',
    '<i>Teruskan file ini ke WhatsApp pelanggan.</i>',
  ].join('\n'))

  if (d.customerPhone) {
    await tg('sendMessage', {
      chat_id: chatId,
      text: '💬 Kirim pesan pengantar ke pelanggan:',
      reply_markup: {
        inline_keyboard: [[{
          text: '💬 Buka WhatsApp',
          url: `https://wa.me/${d.customerPhone}?text=${encodeURIComponent(waText)}`,
        }]],
      },
    })
  }

  await setState(chatId, {})
}

// -- Handler --------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok')

  // Satu-satunya penjaga endpoint ini (verify_jwt mati).
  if (!WEBHOOK_SECRET || req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  let update: Record<string, any>
  try { update = await req.json() } catch { return new Response('ok') }

  const msg = update.message
  const cb = update.callback_query
  const chatId: number | undefined = msg?.chat?.id ?? cb?.message?.chat?.id
  if (!chatId) return new Response('ok')

  // Invoice memuat nama, alamat, dan nominal pelanggan - hanya owner.
  if (OWNER_CHAT && String(chatId) !== OWNER_CHAT) {
    await tg('sendMessage', { chat_id: chatId, text: 'Maaf, bot ini hanya untuk pemilik toko.' }).catch(() => {})
    return new Response('ok')
  }

  try {
    if (cb) {
      const data: string = cb.data ?? ''
      const st = await getState(chatId)
      await tg('answerCallbackQuery', { callback_query_id: cb.id }).catch(() => {})

      if (data.startsWith('pick:')) {
        const ref = data.slice(5)
        const draft = ref === 'blank' ? draftKosong() : await draftDariOrder(ref)
        if (!draft) { await tg('sendMessage', { chat_id: chatId, text: 'Order tidak ditemukan.' }); return new Response('ok') }
        const baru: State = { draft, cardId: undefined }
        await setState(chatId, baru)
        await tampilkanKartu(chatId, baru)
        return new Response('ok')
      }

      if (!st.draft) {
        await tg('sendMessage', { chat_id: chatId, text: 'Draft sudah tidak aktif. Ketik /invoice untuk mulai lagi.' })
        return new Response('ok')
      }

      if (data === 'cancel') {
        await setState(chatId, {})
        await tg('sendMessage', { chat_id: chatId, text: 'Draft dibatalkan.' })
        return new Response('ok')
      }
      if (data === 'ed:name')  { await tanya(chatId, st, 'name',  'Ketik <b>nama pembeli</b>:'); return new Response('ok') }
      if (data === 'ed:phone') { await tanya(chatId, st, 'phone', 'Ketik <b>nomor WhatsApp</b> pembeli:'); return new Response('ok') }
      if (data === 'ed:addr')  { await tanya(chatId, st, 'addr',  'Ketik <b>alamat</b> pembeli:'); return new Response('ok') }
      if (data === 'ed:note')  { await tanya(chatId, st, 'note',  'Ketik <b>catatan</b> untuk invoice:'); return new Response('ok') }
      if (data === 'add')      { await tanya(chatId, st, 'newitem', 'Ketik <b>nama produk</b> baru:'); return new Response('ok') }

      if (data === 'ed:paid') {
        st.draft.hasPaid = !st.draft.hasPaid
        await setState(chatId, st)
        await tampilkanKartu(chatId, st)
        return new Response('ok')
      }

      if (data.startsWith('it:')) {
        const i = Number(data.slice(3))
        const it = st.draft.items[i]
        if (!it) return new Response('ok')
        await tg('sendMessage', {
          chat_id: chatId,
          text: `Item ${i + 1}: <b>${esc(it.name)}</b>\n${it.qty} ${esc(it.unit)} x ${rupiah(it.price)}`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [
            [{ text: '✏️ Nama', callback_data: `itn:${i}` }, { text: '✏️ Ket.', callback_data: `itd:${i}` }],
            [{ text: '✏️ Qty', callback_data: `itq:${i}` }, { text: '✏️ Harga', callback_data: `itp:${i}` }],
            [{ text: '🗑 Hapus item', callback_data: `itx:${i}` }],
          ] },
        })
        return new Response('ok')
      }
      if (data.startsWith('itn:')) { await tanya(chatId, st, 'itemName',  'Ketik nama produk:', Number(data.slice(4))); return new Response('ok') }
      if (data.startsWith('itd:')) { await tanya(chatId, st, 'itemDesc',  'Ketik keterangan (mis. rasio):', Number(data.slice(4))); return new Response('ok') }
      if (data.startsWith('itq:')) { await tanya(chatId, st, 'itemQty',   'Ketik jumlah (angka, boleh desimal):', Number(data.slice(4))); return new Response('ok') }
      if (data.startsWith('itp:')) { await tanya(chatId, st, 'itemPrice', 'Ketik harga satuan (angka saja):', Number(data.slice(4))); return new Response('ok') }
      if (data.startsWith('itx:')) {
        st.draft.items.splice(Number(data.slice(4)), 1)
        st.cardId = undefined
        await setState(chatId, st)
        await tampilkanKartu(chatId, st)
        return new Response('ok')
      }

      if (data === 'pdf') { await terbitkan(chatId, st); return new Response('ok') }
      return new Response('ok')
    }

    const teks: string = (msg?.text ?? '').trim()
    if (!teks) return new Response('ok')

    if (teks.startsWith('/start')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: [
          `👋 Bot ${BUSINESS.name}`, '',
          'Perintah yang tersedia:',
          '/invoice — buat invoice dari order atau dari kosong',
          '/batal — buang draft yang sedang dibuat',
        ].join('\n'),
      })
      return new Response('ok')
    }
    if (teks.startsWith('/batal')) {
      await setState(chatId, {})
      await tg('sendMessage', { chat_id: chatId, text: 'Draft dibuang.' })
      return new Response('ok')
    }
    if (teks.startsWith('/invoice')) { await mulaiInvoice(chatId); return new Response('ok') }

    // Teks biasa = jawaban atas pertanyaan yang sedang menunggu
    const st = await getState(chatId)
    if (!st.awaiting || !st.draft) return new Response('ok')
    const { field, index } = st.awaiting
    const d = st.draft

    const angka = (s: string) => Number(s.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'))

    if (field === 'name') d.customerName = teks.slice(0, 100)
    else if (field === 'phone') d.customerPhone = teks.replace(/\D/g, '').replace(/^0/, '62')
    else if (field === 'addr') d.customerAddress = teks.slice(0, 500)
    else if (field === 'note') d.note = teks.slice(0, 300)
    else if (field === 'newitem') d.items.push({ name: teks.slice(0, 80), desc: '', qty: 1, unit: 'Kg', price: 0 })
    else if (field === 'itemName' && d.items[index!]) d.items[index!].name = teks.slice(0, 80)
    else if (field === 'itemDesc' && d.items[index!]) d.items[index!].desc = teks.slice(0, 120)
    else if (field === 'itemQty' && d.items[index!]) {
      const v = angka(teks)
      if (!Number.isFinite(v) || v <= 0) {
        await tg('sendMessage', { chat_id: chatId, text: '⚠️ Jumlah harus angka lebih dari 0. Coba lagi.' })
        return new Response('ok')
      }
      d.items[index!].qty = v
    } else if (field === 'itemPrice' && d.items[index!]) {
      const v = angka(teks)
      if (!Number.isFinite(v) || v < 0) {
        await tg('sendMessage', { chat_id: chatId, text: '⚠️ Harga harus angka. Coba lagi.' })
        return new Response('ok')
      }
      d.items[index!].price = Math.round(v)
    }

    st.awaiting = undefined
    st.cardId = undefined
    await setState(chatId, st)
    await tampilkanKartu(chatId, st)
    return new Response('ok')
  } catch (e) {
    const pesan = redact(e instanceof Error ? e.message : String(e))
    console.error('[telegram-bot]', pesan)
    try { await tg('sendMessage', { chat_id: chatId, text: `⚠️ Gagal: ${pesan.slice(0, 200)}` }) } catch { /* diam */ }
    return new Response('ok')
  }
})
