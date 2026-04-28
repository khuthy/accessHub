# AccessHub — Creator Platform

An 18+ creator platform where models post gated content and go live, fans buy tokens and spend them to unlock.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v5 (credentials) |
| ORM | Prisma v5 |
| Database | PostgreSQL (Neon recommended) |
| Live streaming | Mux |
| Payments | PayFast (Phase 2) |

---

## Getting Started

### 1. Get a free PostgreSQL database

Sign up at [neon.tech](https://neon.tech), create a project called `accesshub`, and copy the connection string.

### 2. Configure environment variables

Edit `.env` (Prisma reads this):
```
DATABASE_URL="postgresql://user:password@host/accesshub?sslmode=require"
```

Edit `.env.local` (Next.js reads this at runtime):
```
DATABASE_URL="postgresql://user:password@host/accesshub?sslmode=require"
AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

For Mux (live streaming), get keys at [dashboard.mux.com](https://dashboard.mux.com):
```
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."
```

### 3. Push the database schema

```bash
npm run db:push
```

This creates all tables (Users, Posts, Wallets, etc.) in your Postgres database.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User flows

### Fan
1. Sign up at `/signup` — select **Fan**
2. Get 100 welcome tokens automatically
3. Browse creators at `/fan/browse`
4. Visit a creator's page, unlock content with tokens
5. View wallet + transaction history at `/fan/dashboard`

### Model / Creator
1. Sign up at `/signup` — select **Creator / Model**
2. Land on `/model/dashboard`
3. Edit profile at `/model/profile` (display name, bio, avatar, token price)
4. Upload content at `/model/upload` (paste image/video URL, set token cost)
5. Manage + publish posts at `/model/content`
6. Go live at `/model/live` — paste the RTMP URL + stream key into OBS

---

## Database commands

```bash
npm run db:push       # push schema changes (no migration history)
npm run db:migrate    # create a named migration
npm run db:studio     # open Prisma Studio GUI
npm run db:generate   # regenerate Prisma client after schema changes
```

---

## Project Structure

```
app/
  (auth)/login        Login page
  (auth)/signup       Signup page (fan or model)
  (fan)/browse        Model grid
  (fan)/[slug]        Model public page + unlock flow
  (fan)/dashboard     Token wallet + transaction history
  (model)/dashboard   Model stats + quick actions
  (model)/upload      Create a post
  (model)/content     Manage + publish posts
  (model)/profile     Edit profile
  (model)/live        Go live (Mux)
  api/
    signup            POST — create account
    content           GET/POST — model's posts
    content/[id]      GET/PATCH/DELETE — single post
    unlock            POST — spend tokens to unlock
    tokens            GET — wallet balance + history
    models            GET — all model profiles
    models/me         GET — current model's profile
    models/[slug]     GET/PATCH — model page data
    live/start        POST — create Mux stream + live room
    live/end          POST — end live room
```

---

## Phase 2: PayFast Token Purchases

When ready, add to `.env.local`:
```
PAYFAST_MERCHANT_ID="..."
PAYFAST_MERCHANT_KEY="..."
PAYFAST_PASSPHRASE="..."
```

Token bundles to implement:
- 100 tokens — R10
- 500 tokens — R45
- 1000 tokens — R80

PayFast will POST to `/api/payfast/notify` on payment — credit the fan's wallet there.

---

## Deployment (Vercel + Neon)

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all env vars in Vercel project settings
4. Deploy — Vercel auto-detects Next.js

Your `DATABASE_URL` from Neon works on Vercel out of the box.
