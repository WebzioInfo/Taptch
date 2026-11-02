---
name: performance-engineering
description: Performance optimization, k6 load testing, sub-50ms NFC redirect caching, Redis cache-aside patterns, Core Web Vitals, and database indexing. Activate when optimizing latency, conducting load tests, or debugging bottlenecks.
---

# Performance Engineering Skill

## 1. Performance Targets vs. Empirical Measurements
- **Rule 8**: Never claim a performance goal as an achievement without measurement.
- Performance Targets:
  - Public profile LCP: `< 1.1s` on 4G network.
  - NFC redirect latency: `< 50ms` at p95.
  - Concurrency capacity: `100+` authenticated dashboard users, `500+` concurrent profile readers, `1,000` taps in 60 seconds.

## 2. Sub-50ms Redirect Pipeline (`/n/[token]`)
1. **Memory First**: Query Redis key `redirect:token:{token}` (TTL 3600s).
2. **Negative Caching**: If token does not exist in DB, cache sentinel value `__NOT_FOUND__` for 300s to block token brute-force scans from hitting PostgreSQL.
3. **Database Fallback**: If cache miss, query `cards` table with b-tree index on `redirect_token`.
4. **Immediate 302**: Return HTTP 302 redirect with `Cache-Control: private, no-store` and `Location: /p/{slug}?src=nfc`.
5. **Async Ingestion**: Push event payload to BullMQ queue without awaiting persistence.

## 3. Public Profile Static Generation (Zero Dynamic Hot Path)
- Public profile pages (`/p/[slug]`) must NEVER call `cookies()`, `headers()`, or `connection()`.
- Use Incremental Static Regeneration (ISR) with `revalidate = 3600` or on-demand cache revalidation when profile edits are published.

## 4. k6 Load Testing Harness
- Run automated load scenarios using scripts in `load/`:
  - `load/smoke.js`: Baseline sanity check (10 VUs for 30s).
  - `load/conference-spike.js`: 1,000 taps in 60s spike test.

