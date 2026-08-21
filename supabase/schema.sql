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
-- Nothing writes to this table yet -- checkout goes straight to Stripe
-- and doesn't record a row here. This is the schema + read policy so
-- the Orders tab has somewhere real to read from once that's wired up
-- (e.g. from a Stripe webhook using the service_role key).

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
