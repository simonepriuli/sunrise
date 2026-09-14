# Sunrise

Personal training log for summiting **Monte Adamello** (3,539 m) in **July 2027**. Home shows the countdown and progress. Calendar holds every session. The web app installs as a PWA on your phone.

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

Press `d` to toggle dark mode.

To install on a phone, open the deployed HTTPS URL (or localhost on the same device), then **Share → Add to Home Screen** on iOS, or **Install app** on Android.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite app and Express API |
| `npm run build` | Builds the frontend |
| `npm run db:push` | Pushes the Drizzle schema to Neon |
| `npm run db:studio` | Opens Drizzle Studio |

## Deploy

The repo is linked as the Vercel project `sunrise`. Production routes `/api/*` to Express and everything else to the Vite app.
