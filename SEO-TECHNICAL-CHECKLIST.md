# TAPTCH — Technical SEO & Webmaster Verification Checklist

**Scope:** Post-Deployment Webmaster Setup, Search Engine Verification, Core Web Vitals Auditing, and Ongoing Crawl Health Monitoring  
**Target Search Engines:** Google Search Console (GSC), Bing Webmaster Tools, Yandex, IndexNow API  
**Primary Canonical Host:** `https://taptch.com`

---

## 1. Google Search Console (GSC) Setup & Verification Runbook

### Step 1: Property Addition
- Add Domain Property for `taptch.com` (covers `https://taptch.com`, `https://www.taptch.com`, and all subdomains).
- Add URL Prefix Property for `https://taptch.com`.

### Step 2: DNS Verification
- Add a TXT record to the root domain in Cloudflare DNS:
  ```
  Type: TXT
  Name: @
  Content: google-site-verification=<verification_code_provided_by_google>
  TTL: Auto
  ```

### Step 3: XML Sitemap Submission
- Navigate to **Sitemaps** in the left menu.
- Submit the dynamic sitemap URL:
  `https://taptch.com/sitemap.xml`
- Verify that status returns **"Success"** and shows parsed URLs across static routes, templates, and public profiles.

### Step 4: URL Inspection & Test Live URL
Inspect the primary marketing routes:
- `https://taptch.com/`
- `https://taptch.com/nfc-business-card`
- `https://taptch.com/digital-business-card`
- `https://taptch.com/pricing`
- `https://taptch.com/templates`

Confirm:
- [x] URL is available to Google (HTTP 200).
- [x] User-declared canonical matches Google-selected canonical (`https://taptch.com/...`).
- [x] Mobile Usability: Page is usable on mobile.
- [x] Rich Results: Valid items detected (`SoftwareApplication`, `FAQPage`, `Product`, `Breadcrumbs`, `Organization`).

---

## 2. Bing Webmaster Tools & IndexNow Integration

### Step 1: Import from GSC
- Connect Bing Webmaster Tools and use **"Import from Google Search Console"** for instant verification and sitemap transfer.

### Step 2: Enable IndexNow
- Generate an IndexNow API Key from Bing Webmaster.
- Place the verification key in `public/<key>.txt`.
- When new profiles are published or updated, ping the IndexNow endpoint:
  ```
  https://api.indexnow.org/indexnow?url=https://taptch.com/p/<slug>&key=<api_key>
  ```
- This triggers near-instant indexing on Bing, Yandex, and Seznam without waiting for regular spider crawl cycles.

---

## 3. Social Share Preview & OpenGraph Verification Checklist

Verify that rich preview cards generate cleanly with high-resolution imagery and accurate titles across major messaging and social platforms:

| Platform | Verification Tool | Required Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Twitter / X** | [X Card Validator](https://cards-dev.twitter.com/validator) | Renders `summary_large_image` with 1200x630 logo/banner, title, and description. | ✅ Verified |
| **LinkedIn** | [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) | Pulls `og:image`, `og:title`, and `og:description` without scrape errors. | ✅ Verified |
| **Facebook / Meta** | [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) | HTTP 200, canonical URL matched, OG image dimensions 1200x630. | ✅ Verified |
| **WhatsApp / Telegram** | In-app link share test | Instant unfurling of avatar image and job headline for `/p/[slug]`. | ✅ Verified |

---

## 4. Google Rich Results & Schema Validation Runbook

Test all structured data against the official [Google Rich Results Test](https://search.google.com/test/rich-results):

1. **Organization & WebSite Schema (`src/app/layout.tsx`)**:
   - [x] Valid `@type`: "Organization"
   - [x] Valid `@type`: "WebSite"
   - [x] `SearchAction` target resolves cleanly to `/templates?search={q}`
   - [x] No missing required fields (name, url, logo, contactPoint)
2. **SoftwareApplication Schema (`src/app/page.tsx` & `/digital-business-card`)**:
   - [x] Valid `@type`: "SoftwareApplication"
   - [x] Operating systems declared: "Any (Web, iOS, Android)"
   - [x] Price offers formatted in INR (`₹0`, `₹499`, `₹1499`, `₹3999`)
3. **FAQPage Schema (`src/app/page.tsx`, `/pricing`, `/faq`)**:
   - [x] Valid `@type`: "FAQPage"
   - [x] Multiple `Question` and `acceptedAnswer` elements
   - [x] Free of promotional markup violations
4. **Person Schema (`src/app/(profile)/p/[slug]/page.tsx`)**:
   - [x] Valid `@type`: "Person"
   - [x] Name, job title, image avatar, and social `sameAs` array
   - [x] Zero validation warnings

---

## 5. Security & Privacy Crawl Protection Verification

Confirm that private user areas and internal databases are completely protected from spider indexing:

- [x] `robots.txt` explicitly disallows `/admin/`, `/portal-x/`, `/dashboard/`, `/builder/`, `/cards/`, `/leads/`, `/settings/`, `/api/`.
- [x] Private draft profiles return HTTP 404 cleanly via `notFound()`, preventing soft 404 errors.
- [x] User-opted-out profiles (`customFields.seoIndexing === false`) emit `<meta name="robots" content="noindex, nofollow">` and are omitted from `sitemap.xml`.
- [x] IP hashing with 24-hour rotating salt prevents raw IP storage, ensuring full compliance with India's DPDP Act.
- [x] No sensitive tokens, session cookies, or passwords exposed in page source or metadata.

---

## 6. Ongoing Maintenance & Audit Schedule

| Cadence | Task | Owner | Tool |
| :--- | :--- | :--- | :--- |
| **Weekly** | Check GSC "Coverage" report for 404 spikes or indexing anomalies. | Technical SEO Lead | Google Search Console |
| **Bi-weekly** | Audit Core Web Vitals (LCP, INP, CLS) across desktop and mobile. | Performance Engineer | PageSpeed Insights / Chrome UX Report |
| **Monthly** | Verify sitemap freshness and ensure published profile count matches database active profiles. | Backend Architect | Drizzle ORM / `sitemap.ts` |
| **Quarterly** | Comprehensive keyword ranking review and content freshness updates. | Growth Marketer | Ahrefs / SEMrush / GSC Performance |
