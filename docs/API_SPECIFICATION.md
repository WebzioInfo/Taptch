# Taptch — REST API Specification (v1)
## Realigned API for Template Marketplace, Profile Creation & Multi-Business Networking

**Product:** Taptch  
**Platform Owner:** Webzio Technology  
**Base URL:** `https://Taptch.com/api/v1`  
**Document Version:** 2.0 (Product Vision Realignment)  
**Status:** Approved & Authoritative

---

## 1. Overview & Response Envelope

All API endpoints return a standardized, predictable envelope:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;       // e.g. "UNAUTHORIZED", "ENTITLEMENT_EXCEEDED", "VALIDATION_FAILED"
    message: string;    // Human-readable diagnostic message
    details?: unknown;  // Field-level validation breakdown
  } | null;
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    hasMore?: boolean;
    requestId?: string;
  };
}
```

---

## 2. Template Gallery & Marketplace Endpoints

### 2.1 List Templates
- **Endpoint**: `GET /api/v1/templates`
- **Access**: Public
- **Query Parameters**:
  - `category`: string (e.g. `personal`, `business`, `corporate`, `creative`, `tech`)
  - `profileType`: string (`personal` | `business`)
  - `planId`: string (`nano`, `micro`, `mini`, `max`)
  - `featured`: boolean
  - `search`: string
- **Response `data`**: Array of Template objects with thumbnails, supported modes, and description.

### 2.2 Get Template Details & Schema
- **Endpoint**: `GET /api/v1/templates/{id}`
- **Access**: Public
- **Response `data`**: Complete template structure, default color palette, font styles, section layout presets.

---

## 3. Digital Profile Management Endpoints

### 3.1 List User Profiles
- **Endpoint**: `GET /api/v1/profiles`
- **Access**: Authenticated User
- **Response `data`**: Array of user profiles with status (`draft` | `published`), template, and linked businesses.

### 3.2 Create Digital Profile
- **Endpoint**: `POST /api/v1/profiles`
- **Access**: Authenticated User (Subject to `max_profiles` plan entitlement)
- **Request Body**:
  ```json
  {
    "profileType": "personal", // or "business"
    "slug": "johnmathew",
    "displayName": "John Mathew",
    "headline": "Managing Director & Tech Investor",
    "templateId": "obsidian-luxury"
  }
  ```
- **Response**: `201 Created` with new profile object.

### 3.3 Update Profile Draft & Styling
- **Endpoint**: `PATCH /api/v1/profiles/{id}`
- **Access**: Profile Owner
- **Request Body**:
  ```json
  {
    "displayName": "John Mathew",
    "headline": "Angel Investor & Founder",
    "bio": "Serial entrepreneur building next-gen tech.",
    "avatarUrl": "https://cdn.Taptch.com/avatars/user_1.png",
    "coverUrl": "https://cdn.Taptch.com/covers/user_1.png",
    "templateId": "obsidian-luxury",
    "themeConfig": {
      "primaryColor": "#D4AF37",
      "fontFamily": "Plus Jakarta Sans",
      "buttonStyle": "gold-gradient",
      "borderRadius": "12px"
    }
  }
  ```

### 3.4 Publish Profile (Promote to Live Snapshot)
- **Endpoint**: `POST /api/v1/profiles/{id}/publish`
- **Access**: Profile Owner
- **Description**: Validates all sections against active plan entitlements, compiles pre-rendered static snapshot, flushes Redis cache, and sets `status = 'published'`.

---

## 4. Multi-Business Association Endpoints (Personal Profiles)

### 4.1 Add Associated Business
- **Endpoint**: `POST /api/v1/profiles/{id}/businesses`
- **Access**: Profile Owner (Subject to `max_businesses` entitlement)
- **Request Body**:
  ```json
  {
    "name": "ABC Technologies",
    "tagline": "Enterprise Cloud Architecture",
    "logoUrl": "https://cdn.Taptch.com/logos/abc.png",
    "description": "Custom enterprise SaaS systems.",
    "website": "https://abctech.in",
    "phone": "+919876543210",
    "whatsapp": "+919876543210",
    "email": "contact@abctech.in",
    "address": "Koramangala, Bengaluru, Karnataka",
    "googleMapsUrl": "https://maps.google.com/..."
  }
  ```

### 4.2 Update Associated Business
- **Endpoint**: `PATCH /api/v1/profiles/{id}/businesses/{businessId}`
- **Access**: Profile Owner

### 4.3 Remove Associated Business
- **Endpoint**: `DELETE /api/v1/profiles/{id}/businesses/{businessId}`
- **Access**: Profile Owner

---

## 5. Catalogue & Section Endpoints

### 5.1 Add Product / Service Catalogue Item
- **Endpoint**: `POST /api/v1/profiles/{id}/catalogue`
- **Access**: Profile Owner (Subject to `max_products` / `max_services` plan entitlement)
- **Request Body**:
  ```json
  {
    "businessId": "biz_abc123", // Optional: links directly to an associated business
    "type": "product",           // "product" or "service"
    "title": "Executive Metal Smart Card",
    "description": "Laser-etched stainless steel card with NFC chip.",
    "price": "₹3,499",
    "currency": "INR",
    "imageUrl": "https://cdn.Taptch.com/products/metal.png",
    "actionUrl": "https://Taptch.com/order",
    "actionLabel": "Order Now"
  }
  ```

### 5.2 Configure Section Order & Visibility
- **Endpoint**: `PUT /api/v1/profiles/{id}/sections`
- **Access**: Profile Owner
- **Request Body**:
  ```json
  {
    "sections": [
      { "sectionType": "identity", "isEnabled": true, "displayOrder": 0 },
      { "sectionType": "contacts", "isEnabled": true, "displayOrder": 1 },
      { "sectionType": "businesses", "isEnabled": true, "displayOrder": 2 },
      { "sectionType": "products", "isEnabled": true, "displayOrder": 3 },
      { "sectionType": "gallery", "isEnabled": false, "displayOrder": 4 }
    ]
  }
  ```

---

## 6. Entitlements & Subscription Endpoints

### 6.1 Check Current User Entitlements
- **Endpoint**: `GET /api/v1/entitlements/me`
- **Access**: Authenticated User
- **Response `data`**:
  ```json
  {
    "planId": "mini",
    "planName": "Mini Plan",
    "limits": {
      "max_profiles": 5,
      "max_businesses": 3,
      "has_gallery": true,
      "max_gallery_images": 15,
      "has_product_catalogue": true,
      "max_products": 10,
      "has_service_catalogue": false,
      "has_brochure_download": false,
      "has_google_review_link": false
    },
    "usage": {
      "profilesCount": 2,
      "businessesCount": 1,
      "productsCount": 4
    }
  }
  ```

---

## 7. Public Edge Redirects & Contact Exchange

### 7.1 NFC Hardware Tap Redirect
- **Endpoint**: `GET /n/{token}`
- **Performance SLA**: < 50ms total response time.
- **Action**: Resolves token in Redis; responds with `HTTP 302` redirect to `/p/{slug}?src=nfc`.

### 7.2 Save Contact (vCard Download)
- **Endpoint**: `GET /api/v1/profiles/{slug}/vcard`
- **Response**: `text/vcard; charset=utf-8` attachment for instant address book import.

### 7.3 Exchange Contact (Lead Capture)
- **Endpoint**: `POST /api/v1/profiles/{slug}/exchange`
- **Rate Limit**: 3 per 10 minutes per IP.
- **Request Body**:
  ```json
  {
    "fullName": "Kavita Rao",
    "phone": "+919876543210",
    "email": "kavita@innovate.in",
    "company": "Innovate Labs",
    "designation": "Head of Partnerships",
    "notes": "Discussed Q1 enterprise rollout",
    "consent": true
  }
  ```
