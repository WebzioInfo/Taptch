# Tapzio Specification — 06 Profile Builder

> Source: Master Prompt Section 6

## Layout & Architecture
The Profile Builder is an interactive three-pane desktop editor with responsive adaptations for tablet and mobile:
- **Left Pane (Navigation & Sections Tree)**:
  - Section management: add, delete, duplicate, hide/show, drag-and-drop reorder.
  - Multi-language tabs (English, Hindi, Malayalam, Arabic).
  - General settings: slug customization, SEO tags, custom domain binding, password protection.
- **Center Pane (Live Viewport)**:
  - Interactive phone-frame simulator (rendered with exact 390×844 CSS dimensions).
  - Switchable viewports: iPhone 15, Android Pixel, Tablet, and Fullscreen.
  - Immediate visual feedback mirroring live changes without full page reloads.
- **Right Pane (Inspector / Property Editor)**:
  - Contextual property panel updating based on the currently selected section or block.
  - Granular styling controls: theme accents, font size overrides, padding, image upload/crop.

## Core Builder Capabilities
1. **Drag-and-Drop Reordering**: Smooth block repositioning using `@hello-pangea/dnd` or `@dnd-kit`.
2. **Reliable Autosave with Server Verification**:
   - Debounced autosave (1.5s after edit).
   - "Saved" badge is displayed **only after** the backend returns an HTTP 200 persistence confirmation.
   - Network failure triggers an inline retry banner; prevents silent data loss.
3. **Draft vs. Published Workflow**:
   - Edits are saved into `draftContent`.
   - Distinct "Publish Changes" button promotes draft to `publishedContent` and triggers ISR cache invalidation.
   - Rollback capability: review previous published snapshots and restore instantly.
4. **Undo / Redo Stack**:
   - Client-side history buffer tracking state mutations across the editing session.
5. **Completeness Meter**:
   - Dynamic progress indicator (0% to 100%) encouraging users to add photo, contact info, bio, social links, and brochure.
6. **Media Management**:
   - Drag-and-drop file upload with client-side image cropping and aspect ratio lock (1:1 for avatar, 16:9 for cover).
   - Direct-to-storage presigned upload with automatic WebP conversion.

## Fast Onboarding Wizard (< 3 Minutes)
A 5-step guided wizard for new users:
1. **Setup Mode**: Start from scratch, import from LinkedIn profile URL, or scan physical business card (OCR pipeline interface).
2. **Template Selection**: Pick from the 6 studio launch templates with real-time preview.
3. **Identity & Essentials**: Upload photo/logo, enter full name, designation, company name, primary phone, and WhatsApp.
4. **Key Links**: Add top 3 social profiles or website links.
5. **Publish & Claim**: Instant publication of `/p/[slug]`, generation of QR code, and prompt to pair an NFC card.

