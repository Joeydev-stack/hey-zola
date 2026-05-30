# OLLI — Claude Code Onboarding Briefing
> Provide this file to Claude Code at the start of every session.

---

## 🧠 Who You Are (Working Relationship)
- You are **Nova**, the AI co-builder for Olli.
- The founder is **Joey Fernandez**, sole builder, operating under **BIEY SYSTEMS LLC** (formed March 26, 2026, Georgia).
- Be direct, technical, and collaborative. Joey moves fast — match his pace.

---

## 🗺️ What Olli Is
**Olli** is an AI-powered local discovery PWA at **getolliapp.com**.

Users type a vibe in plain English (e.g., "cozy rainy day with coffee and vinyl") and get a full-day itinerary with real venues, photos, ratings, and maps. No dropdowns, no filters — just natural language.

**Core promise:** "A local friend in every city."

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML / CSS / Vanilla JS (single `index.html`) |
| Backend | Vercel Serverless Function (`api/olli-ai.js`) |
| Auth & DB | Supabase (Google OAuth + email) |
| AI | Anthropic Claude API (Sonnet for itinerary, Haiku planned for classification) |
| Places | Google Places API (New) + Google Geocoding API |
| Maps | Static Google Maps snapshots → links to native maps app |
| Email | Beehiiv |
| Hosting | Vercel |
| Domain | getolliapp.com (registered on GoDaddy, DNS pointed to Vercel) |

---

## 📁 File Structure (GitHub Repo)

```
/ (root)
├── index.html          ← Main app (landing page + PWA shell)
├── pricing.html        ← Pricing / Olli Pro page
├── api/
│   └── olli-ai.js      ← Vercel serverless function (ALL backend logic)
├── olli-reading.png    ← Mascot asset
├── olli-building.png   ← Mascot asset
├── olli-searching.png  ← Mascot asset
├── olli-map.png        ← Mascot asset
└── manifest.json       ← PWA manifest
```

**GitHub Org:** `getolliapp`
**Repo name:** `hey-zola` (private)
**Vercel project:** `admin-78742178s-projects/hey-zola`

---

## 🔐 Environment Variables (set in Vercel)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API for itinerary generation |
| `GOOGLE_PLACES_API_KEY` | Places search + Geocoding (backend only — never exposed to browser) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |

> ⚠️ The Google Places API key is restricted to the Vercel backend only. Geocoding was intentionally moved to the backend to keep this key off the frontend.

---

## 🎨 Brand System

| Token | Color | Use |
|---|---|---|
| Olli Orange | `#FF6B35` | Primary CTA, accents |
| Olli Sun | `#FFB800` | Secondary highlights |
| Olli Teal | `#00B4A6` | Links, interactive |
| Olli Night | `#1A1A2E` | Dark backgrounds |
| Olli Lime | `#C8F000` | Pop accents |

**Fonts:** Syne (headings) + DM Sans (body) — loaded via Google Fonts

**Mascot:** Olli is a map pin character with a beanie and camera bag. 4 poses exist as PNG assets (reading, building, searching, map).

---

## 🗃️ Supabase Schema

**`searches` table**
```
id, user_id, city, vibe, title, stops (jsonb), mood_tags (jsonb), created_at
```

**`favorites` table**
```
id, user_id, place_name, address, rating, maps_url, photo_url, city, type, created_at
```

RLS policies are active — users can only read/write their own rows.

---

## 🔢 User Tiers (3-Tier System)

| Tier | Searches | Auth Required |
|---|---|---|
| Guest | 1 Instant Magic Search | No |
| Free Account | 3 searches/month | Yes (Google OAuth or email) |
| Olli Pro | Unlimited | Yes |

**Olli Pro pricing:**
- Founders price: **$4.99/month** (active as of May 1, 2026 launch target)
- Regular price: **$7/month**
- Payment: Stripe (under BIEY SYSTEMS LLC — EIN + business bank account needed)

---

## ✅ What's Been Built (Completed)

### Core App
- [x] Natural language vibe input → Claude AI interpretation
- [x] Google Places API integration (real venues, photos, ratings)
- [x] Full-day itinerary generation with stop cards
- [x] Static map snapshots (replaced iframe — no scroll trap)
- [x] Save itinerary to Supabase (authenticated users)
- [x] Favorite individual venues
- [x] Google OAuth sign-in via Supabase
- [x] PWA manifest + installable

### Landing Page (V2)
- [x] 3-tier offer messaging (1 free → 3/mo → unlimited Pro)
- [x] Bento Box grid layout (how it works + use cases)
- [x] Live feed tile with rotating entries + real-time timestamps
- [x] Viral share engine: 1080×1920 canvas share card, `navigator.share` API, confetti celebration
- [x] Nav auth flicker fix (opacity 0 → fade in after Supabase session resolves)
- [x] Olli mascot images embedded in How It Works steps + loading states
- [x] Custom animated cursor (desktop only, pointer:fine guard)
- [x] Body copy italics removed (kept only for vibe examples/quotes)

### Backend Hardening
- [x] Geocoding moved to backend (API key hidden from browser)
- [x] Founder Mandate in Claude system prompt (avoid chains, prioritize local)
- [x] `ctx.roundRect` polyfill for older browsers
- [x] `try/catch` on `signInWithGoogle` and `signOut`
- [x] All legacy `zola` IDs renamed to `olli` (`olliMap`, `olliTip`, `olliTipText`)

### Infrastructure
- [x] Domain `getolliapp.com` connected to Vercel
- [x] All 4 env vars confirmed in Vercel
- [x] Google Places API key domain-restricted
- [x] Supabase Site URL corrected (was localhost, broke Google OAuth)

---

## 🚧 What's Next (Roadmap)

### Immediate — Olli Pro Launch
- [ ] Stripe integration (subscription checkout for Pro tier)
  - Entity: BIEY SYSTEMS LLC
  - Price IDs needed for $4.99/mo and $7/mo
- [ ] Gate unlimited searches behind Pro subscription check
- [ ] Pro badge/indicator in nav when subscribed
- [ ] Upgrade prompt when free user hits search limit

### V2 Landing Page Revamp
- [ ] Search box only above the fold
- [ ] Olli mascot dropdown for nav items
- [ ] Cleaner hero — less copy, more interaction

### Nice to Have (Post-Launch)
- [ ] Seasonal holiday decorations (Christmas, Eid, Lunar New Year, etc.)
- [ ] Olli mascot social media animations
- [ ] Travel Folders (group saved itineraries)
- [ ] Haiku for classification/geocoding (cost optimization)
- [ ] Physical stickers + QR codes for local marketing

---

## 🐛 Known Issues / Watch List
- The `mapsUrl` bug (`3${encodeURIComponent...}`) was identified and reportedly fixed — **verify this is clean in the current `api/olli-ai.js`** before any deployment.
- Mobile scroll trap from iframe maps was resolved by switching to static snapshots — do not reintroduce iframes.
- Duplicate `apple-mobile-web-app-status-bar-style` meta tag was removed — don't add it back.

---

## 📋 Session Logs

### Session — 2026-05-17 (Location Drift Bug)
**Status: Fix written, NOT yet deployed. GitHub is on last known-good version.**

- **Bug diagnosed:** `api/olli-ai.js` was sending Google Places Text Search queries with no geographic bounds, causing results to sometimes return venues from the wrong city.
- **Fix written:** Added a geocoding step to convert the city name to lat/lng coordinates, then appended `&location=lat,lng&radius=50000` to every Places search call — pins results to a 50km radius around the correct city.
- **Deployment failed:** Two paste attempts into the GitHub web editor both caused `SyntaxError: Invalid or unexpected token` due to character corruption (backtick/quote mangling by the browser editor).
- **Reverted:** GitHub repo restored to last known-good state. App is live and functional but location fix is NOT live.
- **Fix is ready:** The corrected `api/olli-ai.js` exists in Joey's local master code folder.

**⚠️ FIRST PRIORITY next session: Deploy the location fix.**
- Use Claude Code (terminal) to apply and push the fix — do NOT use GitHub web editor
- Use string concatenation syntax instead of backtick template literals for the new lines to avoid any paste corruption risk
- After pushing, verify on Vercel that the deployment succeeds and test a search for a non-US city

---

### Session — 2026-05-30 (CSS Cleanup)
**Status: Complete. Deployed to production.**

- **Task:** Add `.pricing-card-annual .pricing-per { color: rgba(255,255,255,0.45); }` to `index.html` directly after the `.pricing-card-pro .pricing-per` rule (~line 1015).
- **Issue found:** The rule already existed at line 962 (inside the `.pricing-card-annual` style block). Adding it again created a duplicate.
- **Fix:** Removed the duplicate at line 1016. The canonical rule at line 962 remains.
- **Commits:** `dedcb1f` (add rule), `0518d2c` (remove duplicate) — both deployed and verified live on `getolliapp.com`.
- **Note:** When adding CSS rules, always grep the file first to check if the rule already exists before inserting.

---

## 📣 Marketing Context
- Soft launched March 26, 2026 on Facebook → 20 unique visitors, 61 page views in 24 hours
- Reddit posts: r/SideProject, r/travel, r/Atlanta
- X thread: 7 tweets
- Analytics peak: 80 unique visitors / 283 page views over first 7 days, traffic from 5 countries
- Supabase: 3 signed-up users, 12 saved itineraries (as of late March 2026)
- Instagram + X handles: `@getolliapp`

---

## 🤝 Session Startup Checklist (for Claude Code)
1. Read this briefing fully before touching any code.
2. Pull latest from GitHub (`getolliapp/hey-zola`) — that is the source of truth.
3. Verify the `mapsUrl` line in `api/olli-ai.js` is clean (no leading `3`).
4. Confirm all 4 env vars are present in `.env.local` for local dev.
5. **Check Session Logs above** — the location drift fix is written and ready to deploy. That is priority #1 unless Joey says otherwise.
6. Ask Joey what the session goal is — then execute.
