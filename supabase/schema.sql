-- Run this whole file once in the Supabase SQL Editor.
-- It is safe to re-run: every statement drops/replaces before creating.

-- =========================================================
-- 1. PROFILES TABLE
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =========================================================
-- 2. AUTO-CREATE A PROFILE ROW WHEN A USER SIGNS UP
-- =========================================================

-- Google OAuth puts the display name under 'full_name' or 'name' depending
-- on version, and the photo under 'avatar_url' or 'picture' -- check both.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 3a. BACKFILL MISSING PROFILE ROWS (safe to re-run)
-- =========================================================
-- The trigger only runs at the moment of signup. Any account created
-- before the trigger existed (or before this whole setup was finished)
-- has no row in profiles at all -- which makes every update from the
-- app silently match zero rows. This creates the missing row for any
-- such account.

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =========================================================
-- 3b. BACKFILL EXISTING PROFILES (safe to re-run; only fills blanks)
-- =========================================================
-- The trigger above only runs for NEW signups. This fixes accounts
-- created before the trigger knew to check 'name' and 'picture' too.

update public.profiles p
set
  full_name = coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where p.id = u.id
  and (p.full_name is null or p.avatar_url is null);

-- =========================================================
-- 4. PUBLIC "avatars" STORAGE BUCKET
-- =========================================================
-- Public so avatar images can be displayed with a plain public URL and
-- never expire. Anyone with the direct link can view an avatar image --
-- normal for profile photos, same as most apps. Uploading/replacing/
-- deleting is still restricted to the owner via the policies below.
-- (If this bucket was created private by an earlier version of this
-- script, this flips it to public too.)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Files must be stored as "{user_id}/filename.ext" for these policies to work.

drop policy if exists "Users can read own avatar folder" on storage.objects;
create policy "Users can read own avatar folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload to own avatar folder" on storage.objects;
create policy "Users can upload to own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own avatar folder" on storage.objects;
create policy "Users can update own avatar folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own avatar folder" on storage.objects;
create policy "Users can delete own avatar folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create extension if not exists pgcrypto;

-- =========================================================
-- 5. ORDERS TABLE
-- =========================================================
-- app/api/webhooks/stripe/route.ts writes to this table using the
-- service-role client (bypasses RLS) after a successful checkout, so
-- there's no insert/update policy here for regular users on purpose.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'shipped', 'delivered')),
  total numeric(10, 2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- =========================================================
-- 6. ADDRESSES TABLE
-- =========================================================

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

drop policy if exists "Users can view own addresses" on public.addresses;
create policy "Users can view own addresses"
  on public.addresses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own addresses" on public.addresses;
create policy "Users can insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own addresses" on public.addresses;
create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own addresses" on public.addresses;
create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 7. FAVORITES / WISHLIST TABLE
-- =========================================================
-- product_id is a plain text id matching lib/products.ts (PRODUCTS[].id),
-- since the product catalog isn't stored in the database.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.favorites enable row level security;

drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 8. EXTENDED PROFILE FIELDS
-- =========================================================
-- For the "Change Name / Email" form. No new RLS needed -- the existing
-- row-level policies on public.profiles already cover these columns too.

alter table public.profiles add column if not exists title text;
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists birthday_month smallint;
alter table public.profiles add column if not exists birthday_day smallint;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists mobile_phone text;
alter table public.profiles add column if not exists interests text;

-- =========================================================
-- 9. RECONCILE WITH THE LIVE COMMERCE SCHEMA
-- =========================================================
-- Discovered 2026-08-21: a "walk me through it" session on Claude.ai
-- had already built a full commerce schema directly on this database
-- via the Supabase CLI (categories, products, product_variants,
-- product_images, product_tags, product_tag_map, product_reviews,
-- promotions, carts, cart_items, order_items), plus a checkout_cart()
-- function that row-locks stock during checkout so two people can't
-- both buy the last unit of something. It's solid, so this section
-- adopts it as-is rather than recreating it, and only fixes two
-- things: (1) admin access already uses profiles.role = 'admin' plus
-- an is_admin() function -- not a separate boolean column, so nothing
-- here adds one; (2) the seed data was demo/placeholder products (a
-- slip dress, an overcoat, a wool trouser) that don't exist in the
-- real catalog -- replaced below with the actual 7 products from
-- lib/products.ts, filed under the categories that already exist
-- (Streetwear, Shirting, Knitwear, Outerwear). The app still reads
-- from lib/products.ts today; nothing here is wired up to the
-- storefront, checkout, or the Stripe webhook yet (see project plan
-- for phases 2+). Safe to re-run.
-- =========================================================

-- product_images predates the isModelShot concept already built into
-- ProductSheet.tsx -- add the two columns it needs.
alter table public.product_images add column if not exists fit text default 'contain' check (fit in ('cover', 'contain'));
alter table public.product_images add column if not exists is_model_shot boolean not null default false;

-- Wipe the demo seed data. Safe: carts, cart_items, order_items and
-- product_reviews are still empty, so nothing real references any of
-- this yet.
delete from public.product_tag_map where product_id in (select id from public.products);
delete from public.product_images where product_id in (select id from public.products);
delete from public.product_variants where product_id in (select id from public.products);
delete from public.product_reviews where product_id in (select id from public.products);
delete from public.products;

-- Real catalog: 7 products, matching lib/products.ts exactly, filed
-- under the categories that already exist on this database.
insert into public.products (slug, name, description, base_price, category_id, status) values
  ('think-graffiti-club-set', 'Think Graffiti Club Set',
   'An oversized graffiti-print tee and matching shorts, cut relaxed and finished with a heavyweight cotton fleece.',
   175.00, (select id from public.categories where slug = 'streetwear'), 'active'),
  ('think-graffiti-club-set-washed', 'Think Graffiti Club Set Washed', null,
   175.00, (select id from public.categories where slug = 'streetwear'), 'active'),
  ('graffiti-think-windbreaker-set', 'Graffiti Think Windbreaker Set', null,
   200.00, (select id from public.categories where slug = 'streetwear'), 'active'),
  ('graffiti-think-windbreaker', 'Graffiti Think WindBreaker',
   'A cobalt blue and jet black colorblock windbreaker jacket and matching shorts, finished with white piping and a THINK graffiti print.',
   200.00, (select id from public.categories where slug = 'streetwear'), 'active'),
  ('oversized-poplin-shirt', 'Oversized Poplin Shirt', null,
   140.00, (select id from public.categories where slug = 'shirting'), 'active'),
  ('ribbed-merino-knit', 'Ribbed Merino Knit', null,
   165.00, (select id from public.categories where slug = 'knitwear'), 'active'),
  ('raw-selvage-coat', 'Raw Selvage Coat', null,
   380.00, (select id from public.categories where slug = 'outerwear'), 'active');

-- Product images (gallery), tagged is_model_shot to match lib/products.ts.
insert into public.product_images (product_id, url, fit, is_model_shot, sort_order)
select p.id, v.url, v.fit, v.is_model_shot, v.sort_order
from public.products p
join (values
  ('think-graffiti-club-set', '/products/think-about-it-set.png', 'cover', true, 0),
  ('think-graffiti-club-set', '/products/Tee.png', 'contain', false, 1),
  ('think-graffiti-club-set', '/products/Shorts.png', 'contain', false, 2),
  ('think-graffiti-club-set-washed', '/products/gray-think.jpg', 'cover', true, 0),
  ('think-graffiti-club-set-washed', '/products/Vintage-washed-tee.jpeg', 'contain', false, 1),
  ('think-graffiti-club-set-washed', '/products/Vintage-washed-shorts.jpg', 'contain', false, 2),
  ('graffiti-think-windbreaker-set', '/products/Graffiti-Think-Windbreaker-Set.jpeg', 'cover', true, 0),
  ('graffiti-think-windbreaker-set', '/products/Front_Graffiti_Think_Windbreaker_Jacket.jpeg', 'contain', false, 1),
  ('graffiti-think-windbreaker-set', '/products/Back_Graffiti_Think_Windbreaker_Jacket.jpeg', 'contain', false, 2),
  ('graffiti-think-windbreaker-set', '/products/Front_Graffiti_Think_Windbreaker_Shorts.jpeg', 'contain', false, 3),
  ('graffiti-think-windbreaker-set', '/products/Back_Graffiti_Think_Windbreaker_Shorts.jpeg', 'contain', false, 4),
  ('graffiti-think-windbreaker', '/products/CGTWS_Cobalt.jpg', 'cover', true, 0),
  ('graffiti-think-windbreaker', '/products/Back_Graffiti_Think_WindBreaker_Jacket_Cobalt.jpg', 'contain', false, 1),
  ('graffiti-think-windbreaker', '/products/Front_Graffiti_Think_Windbreaker_Jacket_Cobalt.jpg', 'contain', false, 2),
  ('graffiti-think-windbreaker', '/products/Front_Graffiti_Think_Windbreaker_Shorts_Cobalt.jpg', 'contain', false, 3),
  ('graffiti-think-windbreaker', '/products/Back_Graffiti_Think_Windbreaker_Shorts_Cobalt.jpg', 'contain', false, 4),
  ('graffiti-think-windbreaker', '/products/CBGTWS_Cobalt.jpg', 'contain', true, 5)
) as v(slug, url, fit, is_model_shot, sort_order)
  on v.slug = p.slug;

-- Variants -- one per size (S/M/L/XL) for every product, placeholder
-- stock of 25 -- adjust to real numbers once this ships. `color` is a
-- required field on this table; only graffiti-think-windbreaker has a
-- named colorway today (Cobalt Blue), so everything else gets
-- 'Standard' as an honest placeholder rather than inventing options
-- that don't exist.
insert into public.product_variants (product_id, size, color, sku, stock_quantity)
select p.id, sz.size,
  case when p.slug = 'graffiti-think-windbreaker' then 'Cobalt Blue' else 'Standard' end,
  upper(replace(p.slug, '-', '_')) || '-' || sz.size,
  25
from public.products p
cross join (values ('S'), ('M'), ('L'), ('XL')) as sz(size);

-- Admin access: the role column + is_admin() function already exist.
update public.profiles set role = 'admin' where email = 'cthomas551@gmail.com';

