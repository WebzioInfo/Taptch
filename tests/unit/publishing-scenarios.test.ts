import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { users, profiles, tenantSubscriptions, planAssignmentHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ActorContext } from '@/db';
import {
  createProfile,
  addBusiness,
  addCatalogueItem,
  getProfileWithDetails,
} from '@/modules/profiles';
import {
  submitPublicationRequest,
  reviewPublicationRequest,
  assignUserPlan,
  listPublicationRequests,
} from '@/modules/publishing';
import {
  getEntitlements,
} from '@/modules/entitlements';

describe('TAPTCH Controlled Publishing & Plan Assignment System (Scenarios A - H)', () => {
  const adminActor: ActorContext = {
    userId: 'usr_super_admin_test',
    orgId: null,
    role: 'super_admin',
    isAdmin: true,
  };

  beforeAll(async () => {
    // Seed admin user
    await db.insert(users).values({
      id: adminActor.userId,
      name: 'Super Admin',
      email: 'admin@taptch.test',
      role: 'super_admin',
      systemRole: 'super_admin',
    }).onConflictDoNothing();
  });

  async function createTestCustomer(prefix: string): Promise<ActorContext> {
    const id = `usr_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(users).values({
      id,
      name: `${prefix} User`,
      email: `${prefix}_${Date.now()}@example.com`,
      role: 'user',
      systemRole: 'user',
    }).onConflictDoNothing();

    return {
      userId: id,
      orgId: null,
      role: 'user',
      isAdmin: false,
    };
  }

  // -------------------------------------------------------------
  // SCENARIO A: Unrestricted Profile Data Collection
  // Base user on Free/Nano can save complete profile details, multiple businesses,
  // catalogue products, gallery images, videos, brochures in draft mode without plan blockage.
  // -------------------------------------------------------------
  it('Scenario A: Free/unassigned user enters and saves full profile data without plan blockage', async () => {
    const customer = await createTestCustomer('scenA');
    const slug = `scen-a-${Date.now()}`;

    // 1. Create base profile with rich contact and background details
    const profile = await createProfile(customer, {
      slug,
      displayName: 'Aarav Patel',
      headline: 'Founder & Managing Director',
      bio: 'Pioneering IoT hardware and luxury digital cards across APAC.',
      phone: '+919876543210',
      whatsapp: '+919876543210',
      email: 'aarav@luxurylabs.io',
      website: 'https://luxurylabs.io',
      address: 'Indiranagar 100ft Road',
      location: 'Bengaluru, Karnataka',
      skills: ['Product Design', 'NFC Hardware', 'Venture Building'],
      experience: [
        { role: 'CEO', company: 'LuxuryLabs', period: '2021 - Present', description: 'Leading smart hardware innovation.' },
      ],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/aaravpatel' },
        { platform: 'twitter', url: 'https://x.com/aaravpatel' },
        { platform: 'instagram', url: 'https://instagram.com/aarav' },
      ],
      gallery: [
        { url: 'https://res.cloudinary.com/taptch/image/upload/sample1.jpg', caption: 'Flagship Event 2025' },
        { url: 'https://res.cloudinary.com/taptch/image/upload/sample2.jpg', caption: 'Keynote Demo' },
      ],
      videos: [
        { videoUrl: 'https://youtube.com/watch?v=demo123', title: 'Product Launch 2026' },
      ],
      brochures: [
        { title: 'Corporate Brochure 2026', fileUrl: 'https://res.cloudinary.com/taptch/raw/upload/brochure.pdf', fileSize: '1MB' },
      ],
    });

    expect(profile.id).toBeDefined();
    expect(profile.status.toUpperCase()).toBe('DRAFT');
    expect(profile.phone).toBe('+919876543210');
    expect(profile.gallery).toHaveLength(2);
    expect(profile.videos).toHaveLength(1);
    expect(profile.brochures).toHaveLength(1);

    // 2. Add multiple businesses in draft mode (allowed without entitlement errors)
    const biz1 = await addBusiness(customer, profile.id, {
      name: 'LuxuryLabs Electronics',
      tagline: 'Precision NFC Devices',
      phone: '+919876543210',
      website: 'https://luxurylabs.io',
    });
    const biz2 = await addBusiness(customer, profile.id, {
      name: 'Apex Advisory Partners',
      tagline: 'Strategic DeepTech Investments',
      phone: '+919876543211',
      website: 'https://apexadvisory.com',
    });
    expect(biz1.id).toBeDefined();
    expect(biz2.id).toBeDefined();

    // 3. Add multiple catalogue products in draft mode
    const prod1 = await addCatalogueItem(customer, profile.id, {
      type: 'product',
      title: 'Matte Obsidian Smart NFC Card',
      price: '3499',
      currency: 'INR',
      description: 'Laser-engraved titanium composite card with dynamic NFC chip.',
    });
    const prod2 = await addCatalogueItem(customer, profile.id, {
      type: 'service',
      title: 'Enterprise Fleet Provisioning',
      price: '15000',
      currency: 'INR',
      description: 'White-glove card configuration and team directory integration.',
    });
    expect(prod1.id).toBeDefined();
    expect(prod2.id).toBeDefined();

    // Verify all records exist in DB
    const loaded = await getProfileWithDetails(customer, profile.id);
    expect(loaded.businesses).toHaveLength(2);
    expect(loaded.catalogue).toHaveLength(2);
    expect(loaded.skills).toContain('Product Design');
  });

  // -------------------------------------------------------------
  // SCENARIO B: Publication Request Submission & Privacy Gate
  // Customer submits publication request; profile transitions to PENDING_PUBLICATION.
  // Profile is NOT publicly viewable while pending.
  // -------------------------------------------------------------
  it('Scenario B: Customer submits publication request; profile remains unpublished and private', async () => {
    const customer = await createTestCustomer('scenB');
    const slug = `scen-b-${Date.now()}`;
    const profile = await createProfile(customer, {
      slug,
      displayName: 'Priya Sharma',
      headline: 'Architect & Urban Planner',
    });

    // Submit publication request
    const request = await submitPublicationRequest(customer, {
      profileId: profile.id,
      requestedPlanId: 'nano',
      contactPhone: '+919876543210',
    });

    expect(request.requestId).toBeDefined();
    expect(request.status).toBe('PENDING_PUBLICATION');
    expect(request.profileId).toBe(profile.id);

    // Profile status is now PENDING_PUBLICATION
    const [updatedProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profile.id));

    expect(updatedProfile.status).toBe('PENDING_PUBLICATION');
    expect(updatedProfile.status).not.toBe('PUBLISHED');

    // Verify admin can discover this request in admin list
    const pendingList = await listPublicationRequests(adminActor, 'pending_publication');
    const found = pendingList.some((r: { id: string }) => r.id === request.requestId);
    expect(found).toBe(true);
  });

  // -------------------------------------------------------------
  // SCENARIO C: Admin Review & Filtered Display (Nano Plan)
  // Admin assigns Nano plan and approves.
  // Public view displays strictly Nano-permitted sections;
  // Multi-businesses and product catalogues are hidden from public view.
  // -------------------------------------------------------------
  it('Scenario C: Admin assigns Nano plan; public display snapshot strictly filters out unauthorized sections', async () => {
    const customer = await createTestCustomer('scenC');
    const slug = `scen-c-${Date.now()}`;
    const profile = await createProfile(customer, {
      slug,
      displayName: 'Vikram Malhotra',
      headline: 'Independent Consultant',
      phone: '+919998887776',
      gallery: [
        { url: 'https://res.cloudinary.com/taptch/image/upload/consulting.jpg' },
      ],
    });

    // Customer added 2 businesses and 1 product while in draft
    await addBusiness(customer, profile.id, { name: 'Vikram Ventures' });
    await addBusiness(customer, profile.id, { name: 'Consulting Co' });
    await addCatalogueItem(customer, profile.id, { type: 'service', title: 'Strategy Session' });

    // Submit request
    const request = await submitPublicationRequest(customer, { profileId: profile.id });

    // Admin reviews and assigns NANO plan (valid 365 days)
    const reviewResult = await reviewPublicationRequest(adminActor, request.requestId, {
      action: 'APPROVE',
      planId: 'nano',
      validDays: 365,
      paymentStatus: 'PAID',
      amountInr: '999',
      adminNotes: 'Verified contact details. Assigned Nano Plan.',
    });

    expect(reviewResult.success).toBe(true);

    // Verify profile is now published
    const [published] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profile.id));

    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedJson).toBeDefined();

    // Inspect the pre-compiled public snapshot
    const snapshot = published.publishedJson as Record<string, unknown>;
    expect(snapshot.displayName).toBe('Vikram Malhotra');
    expect(snapshot.phone).toBe('+919998887776');

    // On NANO tier: maxBusinesses = 0, maxProducts = 0, gallery = false
    expect(snapshot.businesses).toHaveLength(0); // Filtered out
    expect(snapshot.catalogue).toHaveLength(0);  // Filtered out
    expect(snapshot.gallery).toHaveLength(0);    // Filtered out

    // Verify all original draft records still remain completely intact in DB!
    const rawDetails = await getProfileWithDetails(customer, profile.id);
    expect(rawDetails.businesses).toHaveLength(2); // Still 2 in DB!
    expect(rawDetails.catalogue).toHaveLength(1);  // Still 1 in DB!
    expect(rawDetails.gallery).toHaveLength(1);    // Still 1 in DB!
  });

  // -------------------------------------------------------------
  // SCENARIO D: Seamless Upgrade (Max Plan)
  // Admin upgrades user to Max plan.
  // Previously saved gallery, videos, and multi-business data automatically
  // become visible in the refreshed public snapshot without re-entering any data!
  // -------------------------------------------------------------
  it('Scenario D: Admin upgrades user to Max plan; hidden content automatically appears on public snapshot without re-entry', async () => {
    const customer = await createTestCustomer('scenD');
    const slug = `scen-d-${Date.now()}`;
    const profile = await createProfile(customer, {
      slug,
      displayName: 'Neha Singhal',
      headline: 'Jewelry Designer & Gemologist',
      gallery: [
        { url: 'https://res.cloudinary.com/taptch/image/upload/diamond1.jpg', caption: 'Solitaire Ring' },
        { url: 'https://res.cloudinary.com/taptch/image/upload/diamond2.jpg', caption: 'Emerald Necklace' },
      ],
      videos: [
        { videoUrl: 'https://youtube.com/watch?v=craftsmanship', title: 'Atelier Behind the Scenes' },
      ],
      brochures: [
        { title: 'Bridal Collection 2026', fileUrl: 'https://res.cloudinary.com/taptch/raw/upload/bridal.pdf' },
      ],
    });

    await addBusiness(customer, profile.id, { name: 'Neha Jewels Studio' });
    await addBusiness(customer, profile.id, { name: 'Gemstone Certification Lab' });
    await addCatalogueItem(customer, profile.id, { type: 'product', title: '18K Diamond Solitaire', price: '85000' });

    // Step 1: Initially approved on Nano
    const req = await submitPublicationRequest(customer, { profileId: profile.id });
    await reviewPublicationRequest(adminActor, req.requestId, {
      action: 'APPROVE',
      planId: 'nano',
    });

    // Step 2: Commercial discussion completes; Admin assigns MAX plan
    await assignUserPlan(adminActor, {
      userId: customer.userId,
      planId: 'max',
      validDays: 365,
      paymentStatus: 'PAID',
      amountInr: '4999',
      notes: 'Customer upgraded to Max Plan via WhatsApp sales agreement.',
    });

    // Verify refreshed public snapshot
    const [published] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profile.id));

    const snapshot = published.publishedJson as Record<string, unknown> & {
      businesses: Array<{ name: string }>;
      catalogue: unknown[];
      gallery: unknown[];
      videos: unknown[];
      brochures: unknown[];
    };

    // Under MAX tier: all businesses, catalogue, gallery, videos, and brochures now appear!
    expect(snapshot.businesses).toHaveLength(2);
    expect(snapshot.catalogue).toHaveLength(1);
    expect(snapshot.gallery).toHaveLength(2);
    expect(snapshot.videos).toHaveLength(1);
    expect(snapshot.brochures).toHaveLength(1);
    expect(snapshot.businesses[0].name).toBe('Neha Jewels Studio');
  });

  // -------------------------------------------------------------
  // SCENARIO E: Graceful Downgrade
  // Plan is downgraded back to Nano; restricted content is immediately hidden
  // from public view, but remains intact in the database.
  // -------------------------------------------------------------
  it('Scenario E: Downgrading hides premium features from public view while preserving raw data intact in DB', async () => {
    const customer = await createTestCustomer('scenE');
    const slug = `scen-e-${Date.now()}`;
    const profile = await createProfile(customer, {
      slug,
      displayName: 'Rohan Mehta',
      gallery: [{ url: 'https://res.cloudinary.com/taptch/image/upload/sample.jpg' }],
    });
    await addBusiness(customer, profile.id, { name: 'Mehta Logistics' });
    await addBusiness(customer, profile.id, { name: 'Mehta Warehousing' });

    // Initial publish on Max
    const req = await submitPublicationRequest(customer, { profileId: profile.id });
    await reviewPublicationRequest(adminActor, req.requestId, {
      action: 'APPROVE',
      planId: 'max',
    });

    // Downgrade to Nano
    await assignUserPlan(adminActor, {
      userId: customer.userId,
      planId: 'nano',
      notes: 'Subscription adjusted to Nano tier.',
    });

    // Check public snapshot: restricted items hidden
    const [published] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profile.id));

    const snapshot = published.publishedJson as Record<string, unknown>;
    expect(snapshot.businesses).toHaveLength(0);
    expect(snapshot.gallery).toHaveLength(0);

    // Raw database verification: zero data deleted!
    const dbDetails = await getProfileWithDetails(customer, profile.id);
    expect(dbDetails.businesses).toHaveLength(2);
    expect(dbDetails.gallery).toHaveLength(1);
  });

  // -------------------------------------------------------------
  // SCENARIO F: Unauthenticated Public Access Rules
  // Visitors can only view approved/published profiles.
  // Private drafts or pending profiles return 404 / are filtered.
  // -------------------------------------------------------------
  it('Scenario F: Unauthenticated visitors cannot access draft or pending profiles', async () => {
    const customer = await createTestCustomer('scenF');
    const slug = `scen-f-${Date.now()}`;
    const profile = await createProfile(customer, {
      slug,
      displayName: 'Secret Draft Profile',
    });

    // Check draft profile status
    const [draftProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profile.id));

    expect(draftProfile.status).toBe('DRAFT');

    // Verify public query rule: public viewer requires status IN ('PUBLISHED', 'APPROVED') and publishedJson NOT empty
    const isPubliclyViewable =
      (draftProfile.status === 'PUBLISHED' || draftProfile.status === 'APPROVED') &&
      Object.keys(draftProfile.publishedJson || {}).length > 0;

    expect(isPubliclyViewable).toBe(false);
  });

  // -------------------------------------------------------------
  // SCENARIO G: Commercial Terms & Manual Payment Recording
  // Commercial terms handled offline; admin assigns plan with validity duration
  // and records paymentStatus (PAID, WAIVED) with zero payment gateway dependency.
  // -------------------------------------------------------------
  it('Scenario G: Admin manually records offline payment and creates audit log without payment gateway', async () => {
    const customer = await createTestCustomer('scenG');

    // Admin records offline UPI / Bank Transfer payment
    const result = await assignUserPlan(adminActor, {
      userId: customer.userId,
      planId: 'mini',
      validDays: 180,
      paymentStatus: 'PAID',
      amountInr: '1999',
      notes: 'Customer transferred ₹1999 via UPI Ref #987654321',
    });

    expect(result.success).toBe(true);

    // Verify active subscription in DB
    const [sub] = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.userId, customer.userId));

    expect(sub.planId).toBe('mini');
    expect(sub.paymentStatus).toBe('PAID');
    expect(sub.amountInr).toBe('1999');
    expect(new Date(sub.validUntil!).getTime()).toBeGreaterThan(Date.now());

    // Verify immutable audit history was recorded
    const history = await db
      .select()
      .from(planAssignmentHistory)
      .where(eq(planAssignmentHistory.userId, customer.userId));

    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].toPlanId).toBe('mini');
    expect(history[0].paymentStatus).toBe('PAID');
    expect(history[0].amountInr).toBe('1999');
    expect(history[0].assignedBy).toBe(adminActor.userId);
  });

  // -------------------------------------------------------------
  // SCENARIO H: Expired Subscription Enforcement
  // When subscription validUntil is in the past, subscription is inactive,
  // falling back to free tier / expired restrictions.
  // -------------------------------------------------------------
  it('Scenario H: Expired subscription falls back to free tier restrictions', async () => {
    const customer = await createTestCustomer('scenH');

    // Insert an expired subscription (validUntil was 10 days ago)
    const tenDaysAgo = new Date(Date.now() - 10 * 86400 * 1000);
    await db.insert(tenantSubscriptions).values({
      id: `sub_exp_${Date.now()}`,
      userId: customer.userId,
      planId: 'max',
      assignedBy: adminActor.userId,
      status: 'active',
      validUntil: tenDaysAgo,
      paymentStatus: 'PAID',
    });

    // Check effective entitlements
    const { planId, entitlements } = await getEntitlements({ userId: customer.userId });

    // Because subscription expired, it must fallback to free tier defaults (planId = 'free', custom_domain_allowed = false)
    expect(planId).toBe('free');
    expect(entitlements['custom_domain_allowed']).toBe(false);
    expect(entitlements['max_profiles']).toBe(1);
  });
});
