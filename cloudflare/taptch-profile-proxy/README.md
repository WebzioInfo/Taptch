# TAPTCH — Cloudflare Worker Public Profile Proxy

Reverse-proxies public profile URLs (`https://taptch.com/{username}`) and required SPA assets to `https://taptch.webziotech.in` while preserving the Coming Soon homepage at `https://taptch.com/`.

## Routing Summary
- **Coming Soon preserved:** `/`, `/style.css`, `/script.js`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/sw.js`
- **Proxied to `https://taptch.webziotech.in`:**
  - `/{username}` (valid non-reserved single-segment usernames, e.g. `/sinan`, `/shareef`)
  - `/assets/*`, `/products/*`, `/manifest.webmanifest`, `/taptch-logo-orange.png`, `/card-matte.png`, `/avatar.svg`
  - Legacy NFC/claim routes: `/p/:key`, `/b/:key`, `/nfc/:token`, `/claim/:token`
- **Not proxied:** `/login`, `/register`, `/dashboard`, `/admin`, `/checkout`, `/orders`, `/api`, etc.

## Deployment (Cloudflare Dashboard or Wrangler)
1. **Via Wrangler CLI:**
   ```bash
   cd cloudflare/taptch-profile-proxy
   npx wrangler login
   npx wrangler deploy
   ```
2. **Via Cloudflare Dashboard:**
   - Go to **Workers & Pages -> Create -> Create Worker** (name: `taptch-profile-proxy`).
   - Paste the compiled JS/TS code from `src/worker.ts` (removing `export` TypeScript types if pasting raw JS, or deploy via Wrangler).
   - Open the Worker's **Settings -> Domains & Routes -> Add -> Route**:
     - `taptch.com/*` (Zone: `taptch.com`)
     - `www.taptch.com/*` (Zone: `taptch.com`)
3. **Future Full Migration:** When Taptch SPA is later deployed directly to `taptch.com`, simply delete/disable those two Worker routes—zero URL or backend changes required.
