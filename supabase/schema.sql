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

-- The storefront's existing filter/label copy says "Short Set," not
-- "Streetwear" -- rename rather than change user-facing copy to match
-- the taxonomy.
update public.categories set name = 'Short Set', slug = 'short-set' where slug = 'streetwear';

-- Real catalog: 7 products, matching lib/products.ts exactly, filed
-- under the categories that already exist on this database. Uses
-- on conflict do nothing (not delete-and-reinsert) so ids stay stable
-- once created -- phase 2 makes favorites.product_id a real foreign
-- key into this table, so re-running this file must never orphan a
-- real user's saved items or reset stock an admin has since adjusted.
insert into public.products (slug, name, description, base_price, category_id, status) values
  ('think-graffiti-club-set', 'Think Graffiti Club Set',
   'An oversized graffiti-print tee and matching shorts, cut relaxed and finished with a heavyweight cotton fleece.',
   175.00, (select id from public.categories where slug = 'short-set'), 'active'),
  ('think-graffiti-club-set-washed', 'Think Graffiti Club Set Washed', null,
   175.00, (select id from public.categories where slug = 'short-set'), 'active'),
  ('graffiti-think-windbreaker-set', 'Graffiti Think Windbreaker Set', null,
   200.00, (select id from public.categories where slug = 'short-set'), 'active'),
  ('graffiti-think-windbreaker', 'Graffiti Think WindBreaker',
   'A cobalt blue and jet black colorblock windbreaker jacket and matching shorts, finished with white piping and a THINK graffiti print.',
   200.00, (select id from public.categories where slug = 'short-set'), 'active'),
  ('oversized-poplin-shirt', 'Oversized Poplin Shirt', null,
   140.00, (select id from public.categories where slug = 'shirting'), 'active'),
  ('ribbed-merino-knit', 'Ribbed Merino Knit', null,
   165.00, (select id from public.categories where slug = 'knitwear'), 'active'),
  ('raw-selvage-coat', 'Raw Selvage Coat', null,
   380.00, (select id from public.categories where slug = 'outerwear'), 'active')
on conflict (slug) do nothing;

-- Product images (gallery), tagged is_model_shot to match lib/products.ts.
-- Guarded by "no images yet" rather than a unique constraint, since
-- nothing downstream references product_images.id -- safe to just skip
-- a product that's already been seeded.
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
  on v.slug = p.slug
where not exists (select 1 from public.product_images pi where pi.product_id = p.id);

-- Variants -- one per size (S/M/L/XL) for every product, placeholder
-- stock of 25 -- adjust to real numbers once this ships. `color` is a
-- required field on this table; only graffiti-think-windbreaker has a
-- named colorway today (Cobalt Blue), so everything else gets
-- 'Standard' as an honest placeholder rather than inventing options
-- that don't exist. on conflict do nothing for the same id-stability
-- reason as products above.
insert into public.product_variants (product_id, size, color, sku, stock_quantity)
select p.id, sz.size,
  case when p.slug = 'graffiti-think-windbreaker' then 'Cobalt Blue' else 'Standard' end,
  upper(replace(p.slug, '-', '_')) || '-' || sz.size,
  25
from public.products p
cross join (values ('S'), ('M'), ('L'), ('XL')) as sz(size)
on conflict (sku) do nothing;

-- Admin access: the role column + is_admin() function already exist.
update public.profiles set role = 'admin' where email = 'cthomas551@gmail.com';

-- =========================================================
-- 10. WIRE THE STOREFRONT TO THE DATABASE (phase 2 prep)
-- =========================================================
-- Two display fields the storefront needs have no home in the schema
-- yet -- `tone` (a hex fallback color shown behind products with no
-- photo) and `details` (the Fabric/Fit/Care list) -- add them and
-- backfill from lib/products.ts so nothing regresses once the app
-- reads from here instead of that file. Also migrates
-- favorites.product_id from the old lib/products.ts string ids
-- ("p0".."p6") to a real uuid foreign key into products, now that the
-- app is about to start relying on it. Safe to re-run.
-- =========================================================

alter table public.products add column if not exists tone text;
alter table public.products add column if not exists details jsonb;

update public.products set tone = '#E7E4DC' where slug = 'think-graffiti-club-set';
update public.products set tone = '#E7E4DC' where slug = 'think-graffiti-club-set-washed';
update public.products set tone = '#EEEBE4' where slug = 'graffiti-think-windbreaker-set';
update public.products set tone = '#E2DED3' where slug = 'graffiti-think-windbreaker';
update public.products set tone = '#EBE8E1' where slug = 'oversized-poplin-shirt';
update public.products set tone = '#DFDBCF' where slug = 'ribbed-merino-knit';
update public.products set tone = '#E9E6DE' where slug = 'raw-selvage-coat';

update public.products
set details = '[
  {"label": "Fabric", "value": "100% cotton fleece"},
  {"label": "Fit", "value": "Oversized"},
  {"label": "Care", "value": "Machine wash cold"}
]'::jsonb
where slug = 'think-graffiti-club-set';

-- favorites.product_id: migrate from the old lib/products.ts string
-- ids to the real product uuids, then lock the column down to a
-- proper foreign key. Guarded so this only ever runs once -- once the
-- column is uuid, re-running this file is a no-op here.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'favorites'
      and column_name = 'product_id' and data_type = 'text'
  ) then
    update public.favorites f set product_id = p.id::text
    from public.products p
    where (f.product_id, p.slug) in (
      ('p0', 'think-graffiti-club-set'),
      ('p1', 'think-graffiti-club-set-washed'),
      ('p2', 'graffiti-think-windbreaker-set'),
      ('p3', 'graffiti-think-windbreaker'),
      ('p4', 'oversized-poplin-shirt'),
      ('p5', 'ribbed-merino-knit'),
      ('p6', 'raw-selvage-coat')
    );

    -- Anything left that isn't a mappable old id or an already-valid
    -- uuid can't survive the type change below -- remove it rather
    -- than fail the whole migration. Should be a no-op in practice.
    delete from public.favorites
    where product_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

    alter table public.favorites alter column product_id type uuid using product_id::uuid;
    alter table public.favorites add constraint favorites_product_id_fkey
      foreign key (product_id) references public.products (id) on delete cascade;
  end if;
end $$;

-- =========================================================
-- 11. RECORD ORDER LINE ITEMS AND DECREMENT STOCK (phase 3)
-- =========================================================
-- The Stripe webhook only wrote a bare orders summary row -- it never
-- recorded order_items or touched product_variants.stock_quantity, so
-- stock never actually moved when something sold. record_paid_order()
-- does both atomically, keyed off the Stripe session id so a webhook
-- retry (Stripe delivers at-least-once) can't double-record an order
-- or double-decrement stock. Safe to re-run.
-- =========================================================

alter table public.orders add column if not exists stripe_session_id text unique;

create or replace function public.record_paid_order(
  p_user_id uuid,
  p_stripe_session_id text,
  p_items jsonb -- [{variant_id uuid, quantity int, unit_price numeric}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(10, 2) := 0;
  v_item record;
begin
  select id into v_order_id from public.orders where stripe_session_id = p_stripe_session_id;
  if v_order_id is not null then
    return v_order_id;
  end if;

  select coalesce(sum(x.unit_price * x.quantity), 0) into v_subtotal
  from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity int, unit_price numeric);

  insert into public.orders (user_id, status, subtotal, total, stripe_session_id)
  values (p_user_id, 'pending', v_subtotal, v_subtotal, p_stripe_session_id)
  returning id into v_order_id;

  for v_item in
    select x.variant_id, x.quantity, x.unit_price, p.name as product_name, pv.size, pv.color
    from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity int, unit_price numeric)
    join public.product_variants pv on pv.id = x.variant_id
    join public.products p on p.id = pv.product_id
  loop
    insert into public.order_items (order_id, variant_id, quantity, unit_price, product_name, variant_label)
    values (v_order_id, v_item.variant_id, v_item.quantity, v_item.unit_price, v_item.product_name,
            v_item.size || ' / ' || v_item.color);

    -- Payment already succeeded by the time this runs -- floor at 0
    -- instead of rejecting, since the order can't be un-charged here.
    update public.product_variants
    set stock_quantity = greatest(stock_quantity - v_item.quantity, 0)
    where id = v_item.variant_id;
  end loop;

  return v_order_id;
end;
$$;

-- =========================================================
-- 12. CLEAR THE PERSISTED BAG ON PURCHASE (phase 4)
-- =========================================================
-- Phase 4 persists the shopping bag to carts/cart_items for logged-in
-- users. Once record_paid_order() confirms a purchase, the items that
-- were just bought shouldn't still be sitting in the user's saved bag
-- next time they visit -- clear it here, server-side, so it's correct
-- no matter which device/tab completed checkout. Redeclares the whole
-- function (CREATE OR REPLACE can't patch just one line) -- identical
-- to section 11's version except for the delete at the end.
-- =========================================================

create or replace function public.record_paid_order(
  p_user_id uuid,
  p_stripe_session_id text,
  p_items jsonb -- [{variant_id uuid, quantity int, unit_price numeric}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(10, 2) := 0;
  v_item record;
begin
  select id into v_order_id from public.orders where stripe_session_id = p_stripe_session_id;
  if v_order_id is not null then
    return v_order_id;
  end if;

  select coalesce(sum(x.unit_price * x.quantity), 0) into v_subtotal
  from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity int, unit_price numeric);

  insert into public.orders (user_id, status, subtotal, total, stripe_session_id)
  values (p_user_id, 'pending', v_subtotal, v_subtotal, p_stripe_session_id)
  returning id into v_order_id;

  for v_item in
    select x.variant_id, x.quantity, x.unit_price, p.name as product_name, pv.size, pv.color
    from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity int, unit_price numeric)
    join public.product_variants pv on pv.id = x.variant_id
    join public.products p on p.id = pv.product_id
  loop
    insert into public.order_items (order_id, variant_id, quantity, unit_price, product_name, variant_label)
    values (v_order_id, v_item.variant_id, v_item.quantity, v_item.unit_price, v_item.product_name,
            v_item.size || ' / ' || v_item.color);

    update public.product_variants
    set stock_quantity = greatest(stock_quantity - v_item.quantity, 0)
    where id = v_item.variant_id;
  end loop;

  delete from public.cart_items
  where cart_id = (select id from public.carts where user_id = p_user_id);

  return v_order_id;
end;
$$;

-- =========================================================
-- 13. PROMO CODES AT CHECKOUT (phase 5)
-- =========================================================
-- Adds promo code support to record_paid_order() -- redeclared once
-- more, identical to section 12's version except for the two new
-- optional params. The discount amount is passed in from the webhook
-- (recovered from what Stripe actually charged), not recomputed from
-- promotions here, so the record stays accurate even if a code's
-- value changes between checkout and payment confirmation.
-- times_used only increments here, at payment-confirmation time, so
-- an abandoned checkout never burns a use of a limited code.
--
-- Postgres treats a changed parameter list as a distinct overload, not
-- a replacement -- create or replace alone would leave the old 3-arg
-- version sitting alongside this one instead of retiring it. Drop it
-- explicitly first so there's only ever one record_paid_order.
-- =========================================================

drop function if exists public.record_paid_order(uuid, text, jsonb);

create or replace function public.record_paid_order(
  p_user_id uuid,
  p_stripe_session_id text,
  p_items jsonb, -- [{variant_id uuid, quantity int, unit_price numeric}, ...]
  p_promotion_id uuid default null,
  p_discount_total numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(10, 2) := 0;
  v_item record;
begin
  select id into v_order_id from public.orders where stripe_session_id = p_stripe_session_id;
  if v_order_id is not null then
    return v_order_id;
  end if;

  select coalesce(sum(x.unit_price * x.quantity), 0) into v_subtotal
  from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity int, unit_price numeric);

  insert into public.orders (user_id, status, subtotal, discount_total, total, promotion_id, stripe_session_id)
  values (
    p_user_id, 'pending', v_subtotal, p_discount_total, v_subtotal - p_discount_total,
    p_promotion_id, p_stripe_session_id
  )
  returning id into v_order_id;

  if p_promotion_id is not null then
    update public.promotions set times_used = times_used + 1 where id = p_promotion_id;
  end if;

  for v_item in
    select x.variant_id, x.quantity, x.unit_price, p.name as product_name, pv.size, pv.color
    from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity int, unit_price numeric)
    join public.product_variants pv on pv.id = x.variant_id
    join public.products p on p.id = pv.product_id
  loop
    insert into public.order_items (order_id, variant_id, quantity, unit_price, product_name, variant_label)
    values (v_order_id, v_item.variant_id, v_item.quantity, v_item.unit_price, v_item.product_name,
            v_item.size || ' / ' || v_item.color);

    update public.product_variants
    set stock_quantity = greatest(stock_quantity - v_item.quantity, 0)
    where id = v_item.variant_id;
  end loop;

  delete from public.cart_items
  where cart_id = (select id from public.carts where user_id = p_user_id);

  return v_order_id;
end;
$$;

