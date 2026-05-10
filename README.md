# Forge

A workout tracker I built for myself. Mobile-first PWA for logging gym sessions, tracking weights/reps over time, and keeping things simple.

Live at [forge.erkely.tech](https://forge.erkely.tech)

## What it does

- **Calendar** — Mark workout and rest days, see your training week at a glance
- **Templates** — Create reusable workouts (Push Day, Pull Day, etc.) and start sessions from them
- **Session logging** — Log sets, reps, and weight per exercise during your workout
- **Stats** — Weight progression charts, personal records, volume tracking

## Stack

- Next.js 16 + React 19
- Tailwind CSS + shadcn/ui
- Cloudflare Workers + D1 (SQLite) + R2
- Drizzle ORM
- Auth.js (Google OAuth)
- TanStack Query for data fetching
- PWA with offline support

## Dev setup

```bash
pnpm install
pnpm dev
```

Needs a `.env.local` with:

```
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

Database migrations:

```bash
pnpm db:generate   # generate migration from schema changes
pnpm db:migrate     # apply migrations locally
```

## Deploy

```bash
pnpm deploy
```

Deploys to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).
