# coda
PWA for creating, viewing and sharing song chords with lyrics

## Setup

### Supabase

This app uses [Supabase](https://supabase.com/) for authentication and data storage.

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
3. Follow `/docs/supabase-setup.md` to configure Google OAuth, schema, and RLS policies.

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```
