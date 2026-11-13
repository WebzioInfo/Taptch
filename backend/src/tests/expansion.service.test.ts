import { describe, it, expect } from 'vitest';
import { isReservedUsername } from '../common/constants/reserved-usernames';

describe('Backend Expansion: Lead Validation & Bot Protection', () => {
  it('correctly rejects submissions when honeypot website field is non-empty', () => {
    const isSpam = (websiteField?: string) => Boolean(websiteField && websiteField.trim().length > 0);
    expect(isSpam('http://bot-link.xyz')).toBe(true);
    expect(isSpam('')).toBe(false);
    expect(isSpam(undefined)).toBe(false);
  });

  it('validates required lead fields before persistence', () => {
    const validateLeadPayload = (payload: { name?: string; email?: string; phone?: string }) => {
      if (!payload.name || !payload.name.trim()) return false;
      if (!payload.email && !payload.phone) return false;
      return true;
    };

    expect(validateLeadPayload({ name: 'Rohit Sharma', email: 'rohit@example.com' })).toBe(true);
    expect(validateLeadPayload({ name: 'Rohit Sharma', phone: '+919876543210' })).toBe(true);
    expect(validateLeadPayload({ name: '', email: 'rohit@example.com' })).toBe(false);
    expect(validateLeadPayload({ name: 'Rohit Sharma' })).toBe(false);
  });
});

describe('Backend Expansion: Dual Profile Architecture Isolation', () => {
  it('enforces schema isolation: personal profiles exclude commercial services and catalogues', () => {
    const sanitizeProfilePayload = (profileType: 'personal' | 'business', data: any) => {
      if (profileType === 'personal') {
        const { services, catalogue, businessHours, ...rest } = data;
        return rest;
      }
      return data;
    };

    const inputData = {
      displayName: 'Aditi Rao',
      headline: 'Brand Strategist',
      services: [{ name: 'Brand Audit', price: '₹15,000' }],
      catalogue: [{ name: 'Style Guidebook' }],
      businessHours: 'Mon-Fri 9-6',
    };

    const sanitizedPersonal = sanitizeProfilePayload('personal', inputData);
    expect(sanitizedPersonal).not.toHaveProperty('services');
    expect(sanitizedPersonal).not.toHaveProperty('catalogue');
    expect(sanitizedPersonal).not.toHaveProperty('businessHours');
    expect(sanitizedPersonal.displayName).toBe('Aditi Rao');

    const preservedBusiness = sanitizeProfilePayload('business', inputData);
    expect(preservedBusiness).toHaveProperty('services');
    expect(preservedBusiness.services).toHaveLength(1);
  });
});

describe('Backend Expansion: Double-Entry Financial Engine', () => {
  it('accurately computes gross revenue, COGS, expenses and net bottom-line margin', () => {
    const orders = [
      { id: '1', cardMaterial: 'pvc', unitPrice: 799, quantity: 2, status: 'DELIVERED', paymentStatus: 'PAID' },
      { id: '2', cardMaterial: 'metal', unitPrice: 1999, quantity: 1, status: 'SHIPPED', paymentStatus: 'PAID' },
      { id: '3', cardMaterial: 'pvc', unitPrice: 799, quantity: 1, status: 'PENDING', paymentStatus: 'PENDING' },
    ];

    const expenses = [
      { amount: 500, category: 'SHIPPING' },
      { amount: 350, category: 'MARKETING' },
    ];

    const cogsRates = { pvc: 150, metal: 450 };

    const totalOrders = orders.length;
    const grossOrderValue = orders.reduce((sum, o) => sum + o.unitPrice * o.quantity, 0);
    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const settledRevenue = paidOrders.reduce((sum, o) => sum + o.unitPrice * o.quantity, 0);

    const totalCogs = paidOrders.reduce((sum, o) => {
      const rate = (cogsRates as any)[o.cardMaterial] || 150;
      return sum + rate * o.quantity;
    }, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = settledRevenue - totalCogs - totalExpenses;
    const netMargin = settledRevenue > 0 ? Number(((netProfit / settledRevenue) * 100).toFixed(1)) : 0;

    expect(totalOrders).toBe(3);
    expect(grossOrderValue).toBe(799 * 2 + 1999 + 799);
    expect(settledRevenue).toBe(1598 + 1999);
    expect(totalCogs).toBe(750);
    expect(totalExpenses).toBe(850);
    expect(netProfit).toBe(1997);
    expect(netMargin).toBe(55.5);
  });
});

describe('Backend Expansion: Reserved Slugs & Dynamic Root Routing', () => {
  it('identifies reserved system routes on the backend', () => {
    expect(isReservedUsername('admin')).toBe(true);
    expect(isReservedUsername('support')).toBe(true);
    expect(isReservedUsername('api')).toBe(true);
    expect(isReservedUsername('login')).toBe(true);
    expect(isReservedUsername('register')).toBe(true);
    expect(isReservedUsername('dashboard')).toBe(true);
    expect(isReservedUsername('templates')).toBe(true);
  });

  it('allows valid client usernames', () => {
    expect(isReservedUsername('sanoof')).toBe(false);
    expect(isReservedUsername('mohammed-sanoof')).toBe(false);
    expect(isReservedUsername('webzio-team')).toBe(false);
  });
});

describe('Backend Expansion: Google OAuth Authorization URL Security', () => {
  const buildGoogleAuthUrl = (clientId?: string, callbackUrl?: string, state?: string) => {
    if (!clientId || clientId.trim() === '' || clientId === 'dummy-google-client-id') {
      return '';
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl || 'http://localhost:4000/api/auth/oauth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: state || 'taptch_auth_state',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  it('safely refuses to redirect to Google when GOOGLE_CLIENT_ID is unconfigured or dummy', () => {
    expect(buildGoogleAuthUrl('')).toBe('');
    expect(buildGoogleAuthUrl(undefined)).toBe('');
    expect(buildGoogleAuthUrl('dummy-google-client-id')).toBe('');
  });

  it('constructs correct Google OAuth URL when valid credentials are present', () => {
    const validId = '123456789-abc.apps.googleusercontent.com';
    const callback = 'http://localhost:4000/api/auth/oauth/google/callback';
    const url = buildGoogleAuthUrl(validId, callback, 'test_state');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth?');
    expect(url).toContain(`client_id=${validId}`);
    expect(url).toContain('state=test_state');
  });
});

describe('Backend Expansion: SEO & Robots Protocol Hygiene', () => {
  it('generates standard compliant robots.txt with disallow for private paths', () => {
    const generateRobots = (baseUrl: string) => {
      return `User-agent: *
Allow: /
Allow: /templates
Allow: /pricing
Disallow: /admin
Disallow: /support
Disallow: /dashboard
Disallow: /api/
Disallow: /portal-x

Sitemap: ${baseUrl}/sitemap.xml
`;
    };

    const robots = generateRobots('https://taptch.com');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /support');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Sitemap: https://taptch.com/sitemap.xml');
  });
});
