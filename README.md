# Sunrise

Vite + React + Tailwind + shadcn/ui on the frontend. Express + TypeScript, Drizzle ORM, and Neon Postgres on the backend. One Vercel project serves both.

## Stack

- **Web**: Vite, React, Tailwind CSS, shadcn/ui
- **API**: Express, TypeScript
- **Database**: Neon Postgres via Drizzle
- **Deploy**: Vercel Services (`apps/web` + `apps/api`)

## Local development

```bash
cp .env.example .env.local
# set DATABASE_URL to your Neon connection string
npm install
npm run db:push
npm run dev
```

- Web: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001)

The Vite dev server proxies `/api` to Express. Press `d` in the UI to toggle dark mode.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite app and Express API |
| `npm run build` | Builds the frontend |
| `npm run db:push` | Pushes the Drizzle schema to Neon |
| `npm run db:studio` | Opens Drizzle Studio |

## Deploy

The repo is linked as the Vercel project `sunrise`. Production routes `/api/*` to Express and everything else to the Vite app.
