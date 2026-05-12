# Supabase setup

This project uses Supabase for:

- Google authentication
- Songs data storage (`songs` table)

The app uses a redirect OAuth flow (`signInWithOAuth`) so it works with strict cross-origin isolation headers such as:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

## 1) Create the Supabase project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Copy these values from **Project Settings → API**:
   - Project URL
   - `anon` public key

Set them in `.env.local`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## 2) Configure Google Auth

In Supabase:

1. Open **Authentication → Providers → Google**
2. Enable Google provider
3. Set your Google client ID and secret
4. Add redirect URLs in Supabase and Google console:
   - `http://localhost:5173/` (local dev)
   - `https://<your-domain>/` (production)

This app signs in with redirect to `/`, then Supabase exchanges the OAuth code from the URL.

## 3) Create the `songs` table

Run this SQL in **SQL Editor**:

```sql
create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text default '',
  key text default '',
  album text default '',
  year integer default 0,
  author text default '',
  uploaderId uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  createdAt timestamptz not null default now(),
  modifiedAt timestamptz not null default now(),
  isPublic boolean not null default false,
  isHiddenDMCA boolean not null default false,
  content text not null default ''
);

create index if not exists songs_uploader_id_idx on public.songs (uploaderId);
```

`uploaderId` stores the authenticated Supabase user UUID (`auth.users(id)`), which the frontend normalizes to `user.uid`.

## 4) Enable Row Level Security and policies

Run:

```sql
alter table public.songs enable row level security;

create policy "songs are readable"
on public.songs
for select
using (true);

create policy "users can insert own songs"
on public.songs
for insert
to authenticated
with check (auth.uid() = uploaderId);
```

## 5) Verify locally

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`
4. Sign in with Google
5. Add a song and confirm rows are created in `public.songs`
