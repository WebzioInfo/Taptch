import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ProfileRenderer, type ProfileRenderData } from '@/components/templates/ProfileRenderer';
import {
  SOCIAL_PLATFORMS,
  normalizeSocialUrl,
  extractSocialHandle,
} from '@/lib/socials';
import {
  isValidUpiId,
  buildUpiPaymentUri,
  generateUpiQrDataUrl,
} from '@/lib/upi';
import {
  validateProfileForPublishing,
  type ProfileValidateInput,
} from '@/lib/validation/profile-completion';

describe('Profile Design Studio & 6 Luxury Template Engine', () => {
  const baseProfile: ProfileRenderData = {
    id: 'prof_test_123',
    slug: 'aditya-singhania',
    displayName: 'Aditya Singhania',
    headline: 'Managing Director & Enterprise Architect',
    bio: 'Pioneering next-generation enterprise technology.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    coverUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    phone: '+91 98765 43210',
    email: 'aditya@example.com',
    location: 'Bengaluru, India',
    businesses: [
      {
        id: 'biz_1',
        companyName: 'Singhania Capital',
        tagline: 'Private Equity & Venture Studio',
        roleTitle: 'Managing Partner',
        websiteUrl: 'https://singhania.example.com',
      },
    ],
    catalogue: [
      {
        id: 'cat_1',
        title: 'Institutional Mandate Advisory',
        itemType: 'service',
        price: '₹50,000',
      },
    ],
    customFields: {
      upiConfig: {
        upiId: 'singhania@okhdfcbank',
        payeeName: 'Aditya Singhania',
        isEnabled: true,
      },
    },
  };

  const templatesToTest = [
    { id: 'obsidian-luxury', name: 'Obsidian Luxury' },
    { id: 'ivory-minimal', name: 'Ivory Minimalist' },
    { id: 'aurora-creator', name: 'Aurora Creator' },
    { id: 'zenith-corporate', name: 'Zenith Corporate' },
    { id: 'catalyst-business', name: 'Catalyst Business' },
    { id: 'apex-capital', name: 'Apex Capital & Wealth' },
  ];

  templatesToTest.forEach(({ id, name }) => {
    it(`renders ${name} (${id}) cleanly without runtime exceptions`, () => {
      const profile = { ...baseProfile, templateId: id };
      const html = renderToString(React.createElement(ProfileRenderer, { profile }));

      expect(html).toContain('Aditya Singhania');
      expect(html).toContain('Singhania Capital');
    });
  });

  it('renders UPI payment card when UPI is enabled in customFields', () => {
    const profile = { ...baseProfile, templateId: 'obsidian-luxury' };
    const html = renderToString(React.createElement(ProfileRenderer, { profile }));

    expect(html).toContain('singhania@okhdfcbank');
  });
});

describe('Social Media 13-Platform Normalization Engine', () => {
  it('normalizes Instagram username and full URL correctly', () => {
    expect(normalizeSocialUrl('instagram', '@sanoof')).toBe('https://instagram.com/sanoof');
    expect(normalizeSocialUrl('instagram', 'sanoof')).toBe('https://instagram.com/sanoof');
    expect(normalizeSocialUrl('instagram', 'https://instagram.com/sanoof')).toBe('https://instagram.com/sanoof');
  });

  it('normalizes LinkedIn username and profile URL correctly', () => {
    expect(normalizeSocialUrl('linkedin', 'in/aditya')).toBe('https://linkedin.com/in/aditya');
    expect(normalizeSocialUrl('linkedin', 'aditya')).toBe('https://linkedin.com/in/aditya');
    expect(normalizeSocialUrl('linkedin', 'https://linkedin.com/in/aditya')).toBe('https://linkedin.com/in/aditya');
  });

  it('normalizes WhatsApp phone numbers into wa.me links', () => {
    expect(normalizeSocialUrl('whatsapp', '+91 98765 43210')).toBe('https://wa.me/919876543210');
    expect(normalizeSocialUrl('whatsapp', '9876543210')).toBe('https://wa.me/9876543210');
  });

  it('normalizes YouTube channels with @ prefix', () => {
    expect(normalizeSocialUrl('youtube', 'taptch')).toBe('https://youtube.com/@taptch');
    expect(normalizeSocialUrl('youtube', '@taptch')).toBe('https://youtube.com/@taptch');
  });

  it('extracts display handles from full URLs', () => {
    expect(extractSocialHandle('instagram', 'https://instagram.com/sanoof')).toBe('@sanoof');
    expect(extractSocialHandle('x', 'https://x.com/elonmusk')).toBe('@elonmusk');
    expect(extractSocialHandle('github', 'torvalds')).toBe('@torvalds');
  });
});

describe('UPI Payment & QR Code Engine', () => {
  it('validates Indian UPI Virtual Payment Addresses (VPAs)', () => {
    expect(isValidUpiId('merchant@upi')).toBe(true);
    expect(isValidUpiId('user.name@okhdfcbank')).toBe(true);
    expect(isValidUpiId('company-pay@icici')).toBe(true);

    expect(isValidUpiId('')).toBe(false);
    expect(isValidUpiId('invalidvpa')).toBe(false);
    expect(isValidUpiId('@upi')).toBe(false);
    expect(isValidUpiId('user@')).toBe(false);
  });

  it('builds standard NPCI upi://pay URI strings', () => {
    const uri = buildUpiPaymentUri({
      upiId: 'merchant@upi',
      payeeName: 'Webzio Technology',
      amount: '499.00',
      note: 'Executive Card',
    });

    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=merchant%40upi');
    expect(uri).toContain('pn=Webzio+Technology');
    expect(uri).toContain('am=499.00');
    expect(uri).toContain('cu=INR');
  });

  it('generates a valid QR code data URL', async () => {
    const uri = buildUpiPaymentUri({ upiId: 'merchant@upi' });
    const dataUrl = await generateUpiQrDataUrl(uri);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe('Profile Completion & Pre-Publish Validation Engine', () => {
  it('identifies missing display name as a blocking error', () => {
    const input: ProfileValidateInput = {
      displayName: '',
    };
    const result = validateProfileForPublishing(input);

    expect(result.canPublish).toBe(false);
    expect(result.blockingErrors.some((e) => e.field === 'displayName')).toBe(true);
  });

  it('identifies invalid email format as a blocking error', () => {
    const input: ProfileValidateInput = {
      displayName: 'Aditya',
      email: 'invalid-email-address',
    };
    const result = validateProfileForPublishing(input);

    expect(result.canPublish).toBe(false);
    expect(result.blockingErrors.some((e) => e.field === 'email')).toBe(true);
  });

  it('flags invalid UPI VPA as blocking when UPI is enabled', () => {
    const input: ProfileValidateInput = {
      displayName: 'Aditya',
      customFields: {
        upiConfig: {
          upiId: 'bad_upi_id',
          isEnabled: true,
        },
      },
    };
    const result = validateProfileForPublishing(input);

    expect(result.canPublish).toBe(false);
    expect(result.blockingErrors.some((e) => e.field === 'upiId')).toBe(true);
  });

  it('approves clean and complete profile for publishing with high score', () => {
    const input: ProfileValidateInput = {
      displayName: 'Aditya Singhania',
      headline: 'Partner',
      bio: 'Enterprise Founder',
      avatarUrl: 'https://example.com/avatar.jpg',
      phone: '+91 98765 43210',
      email: 'aditya@example.com',
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/aditya' }],
    };
    const result = validateProfileForPublishing(input);

    expect(result.canPublish).toBe(true);
    expect(result.blockingErrors.length).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});
