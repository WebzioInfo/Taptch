import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getDatabase } from './index';
import * as schema from './schema';
import crypto from 'crypto';

// Load local environment files if running standalone via CLI
if (fs.existsSync(path.resolve('.env.local'))) {
  dotenv.config({ path: path.resolve('.env.local') });
}
dotenv.config({ path: path.resolve('.env') });

// Password hasher matching Better Auth standard scrypt / sha256 password hash format
function hashPassword(password: string): string {
  // Better Auth stores passwords hashed; for testing we can generate a deterministic SHA-256 or bcrypt hash
  const salt = 'tappzio_secure_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export async function seedDatabase() {
  console.log('[SEED] Starting idempotent Indian demo data seed...');
  const db = getDatabase();

  // 1. Seed Permissions
  const permissionsList = [
    { id: 'profile:create', name: 'Create Profile', description: 'Create new personal or business profile', module: 'profiles' },
    { id: 'profile:edit', name: 'Edit Profile', description: 'Edit draft content of assigned profile', module: 'profiles' },
    { id: 'profile:publish', name: 'Publish Profile', description: 'Promote draft profile to public snapshot', module: 'profiles' },
    { id: 'profile:delete', name: 'Delete Profile', description: 'Archive or purge profile', module: 'profiles' },
    { id: 'card:claim', name: 'Claim Card', description: 'Activate unclaimed physical NFC card', module: 'cards' },
    { id: 'card:reassign', name: 'Reassign Card', description: 'Change target profile of an active card', module: 'cards' },
    { id: 'card:deactivate', name: 'Deactivate Card', description: 'Mark card as lost or permanently deactivated', module: 'cards' },
    { id: 'lead:view', name: 'View Leads', description: 'View captured contact exchange leads', module: 'leads' },
    { id: 'lead:export', name: 'Export Leads', description: 'Download CSV of captured leads', module: 'leads' },
    { id: 'org:manage', name: 'Manage Organization', description: 'Manage corporate workspace and brand lock', module: 'orgs' },
    { id: 'dept:manage', name: 'Manage Departments', description: 'Create and assign corporate departments', module: 'orgs' },
    { id: 'member:invite', name: 'Invite Members', description: 'Invite and provision corporate seats', module: 'orgs' },
    { id: 'admin:access', name: 'Super Admin Access', description: 'Access global administrative cockpit', module: 'admin' },
    { id: 'plan:assign', name: 'Assign Plans', description: 'Manually configure tenant plan entitlements', module: 'admin' },
  ];

  for (const perm of permissionsList) {
    await db.insert(schema.permissions)
      .values(perm)
      .onConflictDoNothing({ target: schema.permissions.id });
  }

  // 2. Seed Role-Permissions Map
  const rolePermissionsMap: Record<string, string[]> = {
    super_admin: permissionsList.map((p) => p.id),
    support_admin: ['profile:edit', 'card:reassign', 'lead:view', 'admin:access'],
    owner: ['profile:create', 'profile:edit', 'profile:publish', 'profile:delete', 'card:claim', 'card:reassign', 'card:deactivate', 'lead:view', 'lead:export', 'org:manage', 'dept:manage', 'member:invite'],
    admin: ['profile:create', 'profile:edit', 'profile:publish', 'card:claim', 'card:reassign', 'lead:view', 'lead:export', 'dept:manage', 'member:invite'],
    manager: ['profile:edit', 'lead:view', 'lead:export'],
    employee: ['profile:edit', 'lead:view'],
    user: ['profile:create', 'profile:edit', 'profile:publish', 'profile:delete', 'card:claim', 'card:reassign', 'card:deactivate', 'lead:view', 'lead:export'],
  };

  for (const [role, perms] of Object.entries(rolePermissionsMap)) {
    for (const permId of perms) {
      await db.insert(schema.rolePermissions)
        .values({ role, permissionId: permId })
        .onConflictDoNothing();
    }
  }

  // 3. Seed Default Plans & Entitlements
  const defaultPlans = [
    { id: 'free', name: 'Free Forever', description: 'Essential digital identity for single professionals' },
    { id: 'pro', name: 'Professional', description: 'Advanced studio templates and custom domain for executives' },
    { id: 'business', name: 'Business Team', description: 'Multi-business profiles and team lead capture' },
    { id: 'enterprise', name: 'Corporate Enterprise', description: 'Custom corporate hierarchy, brand lock, and bulk provisioning' },
    // Core Four-Tier Model
    { id: 'nano', name: 'Nano Tier', description: 'Essential digital contact card for individual professionals' },
    { id: 'micro', name: 'Micro Tier', description: 'Enhanced profile with company overview, lead exchange, gallery, and single business support' },
    { id: 'mini', name: 'Mini Tier', description: 'Multi-business identity with product catalogue and rich gallery' },
    { id: 'max', name: 'Max Tier', description: 'Full-featured enterprise profile with services, downloadable brochure, videos, and review links' },
  ];

  for (const p of defaultPlans) {
    await db.insert(schema.plans)
      .values({ ...p, isActive: true })
      .onConflictDoNothing({ target: schema.plans.id });
  }

  const defaultEntitlements = [
    // Free Plan (Backwards compatible)
    { id: 'ent-free-prof', planId: 'free', entitlementKey: 'max_profiles', value: 1 },
    { id: 'ent-free-card', planId: 'free', entitlementKey: 'max_cards', value: 0 },
    { id: 'ent-free-team', planId: 'free', entitlementKey: 'max_team_members', value: 1 },
    { id: 'ent-free-retn', planId: 'free', entitlementKey: 'analytics_retention_days', value: 30 },
    { id: 'ent-free-domn', planId: 'free', entitlementKey: 'custom_domain_allowed', value: false },

    // Pro Plan
    { id: 'ent-pro-prof', planId: 'pro', entitlementKey: 'max_profiles', value: 3 },
    { id: 'ent-pro-card', planId: 'pro', entitlementKey: 'max_cards', value: 2 },
    { id: 'ent-pro-team', planId: 'pro', entitlementKey: 'max_team_members', value: 1 },
    { id: 'ent-pro-retn', planId: 'pro', entitlementKey: 'analytics_retention_days', value: 365 },
    { id: 'ent-pro-domn', planId: 'pro', entitlementKey: 'custom_domain_allowed', value: true },

    // Business Plan
    { id: 'ent-biz-prof', planId: 'business', entitlementKey: 'max_profiles', value: 10 },
    { id: 'ent-biz-card', planId: 'business', entitlementKey: 'max_cards', value: 5 },
    { id: 'ent-biz-team', planId: 'business', entitlementKey: 'max_team_members', value: 10 },
    { id: 'ent-biz-retn', planId: 'business', entitlementKey: 'analytics_retention_days', value: 365 },
    { id: 'ent-biz-domn', planId: 'business', entitlementKey: 'custom_domain_allowed', value: true },

    // Tier 1: Nano
    { id: 'ent-nano-prof', planId: 'nano', entitlementKey: 'max_profiles', value: 1 },
    { id: 'ent-nano-biz', planId: 'nano', entitlementKey: 'max_businesses', value: 0 },
    { id: 'ent-nano-ovw', planId: 'nano', entitlementKey: 'has_company_overview', value: false },
    { id: 'ent-nano-exch', planId: 'nano', entitlementKey: 'has_exchange_contact', value: false },
    { id: 'ent-nano-gal', planId: 'nano', entitlementKey: 'has_gallery', value: false },
    { id: 'ent-nano-gali', planId: 'nano', entitlementKey: 'max_gallery_images', value: 0 },
    { id: 'ent-nano-map', planId: 'nano', entitlementKey: 'has_google_maps', value: false },
    { id: 'ent-nano-prod', planId: 'nano', entitlementKey: 'has_product_catalogue', value: false },
    { id: 'ent-nano-serv', planId: 'nano', entitlementKey: 'has_service_catalogue', value: false },
    { id: 'ent-nano-broc', planId: 'nano', entitlementKey: 'has_brochure_download', value: false },
    { id: 'ent-nano-vid', planId: 'nano', entitlementKey: 'has_youtube_videos', value: false },
    { id: 'ent-nano-rev', planId: 'nano', entitlementKey: 'has_google_review_link', value: false },

    // Tier 2: Micro
    { id: 'ent-micro-prof', planId: 'micro', entitlementKey: 'max_profiles', value: 2 },
    { id: 'ent-micro-biz', planId: 'micro', entitlementKey: 'max_businesses', value: 1 },
    { id: 'ent-micro-ovw', planId: 'micro', entitlementKey: 'has_company_overview', value: true },
    { id: 'ent-micro-exch', planId: 'micro', entitlementKey: 'has_exchange_contact', value: true },
    { id: 'ent-micro-gal', planId: 'micro', entitlementKey: 'has_gallery', value: true },
    { id: 'ent-micro-gali', planId: 'micro', entitlementKey: 'max_gallery_images', value: 5 },
    { id: 'ent-micro-map', planId: 'micro', entitlementKey: 'has_google_maps', value: true },
    { id: 'ent-micro-prod', planId: 'micro', entitlementKey: 'has_product_catalogue', value: false },
    { id: 'ent-micro-serv', planId: 'micro', entitlementKey: 'has_service_catalogue', value: false },
    { id: 'ent-micro-broc', planId: 'micro', entitlementKey: 'has_brochure_download', value: false },
    { id: 'ent-micro-vid', planId: 'micro', entitlementKey: 'has_youtube_videos', value: false },
    { id: 'ent-micro-rev', planId: 'micro', entitlementKey: 'has_google_review_link', value: false },

    // Tier 3: Mini
    { id: 'ent-mini-prof', planId: 'mini', entitlementKey: 'max_profiles', value: 5 },
    { id: 'ent-mini-biz', planId: 'mini', entitlementKey: 'max_businesses', value: 3 },
    { id: 'ent-mini-ovw', planId: 'mini', entitlementKey: 'has_company_overview', value: true },
    { id: 'ent-mini-exch', planId: 'mini', entitlementKey: 'has_exchange_contact', value: true },
    { id: 'ent-mini-gal', planId: 'mini', entitlementKey: 'has_gallery', value: true },
    { id: 'ent-mini-gali', planId: 'mini', entitlementKey: 'max_gallery_images', value: 15 },
    { id: 'ent-mini-map', planId: 'mini', entitlementKey: 'has_google_maps', value: true },
    { id: 'ent-mini-prod', planId: 'mini', entitlementKey: 'has_product_catalogue', value: true },
    { id: 'ent-mini-prodi', planId: 'mini', entitlementKey: 'max_products', value: 10 },
    { id: 'ent-mini-serv', planId: 'mini', entitlementKey: 'has_service_catalogue', value: false },
    { id: 'ent-mini-broc', planId: 'mini', entitlementKey: 'has_brochure_download', value: false },
    { id: 'ent-mini-vid', planId: 'mini', entitlementKey: 'has_youtube_videos', value: false },
    { id: 'ent-mini-rev', planId: 'mini', entitlementKey: 'has_google_review_link', value: false },

    // Tier 4: Max
    { id: 'ent-max-prof', planId: 'max', entitlementKey: 'max_profiles', value: 20 },
    { id: 'ent-max-biz', planId: 'max', entitlementKey: 'max_businesses', value: 10 },
    { id: 'ent-max-ovw', planId: 'max', entitlementKey: 'has_company_overview', value: true },
    { id: 'ent-max-exch', planId: 'max', entitlementKey: 'has_exchange_contact', value: true },
    { id: 'ent-max-gal', planId: 'max', entitlementKey: 'has_gallery', value: true },
    { id: 'ent-max-gali', planId: 'max', entitlementKey: 'max_gallery_images', value: 50 },
    { id: 'ent-max-map', planId: 'max', entitlementKey: 'has_google_maps', value: true },
    { id: 'ent-max-prod', planId: 'max', entitlementKey: 'has_product_catalogue', value: true },
    { id: 'ent-max-prodi', planId: 'max', entitlementKey: 'max_products', value: 50 },
    { id: 'ent-max-serv', planId: 'max', entitlementKey: 'has_service_catalogue', value: true },
    { id: 'ent-max-servi', planId: 'max', entitlementKey: 'max_services', value: 50 },
    { id: 'ent-max-broc', planId: 'max', entitlementKey: 'has_brochure_download', value: true },
    { id: 'ent-max-vid', planId: 'max', entitlementKey: 'has_youtube_videos', value: true },
    { id: 'ent-max-rev', planId: 'max', entitlementKey: 'has_google_review_link', value: true },
    { id: 'ent-max-domn', planId: 'max', entitlementKey: 'custom_domain_allowed', value: true },
  ];

  for (const ent of defaultEntitlements) {
    await db.insert(schema.planEntitlements)
      .values(ent)
      .onConflictDoNothing({ target: schema.planEntitlements.id });
  }

  // 3.1 Seed Default Template Marketplace
  const initialTemplates = [
    {
      id: 'obsidian-luxury',
      name: 'Obsidian Luxury',
      slug: 'obsidian-luxury',
      description: 'Signature executive dark theme with brushed gold accents, high-contrast typography, and precision cards.',
      category: 'personal',
      thumbnailUrl: '/templates/obsidian-luxury.png',
      supportedProfileTypes: ['personal', 'business'],
      requiredPlanId: 'nano',
      defaultThemeConfig: { primaryColor: '#D4AF37', background: '#0A0A0C', cardBg: '#121216', fontFamily: 'Plus Jakarta Sans' },
      isFeatured: true,
      displayOrder: 1,
    },
    {
      id: 'ivory-minimal',
      name: 'Ivory Minimalist',
      slug: 'ivory-minimal',
      description: 'Warm alabaster editorial aesthetic with timeless serif headings, subtle dividers, and high legibility.',
      category: 'personal',
      thumbnailUrl: '/templates/ivory-minimal.png',
      supportedProfileTypes: ['personal', 'business'],
      requiredPlanId: 'nano',
      defaultThemeConfig: { primaryColor: '#2D3748', background: '#FDFBF7', cardBg: '#FFFFFF', fontFamily: 'Playfair Display' },
      isFeatured: true,
      displayOrder: 2,
    },
    {
      id: 'aurora-creator',
      name: 'Aurora Creator',
      slug: 'aurora-creator',
      description: 'Vibrant neon-infused glassmorphism designed for digital creators, artists, agency founders, and designers.',
      category: 'creative',
      thumbnailUrl: '/templates/aurora-creator.png',
      supportedProfileTypes: ['personal', 'business'],
      requiredPlanId: 'micro',
      defaultThemeConfig: { primaryColor: '#8B5CF6', background: '#0F172A', cardBg: '#1E293B', fontFamily: 'Plus Jakarta Sans' },
      isFeatured: true,
      displayOrder: 3,
    },
    {
      id: 'zenith-corporate',
      name: 'Zenith Corporate',
      slug: 'zenith-corporate',
      description: 'Structured enterprise navy and titanium aesthetic for B2B executives, consultants, and legal partners.',
      category: 'corporate',
      thumbnailUrl: '/templates/zenith-corporate.png',
      supportedProfileTypes: ['personal', 'business'],
      requiredPlanId: 'mini',
      defaultThemeConfig: { primaryColor: '#2563EB', background: '#0B0F19', cardBg: '#111827', fontFamily: 'Plus Jakarta Sans' },
      isFeatured: true,
      displayOrder: 4,
    },
    {
      id: 'catalyst-business',
      name: 'Catalyst Business',
      slug: 'catalyst-business',
      description: 'Commercial showcase design featuring dedicated product showcase shelves, service cards, and quick enquiry triggers.',
      category: 'business',
      thumbnailUrl: '/templates/catalyst-business.png',
      supportedProfileTypes: ['business'],
      requiredPlanId: 'mini',
      defaultThemeConfig: { primaryColor: '#059669', background: '#064E3B', cardBg: '#065F46', fontFamily: 'Plus Jakarta Sans' },
      isFeatured: true,
      displayOrder: 5,
    },
    {
      id: 'apex-capital',
      name: 'Apex Capital',
      slug: 'apex-capital',
      description: 'Prestige emerald and dark graphite tailored for luxury real estate developers, venture capital, and private wealth.',
      category: 'real-estate',
      thumbnailUrl: '/templates/apex-capital.png',
      supportedProfileTypes: ['personal', 'business'],
      requiredPlanId: 'max',
      defaultThemeConfig: { primaryColor: '#10B981', background: '#022C22', cardBg: '#064E3B', fontFamily: 'Cinzel' },
      isFeatured: false,
      displayOrder: 6,
    },
  ];

  for (const t of initialTemplates) {
    await db.insert(schema.templates)
      .values(t)
      .onConflictDoNothing({ target: schema.templates.id });
  }

  // 4. Seed Super Admin & Support Admin
  const adminUsers = [
    {
      id: 'usr-superadmin-001',
      name: 'Aditya Vikram (Super Admin)',
      email: 'superadmin@tappzio.com',
      systemRole: 'super_admin',
      twoFactorEnabled: true,
      emailVerified: true,
      phoneNumber: '+919876500001',
    },
    {
      id: 'usr-support-002',
      name: 'Kavita Menon (Support Admin)',
      email: 'support@tappzio.com',
      systemRole: 'support_admin',
      twoFactorEnabled: true,
      emailVerified: true,
      phoneNumber: '+919876500002',
    },
  ];

  for (const u of adminUsers) {
    await db.insert(schema.users)
      .values(u)
      .onConflictDoNothing({ target: schema.users.id });

    // Seed password account
    await db.insert(schema.accounts)
      .values({
        id: `acc-${u.id}`,
        accountId: u.id,
        providerId: 'credential',
        userId: u.id,
        password: hashPassword('TappzioAdmin@2026!'),
      })
      .onConflictDoNothing({ target: schema.accounts.id });
  }

  // 5. Seed Corporate Organization: Apex Capital Partners
  const orgId = 'org-apex-capital';
  await db.insert(schema.organizations)
    .values({
      id: orgId,
      name: 'Apex Capital Partners',
      slug: 'apex-capital',
      logo: '/assets/demo/apex-logo.svg',
      metadata: JSON.stringify({ industry: 'Private Equity & Wealth Management', hq: 'Bengaluru, India' }),
    })
    .onConflictDoNothing({ target: schema.organizations.id });

  // Seed Tenant Subscription for Apex Capital
  await db.insert(schema.tenantSubscriptions)
    .values({
      id: 'sub-apex-business',
      organizationId: orgId,
      planId: 'business',
      assignedBy: 'usr-superadmin-001',
      status: 'active',
      notes: 'Corporate Enterprise Pilot - Seeded',
    })
    .onConflictDoNothing({ target: schema.tenantSubscriptions.id });

  // Seed Departments
  const depts = [
    { id: 'dept-apex-ib', organizationId: orgId, name: 'Investment Banking' },
    { id: 'dept-apex-wm', organizationId: orgId, name: 'Wealth Management' },
    { id: 'dept-apex-ops', organizationId: orgId, name: 'Operations & Compliance' },
  ];

  for (const d of depts) {
    await db.insert(schema.departments)
      .values(d)
      .onConflictDoNothing({ target: schema.departments.id });
  }

  // Seed 12 Corporate Members
  const orgEmployees = [
    { id: 'usr-emp-01', name: 'Rajesh Singhania', email: 'rajesh@apexcap.in', role: 'owner', deptId: 'dept-apex-ib' },
    { id: 'usr-emp-02', name: 'Priya Nair', email: 'priya@apexcap.in', role: 'admin', deptId: 'dept-apex-ops' },
    { id: 'usr-emp-03', name: 'Vikramaditya Rao', email: 'vikram@apexcap.in', role: 'manager', deptId: 'dept-apex-ib' },
    { id: 'usr-emp-04', name: 'Rohan Mehta', email: 'rohan@apexcap.in', role: 'manager', deptId: 'dept-apex-wm' },
    { id: 'usr-emp-05', name: 'Sneha Reddy', email: 'sneha@apexcap.in', role: 'employee', deptId: 'dept-apex-ib' },
    { id: 'usr-emp-06', name: 'Arjun Sharma', email: 'arjun@apexcap.in', role: 'employee', deptId: 'dept-apex-ib' },
    { id: 'usr-emp-07', name: 'Neha Gupta', email: 'neha@apexcap.in', role: 'employee', deptId: 'dept-apex-wm' },
    { id: 'usr-emp-08', name: 'Aditya Verma', email: 'aditya@apexcap.in', role: 'employee', deptId: 'dept-apex-ops' },
    { id: 'usr-emp-09', name: 'Divya Iyer', email: 'divya@apexcap.in', role: 'employee', deptId: 'dept-apex-wm' },
    { id: 'usr-emp-10', name: 'Karan Malhotra', email: 'karan@apexcap.in', role: 'employee', deptId: 'dept-apex-ib' },
    { id: 'usr-emp-11', name: 'Pooja Joshi', email: 'pooja@apexcap.in', role: 'employee', deptId: 'dept-apex-wm' },
    { id: 'usr-emp-12', name: 'Siddharth Menon', email: 'siddharth@apexcap.in', role: 'employee', deptId: 'dept-apex-ops' },
  ];

  for (const emp of orgEmployees) {
    await db.insert(schema.users)
      .values({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        systemRole: 'user',
        emailVerified: true,
      })
      .onConflictDoNothing({ target: schema.users.id });

    await db.insert(schema.members)
      .values({
        id: `mem-${emp.id}`,
        organizationId: orgId,
        userId: emp.id,
        role: emp.role,
      })
      .onConflictDoNothing({ target: schema.members.id });

    await db.insert(schema.accounts)
      .values({
        id: `acc-${emp.id}`,
        accountId: emp.id,
        providerId: 'credential',
        userId: emp.id,
        password: hashPassword('ApexCapital@2026!'),
      })
      .onConflictDoNothing({ target: schema.accounts.id });
  }

  // 6. Seed 5 Individual Users
  const individuals = [
    { id: 'usr-ind-01', name: 'Dr. Ananya Roy', email: 'dr.ananya@apollo.in', slug: 'dr-ananya-roy', title: 'Consultant Interventional Cardiologist', theme: 'ivory' },
    { id: 'usr-ind-02', name: 'CA Raghavan Sundaram', email: 'raghavan@sundaram-ca.in', slug: 'ca-raghavan', title: 'Senior Partner, Chartered Accountant', theme: 'obsidian' },
    { id: 'usr-ind-03', name: 'Meera Deshmukh', email: 'meera@studio-d.in', slug: 'meera-deshmukh', title: 'Principal Architect & Urban Designer', theme: 'ivory' },
    { id: 'usr-ind-04', name: 'Chef Farhan Qureshi', email: 'farhan@dum-zaika.in', slug: 'chef-farhan', title: 'Executive Chef & Culinary Director', theme: 'obsidian' },
    { id: 'usr-ind-05', name: 'Kabir Varma', email: 'kabir@pulse.ai', slug: 'kabir-varma', title: 'Co-Founder & CEO, Pulse AI Hardware', theme: 'aurora' },
  ];

  for (const ind of individuals) {
    await db.insert(schema.users)
      .values({
        id: ind.id,
        name: ind.name,
        email: ind.email,
        systemRole: 'user',
        emailVerified: true,
      })
      .onConflictDoNothing({ target: schema.users.id });

    await db.insert(schema.accounts)
      .values({
        id: `acc-${ind.id}`,
        accountId: ind.id,
        providerId: 'credential',
        userId: ind.id,
        password: hashPassword('TappzioDemo@2026!'),
      })
      .onConflictDoNothing({ target: schema.accounts.id });

    // Seed profile for individual
    await db.insert(schema.profiles)
      .values({
        id: `prof-${ind.id}`,
        slug: ind.slug,
        ownerId: ind.id,
        displayName: ind.name,
        headline: ind.title,
        bio: `${ind.name} is a leading professional in India. Connect for strategic advisory and business networking.`,
        themeId: ind.theme,
        status: 'published',
        publishedJson: {
          headline: ind.title,
          displayName: ind.name,
          theme: ind.theme,
        },
      })
      .onConflictDoNothing({ target: schema.profiles.id });
  }

  // 7. Seed Initial System Settings
  await db.insert(schema.systemSettings)
    .values({
      id: 'default',
      brandName: 'Tappzio',
      brandTagline: 'Intelligent Digital Identity & Smart Networking',
      brandLogoUrl: '/assets/brand/logo.svg',
      contactEmail: 'support@tappzio.com',
    })
    .onConflictDoNothing({ target: schema.systemSettings.id });

  console.log('[SEED] Demo data seed completed successfully!');
}

// Allow direct execution: tsx src/db/seed.ts
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
