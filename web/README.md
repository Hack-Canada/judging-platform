This is the web app for the hackathon judging platform.

## Getting Started

Install dependencies and run the development server:

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Supabase (Postgres + Realtime)

The app can use [Supabase](https://supabase.com) as a Postgres database with realtime updates.

### 1. Environment variables

Create a `.env.local` file inside the `web` folder and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project under **Project Settings → API**.

### 2. Minimal `projects` table

In your Supabase SQL editor, create a minimal `projects` table:

```sql
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'Active',
  track text not null default 'General',
  created_at timestamptz not null default now()
);
```

Then, in the Supabase dashboard, enable **Realtime** for the `public` schema or just the `projects` table so that inserts/updates/deletes can be streamed to the app.

### 3. Realtime example

The plan for this repo includes a small example page under the dashboard that:

- Fetches `projects` from Supabase on load.
- Subscribes to Postgres changes on the `projects` table.
- Updates the UI whenever projects are inserted, updated, or deleted.

Supabase is currently an optional enhancement; the rest of the app can continue to use local/lib data if Supabase is not configured.
