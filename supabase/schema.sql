-- Pavaroma — skema database
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent).

-- ─────────────────────────────────────────────────────────────
-- 1. ORDERS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  ref            text        not null unique,        -- kode pendek utk notifikasi, mis. "A7F3"
  product_id     text        not null,               -- 'arabica' | 'robusta' | 'blend'
  variant        text,                               -- rasio blend, mis. '75:25'
  quantity_kg    numeric(6,2) not null default 1 check (quantity_kg > 0 and quantity_kg <= 500),
  unit_price     integer     not null check (unit_price >= 0),   -- IDR, disalin saat order dibuat
  total_price    integer     not null check (total_price >= 0),  -- supaya harga historis tidak berubah
  customer_name  text        not null check (char_length(customer_name) between 2 and 100),
  customer_phone text        not null check (char_length(customer_phone) between 8 and 20),
  customer_address text      not null check (char_length(customer_address) between 10 and 500),
  has_paid       boolean     not null default false,
  proof_path     text,                               -- path di bucket payment-proofs
  status         text        not null default 'new'
                 check (status in ('new','confirmed','shipped','done','cancelled')),
  -- Tanggal kirim pilihan pelanggan. Minimal 3 hari setelah order, divalidasi
  -- di Edge Function — CHECK constraint tidak bisa dipakai karena harus
  -- immutable dan tidak boleh memanggil now().
  delivery_date  date,
  -- null = belum dicoba · 'sent' = berhasil · selain itu = pesan error.
  -- Ini yang membuat provider notifikasi bisa diuji lewat SQL, bukan menebak dari log.
  notify_status  text,
  notified_at    timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.orders
  add column if not exists notify_status text,
  add column if not exists notified_at   timestamptz,
  add column if not exists delivery_date date;

create index if not exists orders_delivery_date_idx on public.orders (delivery_date);

-- Untuk database yang sudah terlanjur dibuat sebelum kolom alamat ada.
-- Default '-' hanya menambal baris lama; baris baru selalu diisi form.
alter table public.orders
  add column if not exists customer_address text not null default '-';
alter table public.orders alter column customer_address drop default;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);

alter table public.orders enable row level security;

-- Tidak ada policy untuk anon sama sekali.
-- Order HANYA boleh ditulis oleh Edge Function (service_role, bypass RLS) dan
-- dibaca lewat Supabase Dashboard. Ini mencegah siapa pun membaca nama,
-- no HP, dan bukti transfer pelanggan lewat anon key yang terlihat publik.
drop policy if exists "orders: no anon access" on public.orders;

-- ─────────────────────────────────────────────────────────────
-- 2. REVIEWS
-- ─────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  text        not null,
  author_name text        not null check (char_length(author_name) between 2 and 60),
  rating      smallint    not null check (rating between 1 and 5),
  comment     text        check (comment is null or char_length(comment) <= 600),
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);

alter table public.reviews enable row level security;

-- Review tampil langsung (tanpa moderasi), sesuai permintaan.
drop policy if exists "reviews: public read" on public.reviews;
create policy "reviews: public read"
  on public.reviews for select
  to anon, authenticated
  using (true);

-- Review anonim, jadi tidak ada identitas yang bisa dicocokkan. Yang bisa
-- dibatasi adalah BENTUK datanya — termasuk daftar produk yang sah, supaya
-- tabel tidak bisa dipenuhi review untuk product_id karangan.
-- Tambahkan id produk baru di sini kalau `src/data/products.ts` bertambah.
drop policy if exists "reviews: public insert" on public.reviews;
create policy "reviews: public insert"
  on public.reviews for insert
  to anon, authenticated
  with check (
    product_id in ('arabica', 'robusta', 'blend')
    and rating between 1 and 5
    and char_length(author_name) between 2 and 60
    and (comment is null or char_length(comment) <= 600)
  );

-- Sengaja TIDAK ada policy update/delete: review tidak bisa diubah atau dihapus
-- lewat anon key. Hapus spam lewat Supabase Dashboard.

-- WAJIB, dan terpisah dari RLS. Sejak 2026-05-30 Supabase tidak lagi otomatis
-- mengekspos tabel baru di schema public ke Data API. RLS mengatur BARIS mana
-- yang terlihat; GRANT mengatur apakah tabelnya bisa dijangkau sama sekali.
-- Tanpa baris ini, review gagal dibaca meski policy-nya sudah benar.
grant select, insert on public.reviews to anon, authenticated;

-- `orders` sengaja TIDAK di-grant ke anon/authenticated. Itulah yang membuat
-- data pelanggan tidak bisa disentuh dari browser.
revoke all on public.orders from anon, authenticated;

-- Rem darurat anti-flood: tolak insert kalau sudah ada >5 review dalam 1 menit
-- terakhir untuk produk yang sama. Ini menahan bot yang membanjiri, bukan
-- pengganti captcha. Kalau spam tetap lolos, pasang Cloudflare Turnstile.
create or replace function public.reviews_throttle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.reviews
      where product_id = new.product_id
        and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'Terlalu banyak review dalam waktu singkat. Coba lagi sebentar lagi.';
  end if;
  return new;
end;
$$;

-- Postgres memberi EXECUTE ke PUBLIC untuk setiap fungsi baru, dan fungsi
-- SECURITY DEFINER di schema public otomatis jadi endpoint yang bisa dipanggil
-- anon. Fungsi ini hanya boleh dijalankan oleh trigger.
revoke all on function public.reviews_throttle() from public, anon, authenticated;

drop trigger if exists reviews_throttle_trg on public.reviews;
create trigger reviews_throttle_trg
  before insert on public.reviews
  for each row execute function public.reviews_throttle();

-- Ringkasan rating per produk, aman dibaca publik (tidak membocorkan apa pun).
create or replace view public.product_rating_summary
with (security_invoker = true) as
  select product_id,
         count(*)::int              as review_count,
         round(avg(rating)::numeric, 2) as average_rating
  from public.reviews
  group by product_id;

grant select on public.product_rating_summary to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. STORAGE — bukti transfer
-- ─────────────────────────────────────────────────────────────

-- Bucket PRIVATE. Bukti transfer adalah data pribadi; jangan pernah public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic'];

-- Pengunjung boleh UPLOAD bukti transfer, tapi tidak boleh melihat, mengubah,
-- atau menghapus file siapa pun — termasuk miliknya sendiri. Owner melihatnya
-- lewat signed URL yang dibuat Edge Function.
drop policy if exists "proofs: anon upload only" on storage.objects;
create policy "proofs: anon upload only"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');
