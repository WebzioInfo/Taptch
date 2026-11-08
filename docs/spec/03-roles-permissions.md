# Taptch Specification — 03 Roles & Permissions

> Source: Master Prompt Section 3

## Defined System Roles
1. `super_admin`: Full platform control, billing config, system settings, security audits, template management, tenant impersonation.
2. `support_admin`: Read-only/escalation support access; customer assistance, order lookup, card reissuance.
3. `reseller`: Manages reseller-branded client sub-accounts, client profiles, wholesale card orders, commission payouts.
4. `org_owner`: Top-level corporate administrator; manages billing, enterprise licenses, corporate branding locks, organization settings.
5. `org_admin`: Department and employee administrator; assigns cards, provisions member profiles, invites users.
6. `dept_manager`: Department-level manager; views department-scoped leads, team analytics, and member directory.
7. `employee`: Corporate staff member; edits unlocked profile fields, exchanges contacts, views personal leads.
8. `individual`: B2C single user or small business owner; full ownership of their personal profiles and cards.

## Centralized Authorization Architecture
- Single source of truth: `can(actor: ActorContext, permission: PermissionString, resource?: any): boolean` located in `src/modules/auth/permissions.ts`.
- No scattered inline `if (user.role === 'admin')` checks across UI components.
- Role-to-permission mapping is stored in database-seeded configuration and cached in Redis.

## Permission Matrix Examples
| Permission String | Allowed Roles | Scope / Context Rules |
| :--- | :--- | :--- |
| `profile:view:public` | Anyone | Only published content |
| `profile:edit:own` | `individual`, `employee`, `org_admin`, `org_owner` | Subject to org brand-lock |
| `profile:edit:org` | `org_admin`, `org_owner` | Scoped to organization |
| `profile:publish` | `individual`, `org_admin`, `org_owner` | If approval workflow enabled, requires admin |
| `card:assign` | `individual`, `org_admin`, `org_owner` | Within available inventory |
| `card:reassign` | `org_admin`, `org_owner`, `super_admin` | Requires unlinking active session |
| `lead:view:own` | `individual`, `employee` | Leads collected by assigned profile |
| `lead:view:dept` | `dept_manager` | Leads collected by department members |
| `lead:view:org` | `org_admin`, `org_owner` | All leads across organization |
| `billing:manage` | `individual`, `org_owner` | Personal or org billing details |
| `template:publish` | `super_admin` | Global template gallery |
| `plan:configure` | `super_admin` | Subscription pricing & limits |
| `platform:impersonate` | `super_admin` | Requires explicit audit reason & time limit |

## Enterprise Field Lock Enforcement
- Organizations can mark specific profile sections and fields as "Locked" (e.g., Company Name, Logo, Corporate Email Domain, Job Title, Approved Social Links, Brand Colors).
- When an `employee` attempts to update their profile, the service layer validates `profile:edit:own` against the org's locked field list and rejects modifications to locked attributes.

## Impersonation Protocol
- Authorized exclusively for `super_admin`.
- Must provide a required text reason (e.g. ticket ID or customer request).
- Limited to a maximum duration (e.g. 60 minutes) with auto-expiry.
- Prominent persistent UI banner displayed throughout the session.
- Every impersonated mutation is tagged with the operator's admin ID in the audit log.
- Sensitive actions (payment method edits, password/MFA changes, credential exports) are strictly blocked during impersonation.

