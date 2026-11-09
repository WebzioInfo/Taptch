# TAPTCH — Safe Domain Migration & 301 Permanent Redirect Runbook

**Document Version:** 1.0.0  
**Target Date:** Production Deployment  
**Source Host (Current Staging/SaaS Host):** `https://taptch.webziotech.in`  
**Target Canonical Public Domain:** `https://taptch.com`  
**Secondary Vanity Host:** `https://www.taptch.com`  
**Objective:** Consolidate all search equity, backlink signals, and traffic into `https://taptch.com` without duplicate content penalties, ranking drops, or user session disruption.

---

## 1. Domain Topology & Architecture

To avoid search engines indexing duplicate copies of marketing pages or digital profiles across subdomains:

```
[ https://www.taptch.com ] --------( 301 Permanent Redirect )-------> [ https://taptch.com ]
                                                                             ▲
[ https://taptch.webziotech.in/marketing-routes ] --( 301 Redirect )--------+
                                                                             |
[ https://taptch.webziotech.in/app-routes ] ---------( Direct Access )-------+ (SaaS Application)
```

1. **`https://taptch.com`**: The sole authoritative canonical host for all public marketing, templates, pricing, and public digital identity profiles (`/p/[slug]`).
2. **`https://www.taptch.com`**: Unconditional edge 301 redirect to apex `https://taptch.com`.
3. **`https://taptch.webziotech.in`**: Serves as the application host for authenticated workflows (`/dashboard`, `/builder`, `/admin`), with all public marketing and profile requests permanently redirected (301) to `https://taptch.com`.

---

## 2. 301 Permanent Redirect Mapping Matrix

Every incoming request on secondary domains must map 1:1 to the corresponding canonical path on `https://taptch.com`:

| Inbound URL (Source) | Redirect Status | Target Canonical URL |
| :--- | :--- | :--- |
| `https://www.taptch.com/` | `301 Permanent` | `https://taptch.com/` |
| `https://www.taptch.com/*` | `301 Permanent` | `https://taptch.com/*` |
| `http://taptch.com/*` | `301 Permanent` (HTTPS Upgrade) | `https://taptch.com/*` |
| `https://taptch.webziotech.in/` | `301 Permanent` | `https://taptch.com/` |
| `https://taptch.webziotech.in/nfc-business-card` | `301 Permanent` | `https://taptch.com/nfc-business-card` |
| `https://taptch.webziotech.in/digital-business-card` | `301 Permanent` | `https://taptch.com/digital-business-card` |
| `https://taptch.webziotech.in/pricing` | `301 Permanent` | `https://taptch.com/pricing` |
| `https://taptch.webziotech.in/features` | `301 Permanent` | `https://taptch.com/features` |
| `https://taptch.webziotech.in/how-it-works` | `301 Permanent` | `https://taptch.com/how-it-works` |
| `https://taptch.webziotech.in/faq` | `301 Permanent` | `https://taptch.com/faq` |
| `https://taptch.webziotech.in/about` | `301 Permanent` | `https://taptch.com/about` |
| `https://taptch.webziotech.in/contact` | `301 Permanent` | `https://taptch.com/contact` |
| `https://taptch.webziotech.in/templates` | `301 Permanent` | `https://taptch.com/templates` |
| `https://taptch.webziotech.in/templates/:id` | `301 Permanent` | `https://taptch.com/templates/:id` |
| `https://taptch.webziotech.in/campaigns/instagram-card` | `301 Permanent` | `https://taptch.com/campaigns/instagram-card` |
| `https://taptch.webziotech.in/p/:slug` | `301 Permanent` | `https://taptch.com/p/:slug` |
| `https://taptch.webziotech.in/login` | `Preserve (No Redirect)` | `https://taptch.webziotech.in/login` (or unified) |
| `https://taptch.webziotech.in/dashboard/*` | `Preserve (No Redirect)` | `https://taptch.webziotech.in/dashboard/*` |
| `https://taptch.webziotech.in/admin/*` | `Preserve (No Redirect)` | `https://taptch.webziotech.in/admin/*` |

---

## 3. Cloudflare Edge Redirect Configuration

To ensure redirect execution occurs at the CDN edge with sub-10ms latency before hitting application servers:

### Rule 1: Apex Domain Normalization (WWW to Apex)
* **Rule Name:** `TAPTCH - WWW to Apex Redirect`
* **Trigger Condition:** `(http.host eq "www.taptch.com")`
* **Action:** Dynamic URL Redirect
* **Status Code:** `301 Moved Permanently`
* **Target Expression:** `concat("https://taptch.com", http.request.uri.path)`

### Rule 2: Webziotech Marketing Path Migration
* **Rule Name:** `TAPTCH - Subdomain Public Path Migration`
* **Trigger Condition:**
  ```
  (http.host eq "taptch.webziotech.in" and (
    http.request.uri.path eq "/" or
    starts_with(http.request.uri.path, "/nfc-business-card") or
    starts_with(http.request.uri.path, "/digital-business-card") or
    starts_with(http.request.uri.path, "/pricing") or
    starts_with(http.request.uri.path, "/features") or
    starts_with(http.request.uri.path, "/how-it-works") or
    starts_with(http.request.uri.path, "/faq") or
    starts_with(http.request.uri.path, "/about") or
    starts_with(http.request.uri.path, "/contact") or
    starts_with(http.request.uri.path, "/templates") or
    starts_with(http.request.uri.path, "/campaigns") or
    starts_with(http.request.uri.path, "/p/")
  ))
  ```
* **Action:** Dynamic URL Redirect
* **Status Code:** `301 Moved Permanently`
* **Target Expression:** `concat("https://taptch.com", http.request.uri.path)`

---

## 4. Google Search Console Migration Protocol

When transitioning the primary indexing property in Google Search Console:

1. **Verify Both Properties**: Ensure both `https://taptch.webziotech.in` and `https://taptch.com` are verified properties in the same Google Search Console account.
2. **Execute 301 Redirects**: Activate the Cloudflare Edge redirect rules outlined above.
3. **Submit Updated Sitemaps**: Submit `https://taptch.com/sitemap.xml` in the `taptch.com` property.
4. **Initiate Change of Address (if full subdomain migration)**:
   - In GSC property settings for `taptch.webziotech.in`, open **Change of Address**.
   - Select the new domain `https://taptch.com`.
   - Run the pre-validation check (Google verifies that 301 redirects are working).
   - Submit the change of address request.
5. **Monitor Coverage & Search Performance**:
   - Track the indexed URL count decline on `taptch.webziotech.in`.
   - Track the indexed URL count increase on `taptch.com`.
   - Ensure zero 5xx server errors or broken redirect chains.

---

## 5. Rollback & Emergency Contingency Plan

If an unexpected edge routing failure occurs during domain cutover:
1. **Cloudflare Rule Bypass**: In Cloudflare dashboard, toggle the `TAPTCH - Subdomain Public Path Migration` rule to **Disabled**. This immediately allows traffic to hit `taptch.webziotech.in` directly within 10 seconds.
2. **DNS Health Check**: Verify that `taptch.com` A/CNAME records resolve to the production Vercel/VPS IP addresses.
3. **Log Analysis**: Check Pino application logs and Cloudflare Analytics for any 301 loop detections or unexpected 404 spikes.
