# Tapzio Specification — 01 Product Overview

> Source: Master Prompt Section 1

## Product Summary
**Tapzio** is an NFC + QR **digital identity and smart-networking SaaS**. A physical card (PVC, metal, wood, custom; later wristbands/keychains/stickers) is only the hardware key. The product is the digital profile engine, contact exchange and lead capture, analytics, team/corporate management, ordering and card operations, billing, and a super-admin control plane. 

- **Initial Product**: NFC Business Card / Personal Card.
- **Scale Target**: Must serve one individual up to thousands of organizations and millions of profile visits.
- **Client / Company**: Webzio Technology.

## Competitor Landscape
Competitors to study: Vertu Cardz (demo: `https://tangerine-chaja-02bf37.netlify.app/`), TapMo, Card Ventures, 1Card, TapOnn, TapSticky, Cloud NFC Cards (ccards.net), Popl, Blinq, Mobilo, HiHello, Linq, V1CE, Uniqode.

### Common Competitor Weaknesses
- Dated cluttered templates.
- Feature-locked tiers for basics.
- Weak or non-existent analytics.
- No lead follow-up CRM workflows.
- No real team/enterprise management console.
- Manual onboarding (e.g. customer sends details on WhatsApp and staff edits static HTML).
- No digital wallet / signature tooling.
- Manual lost-card handling requiring reprinting or manual code rewrites.

### Tapzio Competitive Advantage
We beat competitors on:
1. UI/UX quality & speed (sub-second LCP, zero jank).
2. Deep schema-driven profile customization with versioning and draft rollbacks.
3. Automated end-to-end operations (inventory, unguessable redirect tokens, encoding CLI station).
4. Robust enterprise controls (SSO, role-based access, CSV employee onboarding, brand-lock).
5. Built-in lead capture pipeline with consent, notifications, and export.

## Feature Parity Checklist
Every profile must support the following parity features:
1. Display image & cover banner
2. Name, designation, company name & logo
3. Rich bio / executive summary
4. Primary & alternative mobile numbers
5. WhatsApp button with prefilled message
6. Email addresses (primary, work, support)
7. Website links
8. Physical address with integrated Google Maps directions
9. Social links (Instagram, Facebook, LinkedIn, YouTube, X, Pinterest, Threads, Telegram, GitHub, Custom)
10. Save Contact button (vCard 3.0 / 4.0 with embedded compressed photo)
11. Exchange Contact modal (lead capture with explicit consent)
12. Company overview block
13. Image gallery with lightbox
14. Google Business location integration
15. Google Review link with call to action
16. Product catalogue (SKU, pricing, enquiry link, purchase link)
17. Service catalogue (details, booking button, enquiry)
18. Downloadable brochure (PDF download + embedded flip-book view)
19. Embedded YouTube / Vimeo videos
20. UPI payment link and dynamic QR code (Google Pay, PhonePe, Paytm, BHIM)
21. Appointment / booking link (Calendly, Cal.com, custom)
22. Client testimonials slider
23. Documents & certifications list
24. Multiple swappable design templates without data loss
25. Multilingual profile support (e.g. English, Hindi, Malayalam, Arabic)
26. High-contrast QR code modal with download & print export
27. Quick share link modal (SMS, WhatsApp, Native Web Share)
28. Unlimited taps & views
29. Instant real-time updates without card reprinting or chip rewriting
30. Multi-business profile (up to N businesses under one subscription/profile)
31. Bespoke custom-branded styling
32. NFC "How to tap" guidance overlay (iPhone top-front, Android sensor position, iOS 13+ background tag reading, Android NFC settings)

