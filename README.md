# D2 Loadout Manager

A Destiny 2 loadout builder and gear browser. View all your characters' equipped gear, vault inventory, subclass builds (aspects/fragments/abilities), and exotic perks — then save and export loadouts to DIM.

## Features

- **Character view** — All 3 characters with equipped weapons, armor, and subclass details
- **Subclass panel** — Super, class/melee/grenade/jump abilities, aspects, and fragments per slot
- **Exotic perks** — Inline display on item cards and in the full item detail modal
- **Armor stats** — Per-piece stat breakdown (Mobility/Resilience/Recovery/Discipline/Intellect/Strength) with tier display
- **Vault browser** — Filter by tier, element, weapon/armor, or search by name
- **Loadout builder** — Snapshot current equipped gear with one click
- **DIM import/export** — Import existing DIM backups, export updated ones
- **Persistent** — Auth tokens and loadouts saved in your browser; no server storage

---

## Setup

### 1. Register a Bungie app (one-time, 2 minutes)

1. Go to [bungie.net/en/Application](https://www.bungie.net/en/Application) and sign in
2. Click **Create New App**
3. Fill in:
   - **Application Name**: anything (e.g. "D2 Loadout Manager")
   - **Website**: your Vercel URL (e.g. `https://your-app.vercel.app`) — or `http://localhost:5173` for local dev
   - **OAuth Client Type**: **Confidential**
   - **Redirect URL**: `https://your-app.vercel.app/auth/callback` (and `http://localhost:5173/auth/callback` for dev — add both)
   - **Scope**: check **Read your Destiny 2 game data** and **Move or equip Destiny 2 gear**
4. Click **Create New App** — you'll get your **API Key**, **OAuth client_id**, and **OAuth client_secret**

### 2. Configure environment variables

**For local development**, copy `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
VITE_BUNGIE_API_KEY=your_api_key
VITE_BUNGIE_CLIENT_ID=your_client_id
BUNGIE_CLIENT_SECRET=your_client_secret
```

**For Vercel deployment**, add these in your Vercel project dashboard under **Settings → Environment Variables**:
- `VITE_BUNGIE_API_KEY` — your API key
- `VITE_BUNGIE_CLIENT_ID` — your OAuth client ID
- `BUNGIE_CLIENT_SECRET` — your OAuth client secret (kept server-side, never sent to browser)

### 3. Run locally

```bash
npm install
npx vercel dev    # runs both Vite + Vercel API routes together
```

Or without Vercel CLI (OAuth won't work, but UI does):
```bash
npm run dev
```

---

## Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Follow the prompts. Then set the environment variables in the Vercel dashboard.

Share the deployed URL in Discord — friends click the link and sign in with their own Bungie account. Each person sees their own characters and vault.

---

## Share with friends

Once deployed, just send the link. Each person:
1. Clicks the link
2. Clicks "Sign in with Bungie.net"
3. Authorizes the app on bungie.net
4. Gets redirected back and sees their own characters

No installs. No downloads. Works on any device.

---

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS (dark Destiny-themed)
- Zustand (auth + app state, persisted to localStorage)
- TanStack Query (data fetching)
- IndexedDB via `idb` (Destiny manifest cache — ~50MB, cached after first load)
- Vercel serverless functions (OAuth token exchange, keeps client_secret server-side)
