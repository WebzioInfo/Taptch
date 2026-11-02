# Tapzio Specification — 10 Corporate & Organization Management

> Source: Master Prompt Section 10

## Enterprise Multitenancy Model
- Organizations (`Organization` model) represent corporate accounts with centralized administrative governance.
- Hierarchical structure:
  - Organization → Departments → Teams → Members (Employees).
  - Centralized branding guidelines: corporate logo, primary brand colors, approved typography, and curated template assignments.

## Bulk Employee Provisioning Engine
- **CSV Bulk Import**:
  - Upload CSV containing employee details: First Name, Last Name, Work Email, Phone, Department, Designation, Social Links, Custom Attributes.
  - Comprehensive pre-validation step: syntax check, duplicate detection, department verification.
  - Detailed downloadable Error Report for malformed rows before applying batch commit.
- **Background Bulk Generation**:
  - Enqueues job in BullMQ to create profiles, bind organization assets, generate unique slugs, and issue invitation emails.
  - Supports provisioning 500+ employees in seconds without UI timeout or browser memory strain.

## Brand Lock & Governance Workflows
- **Field-Level Immutability**:
  - Org Admin can lock designated fields (e.g. Company Name, Legal Address, Brand Logo, Website, Corporate Email Domain, Job Titles).
  - Locked fields appear read-only on the employee's personal builder screen.
- **Optional Edit-Approval Workflow**:
  - When enabled, changes made by employees to unlocked sections enter an `APPROVAL_PENDING` state.
  - Department managers or Org Admins review diffs in an Approval Queue before changes go live.

## Lifecycle & Offboarding Management
- **Employee Deactivation**:
  - One-click offboarding.
  - Physical NFC cards are instantly unlinked and marked `REASSIGNABLE` in inventory.
  - Public profile is archived or redirected to a central corporate directory / new employee.
  - All previously captured leads remain intact in the organization's CRM pipeline (employee cannot wipe corporate contacts).
  - Audit log tracks the deactivation, reason, and actor.

## Corporate Directory & Unified Analytics
- Centralized public or intranet directory page (`/org/[slug]/directory`) listing all team members with search, department filtering, and direct contact cards.
- Organization-wide analytics rollups showing top-performing networkers, total team scans, and aggregate lead generation figures.

