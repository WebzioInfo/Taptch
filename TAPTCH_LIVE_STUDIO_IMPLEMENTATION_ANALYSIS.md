# Taptch Live NFC Card Design Studio — Implementation Analysis & Architectural Blueprint

> **System:** Taptch Live NFC Card Design Studio  
> **Authoritative Specification Source:** `SYNCMIE_LIVE_DESIGN_STUDIO_COMPLETE_TECHNICAL_AUDIT.md`  
> **Status:** Code-Level Implementation Analysis  
> **Target Environment:** Taptch Monorepo (`frontend`: React 19 + Vite 6 + Tailwind CSS, `backend`: NestJS 11 + Drizzle ORM + PostgreSQL)

---

## 1. Executive Summary & Purpose

This analysis establishes the architectural extraction and execution blueprint for reproducing the **Syncmie Live Design Studio** within the **Taptch** enterprise ecosystem. The objective is an exact functional reproduction of the audited 2D vector editor, dual-sided card customization workflow, 3D CSS perspective simulator, Three.js WebGL physical card simulator, Cloudinary-backed asset pipeline, and cart/order snapshot manufacturing integrity.

---

## 2. All Audited Components & Responsibilities

The studio reproduces the 11 audited core components with strict separation of concerns:

| # | Component Name | Proposed Location | Primary Responsibility | Input (Props / Store) | Output (State / Events / API) |
|---|---|---|---|---|---|
| 1 | `DesignStudioPage` | `frontend/src/pages/DesignStudioPage.tsx` | Route host, studio lifecycle coordinator, product/template/design resolution, navigation guard | Route params (`productId`, `id`), query params (`productId`, `templateId`, `designId`) | Initializes Zustand store with product, variant, templates, side configs; triggers load |
| 2 | `CanvasStudio` | `frontend/src/components/editor/CanvasStudio.tsx` | Core 2D vector workspace hosting the Fabric.js canvas, viewport scaling, object clip path, guidelines overlay, event listeners | `product: Product`, store subscriptions (`zoom`, `activeSide`, `showGuides`) | Mounts `fabric.Canvas` instance, sets active selection, debounces history push, updates preview cache |
| 3 | `EditorTopBar` | `frontend/src/components/editor/EditorTopBar.tsx` | Top navigation, design title editing, undo/redo, front/back switching, print guides toggle, template reset, autosave status, modal triggers, cart submission | `product: Product`, `selectedVariant: ProductVariant \| null`, `onSelectVariant`, `onOpenPreview`, `onOpenExport` | Updates `designName`, `activeSide`, `showGuides`, triggers cloud save, adds product to cart |
| 4 | `EditorLeftSidebar` | `frontend/src/components/editor/EditorLeftSidebar.tsx` | Multi-tab tool palette: Templates, Text Presets & Typography Catalog, Image Uploads, Background Colors, Elements Library, Brand Artwork & Iconify search, Layers Tree | `templates: Template[]`, `product?: Product \| null` | Inserts text, shapes, SVGs, images to canvas; applies templates; updates canvas background; changes layer ordering/visibility/locking |
| 5 | `EditorRightSidebar` | `frontend/src/components/editor/EditorRightSidebar.tsx` | Contextual object inspector inspecting currently selected Fabric.js element; provides multi-accordion parameter controls | Store subscriptions (`selectedObjectId`, `selectedObjectProps`, `canvas`) | Modifies live Fabric object properties (`fill`, `stroke`, `fontFamily`, `fontSize`, `shadow`, `rx`, `opacity`, `left`, `top`, `angle`) and pushes history |
| 6 | `CardMockupPreview` | `frontend/src/components/editor/CardMockupPreview.tsx` | Real-time physical NFC card modal previewing the active design with CSS 3D perspective, mouse-driven tilt, specular glare, and side flipping | `isOpen: boolean`, `onClose: () => void`, `product: Product`, `selectedVariant: ProductVariant \| null` | Generates offscreen raster previews for unvisited sides; renders tilt |
| 7 | `NfcCard3D` | `frontend/src/components/editor/NfcCard3D.tsx` | Flagship Three.js WebGL physical card simulation with extruded rounded geometry, contactless chip decal, inertia drag rotation, and soft contact shadows | `frontArtworkUrl: string`, `backArtworkUrl: string`, `material?: 'pvc' \| 'metal'`, `cardDimensions` | Interactive WebGL canvas rendering 360° rotational physics and material shaders |
| 8 | `ExportModal` | `frontend/src/components/editor/ExportModal.tsx` | Production print export dialog; generates high-resolution 300 DPI PNGs ($3150 \times 1800\text{ px}$) or exports raw portable design JSON | `isOpen: boolean`, `onClose: () => void`, `product: Product` | Direct browser downloads of print-ready PNG files and portable `.json` files |
| 9 | `AutoRecoveryBanner` | `frontend/src/components/editor/AutoRecoveryBanner.tsx` | Crash resilience banner alerting the user when an unsaved local draft snapshot is found in `localStorage` | `snapshot: RecoverySnapshot`, `onRestore: () => void`, `onDismiss: () => void` | Triggers canvas restoration from snapshot or wipes snapshot from `localStorage` |
| 10 | `UnsavedChangesModal` | `frontend/src/components/editor/UnsavedChangesModal.tsx` | Navigation guard modal triggered when user attempts to leave the studio with uncommitted edits | `isOpen: boolean`, `onSaveAndGoBack: () => Promise<boolean>`, `onDiscardAndGoBack: () => void`, `onCancel: () => void` | Proceeds or resets React Router `useBlocker` transition |
| 11 | `useEditorStore` | `frontend/src/components/editor/useEditorStore.ts` | Centralized Zustand reactive store managing dual-sided history, selections, dirty flags, drafts, and canvas references | N/A | State provider for all editor operations |

---

## 3. Store Structure (`useEditorStore`)

The Zustand store maintains 30-step independent history stacks per side, active selections, dirty flags, and cached drafts:

```typescript
export interface SelectedObjectProperties {
  id?: string;
  name?: string;
  type?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  underline?: boolean;
  linethrough?: boolean;
  charSpacing?: number;
  lineHeight?: number;
  opacity?: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  rx?: number;
  ry?: number;
  isLocked?: boolean;
  shadow?: fabric.Shadow | null;
  shadowConfig?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    preset?: string;
  };
  assetType?: 'brand' | 'monochrome' | 'shape' | 'text' | 'artwork';
}

export interface EditorState {
  // Canvas Instances & Side State
  canvas: fabric.Canvas | null;
  activeSide: 'front' | 'back';
  isCanvasLoading: boolean;

  // Serialized Canvas Side States
  frontJson: string;
  backJson: string;
  frontPreview: string | null;
  backPreview: string | null;

  // Selected Object
  selectedObjectId: string | null;
  selectedObjectProps: SelectedObjectProperties | null;

  // Viewport & Guides
  zoom: number;
  showGuides: boolean;

  // Independent 30-step Dual-Sided History
  frontHistory: string[];
  backHistory: string[];
  frontRedoStack: string[];
  backRedoStack: string[];

  // Dirty State & Persistence Status
  isDirty: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  designName: string;
  designId: string | null;

  // Active Context
  activeProduct: any | null;
  selectedVariant: any | null;
  activeTemplateId: string | null;
  draftCache: Record<string, { frontJson: string; backJson: string }>;

  // Store Actions
  setCanvas: (canvas: fabric.Canvas | null) => void;
  setActiveSide: (side: 'front' | 'back') => void;
  loadSideConfigs: (frontJson: string, backJson?: string) => void;
  syncSelectedProps: () => void;
  updateSelectedProp: (key: string, value: any) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  switchSide: (side?: 'front' | 'back') => void;
  setZoom: (zoom: number) => void;
  setShowGuides: (show: boolean) => void;
  setDesignName: (name: string) => void;
  markSaved: (id?: string) => void;
  discardChanges: () => void;
  saveRecoverySnapshot: () => void;
}
```

---

## 4. All 21 Custom Fabric Object Properties

Fabric.js omits custom properties during serialization by default. The exact 21 custom properties identified by the audit are:

```typescript
export const CUSTOM_FABRIC_PROPS = [
  'id',                  // 1. Unique element ID (e.g. 'text_8f2a1b_lx09')
  'name',                // 2. Human-readable layer name
  'isLocked',            // 3. Boolean lock state
  'selectable',          // 4. Interaction flag
  'evented',             // 5. Pointer event flag
  'lockMovementX',       // 6. Translation X constraint
  'lockMovementY',       // 7. Translation Y constraint
  'lockRotation',        // 8. Rotation constraint
  'lockScalingX',        // 9. Scaling X constraint
  'lockScalingY',        // 10. Scaling Y constraint
  'isProtected',         // 11. Template protected layer flag
  'isArtworkBackground', // 12. Background plate layer flag
  'isQRCode',            // 13. QR code identifier
  'qrValue',             // 14. Encoded URL/text of QR code
  'editable',            // 15. Customer-editable flag
  'assetType',           // 16. 'brand' | 'monochrome' | 'shape' | 'text' | 'artwork'
  'originalColor',       // 17. Original color before tinting
  'strokeDashArray',     // 18. Border dashed pattern (e.g., [5, 5])
  'strokeLineCap',       // 19. 'butt' | 'round' | 'square'
  'shadow',              // 20. Native Fabric.js shadow
  'shadowConfig',        // 21. Serialized UI shadow configuration
];
```

---

## 5. The 30-Step Per-Side History Implementation

- Dual independent history stacks: `frontHistory` (max 30 items) and `backHistory` (max 30 items).
- Dual independent redo stacks: `frontRedoStack` and `backRedoStack`.
- When an object is modified, added, or removed, `pushHistory()` serializes the active side using `safeSerializeCanvas()`, pushes onto the active stack, trims to 30 items, clears the active redo stack, and updates `isDirty: true`.
- Undoing restores the previous JSON state with `isCanvasLoading: true` to prevent infinite mutation loops.
- Redoing pops from the active redo stack and re-applies the JSON state.
- Side switching preserves history independently; undoing on the back side does not alter the front side's history.

---

## 6. All 21 Audited REST Endpoints Implementation Matrix

| # | Method | Endpoint Path | Module & Controller | Auth Requirement | Purpose |
|---|---|---|---|---|---|
| 1 | `GET` | `/api/v1/products` | `ProductsController` | Public | Returns active physical NFC card products |
| 2 | `GET` | `/api/v1/products/:id` | `ProductsController` | Public | Returns product details, dimensions, variants |
| 3 | `GET` | `/api/v1/products/:id/templates` | `ProductsController` | Public | Returns templates compatible with product |
| 4 | `GET` | `/api/v1/templates` | `TemplatesController` | Public | Lists public physical card templates by category |
| 5 | `GET` | `/api/v1/templates/:id` | `TemplatesController` | Public | Retrieves full template canvas JSON |
| 6 | `POST` | `/api/v1/uploads/signature` | `UploadsController` | Auth Required | Generates signed Cloudinary upload params |
| 7 | `POST` | `/api/v1/uploads/record` | `UploadsController` | Auth Required | Records uploaded asset metadata in database |
| 8 | `POST` | `/api/v1/uploads` | `UploadsController` | Auth Required | Multipart fallback upload via memory buffer |
| 9 | `GET` | `/api/v1/uploads` | `UploadsController` | Auth Required | Retrieves customer's uploaded images |
| 10 | `DELETE` | `/api/v1/uploads/:id` | `UploadsController` | Auth Required (Owner) | Deletes uploaded image asset and CDN file |
| 11 | `GET` | `/api/v1/designs` | `DesignsController` | Auth Required | Lists all saved designs for customer |
| 12 | `GET` | `/api/v1/designs/draft` | `DesignsController` | Auth Required | Finds template-specific active draft |
| 13 | `POST` | `/api/v1/designs/draft` | `DesignsController` | Auth Required | Upserts template draft (debounced autosave) |
| 14 | `POST` | `/api/v1/designs/reset-draft` | `DesignsController` | Auth Required | Resets customer draft to master template |
| 15 | `POST` | `/api/v1/designs` | `DesignsController` | Auth Required | Creates new permanent design instance |
| 16 | `GET` | `/api/v1/designs/:id` | `DesignsController` | Auth Required (Owner) | Loads specific design canvas state |
| 17 | `PATCH` | `/api/v1/designs/:id` | `DesignsController` | Auth Required (Owner) | Updates design name, JSON, or preview |
| 18 | `POST` | `/api/v1/designs/:id/duplicate` | `DesignsController` | Auth Required (Owner) | Clones customer design |
| 19 | `DELETE` | `/api/v1/designs/:id` | `DesignsController` | Auth Required (Owner) | Deletes design instance |
| 20 | `GET` | `/api/v1/cart` | `CartController` | Auth Required | Returns cart items with design previews |
| 21 | `POST` | `/api/v1/cart/items` | `CartController` | Auth Required | Adds product with `designId` to cart |

*(Note: Checkout snapshot creation is handled by `/api/v1/orders` or checkout route, freezing `designSnapshotJson` into `orders` / `order_items`).*

---

## 7. Database Models & Drizzle Relations

Adapting the audited Prisma schema to Taptch's Drizzle ORM architecture:

1. **`card_products`** (and variants): Physical NFC card dimensions ($1050 \times 600$), safe zone ($40$), bleed ($25$), finishes (matte black, brushed gold, raw metal, titanium).
2. **`card_design_templates`**: Front and back master canvas JSON, categories, preview URLs.
3. **`card_designs`**: User-customized card designs, `front_canvas_json`, `back_canvas_json`, `preview_url`, `back_preview_url`, `is_draft`.
4. **`cart_items`**: Cart line items referencing `product_id`, `variant_id`, `design_id`, and `quantity`.
5. **`orders` / `order_items`**: Enhanced to store `design_snapshot_json`, freezing front and back JSON along with manufacturing previews.
6. **`media_assets`**: Reused and enriched for customer uploaded logos, graphics, and signatures.

---

## 8. Upload Architecture

- **Direct Cloudinary Flow:**
  1. Frontend asks `/api/v1/uploads/signature` for signed timestamp and HMAC.
  2. Frontend posts binary directly to Cloudinary API.
  3. Frontend records metadata via `/api/v1/uploads/record`.
  4. Zero server disk writes, minimal bandwidth usage.
- **Server Buffer Fallback:**
  1. If direct upload is blocked by client network, fallback posts multipart stream to `/api/v1/uploads`.
  2. Memory buffer uploaded to Cloudinary SDK and recorded in database.

---

## 9. 16 Critical Functions Reference

1. `initStudio()`: Studio startup orchestrator resolving product, template, and drafts.
2. `safeSerializeCanvas()`: Pre-normalizes live text styles before `.toJSON(CUSTOM_FABRIC_PROPS)` to prevent crashes.
3. `safeParseCanvasJson()`: Sanitizes incoming JSON, assigns stable IDs, ensures correct background and selectability.
4. `normalizeLiveTextStyle()`: Traverses live text objects and sets `.styles = {}` if null/undefined.
5. `normalizeJsonTextStyle()`: Sets `.styles = []` in JSON prior to `loadFromJSON()` for Fabric 5.3.0.
6. `loadSideConfigs()`: Loads front and back configurations into Zustand and resets dirty state.
7. `pushHistory()`: Records state into the active side's 30-item history stack.
8. `undo()` / `redo()`: Traverses history with canvas locks to prevent re-entrant mutation loops.
9. `handleAddText()`: Inserts `fabric.IText` with normalized styles and typography presets.
10. `insertElementToCanvas()`: Inserts native shapes or parses SVGs via `fabric.loadSVGFromString()`.
11. `uploadToCloudinaryAndPersist()`: Coordinates signed upload and database recording.
12. `searchIconifyIcons()`: Debounced vector search via public Iconify API.
13. `loadGoogleFont()`: Dynamically injects Google Font stylesheets and awaits document font resolution.
14. `handleSaveDesign()`: Gathers canvas JSON, generates thumbnails, and calls draft or design API.
15. `renderSideToPng()`: Headless `fabric.StaticCanvas` with $3.0\times$ multiplier producing 300 DPI PNG.
16. `processCheckout()`: Atomic order snapshotting freezing `designSnapshotJson`.

---

## 10. 3D Card Simulation Engine

- **In-Studio CSS 3D Mockup (`CardMockupPreview.tsx`):**
  - Ultra-lightweight, zero WebGL context overhead.
  - Interactive mouse tilt tracking ($\pm 15^\circ$ X/Y).
  - Dynamic specular glare gradient: `linear-gradient(calc(125deg + tiltX * 2deg), rgba(255,255,255,0.25) 0%, transparent 60%)`.
  - Flip animation ($180^\circ$ Y-axis) displaying offscreen-rendered reverse artwork.
- **Flagship WebGL 3D Card (`NfcCard3D.tsx`):**
  - Three.js ExtrudeGeometry with CR80 dimensions ($3.4 \times 2.1436 \times 0.06$).
  - Corner radius $0.1263$, bevel $0.012$, 24 curve segments, 4 bevel segments.
  - Front/back decal planes with normalized UV coordinates.
  - Zero-allocation render loop: pre-allocated Vector3, Quaternion, Euler math objects.
  - Inertia damping ($0.94$), hover tilt, contactless chip decal.
  - WebGL context loss handling and texture/geometry memory disposal.

---

## 11. Export & Print Production

- Logical dimensions: $1050 \times 600\text{ px}$.
- Multiplier: $3.0\times$.
- Output dimensions: $3150 \times 1800\text{ px}$.
- Physical card: $85.60\text{ mm} \times 53.98\text{ mm}$ ($3.370\text{ in} \times 2.125\text{ in}$).
- Commercial resolution: $\approx 300\text{ DPI}$ with $25\text{ px}$ bleed and $40\text{ px}$ safe zone.
- Headless `fabric.StaticCanvas` guarantees zero selection handles or editor UI artifacts in print files.

---

## 12. Cart & Order Freezing via `savedDesignId`

- "Add to Cart" triggers synchronous design save $\rightarrow$ receives `savedDesignId`.
- Line item saved in `cart_items` referencing `savedDesignId`.
- At checkout, `designSnapshotJson` freezes the exact front and back JSON, thumbnail URLs, and variant details into `order_items` / `orders`.
- Future customer modifications to their saved design in `/dashboard` never alter existing manufacturing orders.

---

## 13. Critical Pitfalls & Source Quirks Prevented

1. **Fabric 5.x Text Styles Crash:** Prevented via `normalizeLiveTextStyle()` and `normalizeJsonTextStyle()`.
2. **Infinite Mutation Loops:** Prevented by gating modification listeners with `isCanvasLoading` and `isInternalLoading.current`.
3. **Absolute ClipPath Drift:** Rounded card clipPath configured with `absolutePositioned: true` to prevent viewport zoom detachment.
4. **WebGL Context Exhaustion:** CSS 3D used in editor modal; Three.js model includes full `dispose()` on geometries, materials, and textures.
5. **Zero Brand Literals:** All UI brand references imported dynamically from `@/config/brand`.

---
*End of Implementation Analysis.*

