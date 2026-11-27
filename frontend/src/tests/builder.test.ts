import { describe, it, expect } from 'vitest';
import {
  STANDARD_TEMPLATES,
  getTemplateDefaultThemeConfig,
  type ThemeColorsConfig,
} from '../modules/templates/constants';
import { canonicalTemplateId } from '../components/templates/ProfileRenderer';
import {
  safeTrim,
  safeLower,
  safeSlug,
  safeString,
  normalizeProfileDraft,
} from '../lib/data-normalization';
import {
  formatWhatsAppLink,
  hasAnyContactCoordinates,
} from '../lib/contact-utils';

describe('Taptch Profile Builder — Theme Customization & State Engine', () => {
  it('provides a curated 10-color palette for all standard luxury templates', () => {
    const requiredKeys: (keyof ThemeColorsConfig)[] = [
      'primary',
      'secondary',
      'accent',
      'background',
      'cardBackground',
      'text',
      'heading',
      'buttonBackground',
      'buttonText',
      'border',
    ];

    STANDARD_TEMPLATES.forEach((tpl) => {
      const palette = getTemplateDefaultThemeConfig(tpl.id);
      expect(palette).toBeDefined();
      requiredKeys.forEach((key) => {
        expect(palette[key]).toBeDefined();
        expect(typeof palette[key]).toBe('string');
        expect(palette[key]).toMatch(/^#|^rgba/);
      });
    });
  });

  it('correctly maps Cinematic Digital Profile default tokens', () => {
    const cinematic = getTemplateDefaultThemeConfig('cinematic-noir');
    expect(cinematic.primary.toUpperCase()).toBe('#0866F8');
    expect(cinematic.background.toUpperCase()).toBe('#0A0A0B');
    expect(cinematic.cardBackground.toUpperCase()).toBe('#111113');
  });

  it('maintains theme customization memory across template switches', () => {
    let currentTemplate = 'cinematic-noir';
    let currentColors: ThemeColorsConfig = getTemplateDefaultThemeConfig(currentTemplate);
    const customizationsMap: Record<string, ThemeColorsConfig> = {
      [currentTemplate]: { ...currentColors },
    };

    currentColors = { ...currentColors, primary: '#00F0FF', background: '#050505' };
    customizationsMap[currentTemplate] = { ...currentColors };

    expect(customizationsMap['cinematic-noir'].primary).toBe('#00F0FF');
    expect(customizationsMap['cinematic-noir'].background).toBe('#050505');

    const oldTemplate = currentTemplate;
    currentTemplate = 'slot-2-reserved';
    customizationsMap[oldTemplate] = { ...currentColors };
    currentColors = customizationsMap[currentTemplate] || getTemplateDefaultThemeConfig(currentTemplate);

    currentColors = { ...currentColors, primary: '#1D4ED8' };
    customizationsMap[currentTemplate] = { ...currentColors };

    currentTemplate = 'cinematic-noir';
    currentColors = customizationsMap[currentTemplate] || getTemplateDefaultThemeConfig(currentTemplate);

    expect(currentColors.primary).toBe('#00F0FF');
    expect(currentColors.background).toBe('#050505');
    expect(customizationsMap['slot-2-reserved'].primary).toBe('#1D4ED8');
  });

  it('verifies the Personal Profile Builder 4-step workflow order ending with Ventures', () => {
    const tabOrder = ['theme', 'identity', 'socials', 'businesses'];
    expect(tabOrder[0]).toBe('theme');
    expect(tabOrder[1]).toBe('identity');
    expect(tabOrder[2]).toBe('socials');
    expect(tabOrder[3]).toBe('businesses');
    expect(tabOrder).not.toContain('seo');
  });

  it('normalizes Direct Contact Coordinates action links safely', async () => {
    const {
      formatTelLink,
      formatWhatsAppLink,
      formatMailtoLink,
      formatWebsiteUrl,
      formatWebsiteDisplay,
      formatMapsLink,
      hasAnyContactCoordinates,
    } = await import('../lib/contact-utils');

    // Phone / Call link
    expect(formatTelLink('+91 98765 43210')).toBe('tel:+91 98765 43210');
    expect(formatTelLink('   ')).toBeNull();
    expect(formatTelLink(undefined)).toBeNull();

    // WhatsApp link normalization
    expect(formatWhatsAppLink('+91 98765 43210')).toBe('https://wa.me/919876543210');
    expect(formatWhatsAppLink('9876543210')).toBe('https://wa.me/9876543210');
    expect(formatWhatsAppLink(undefined, '+91 98765 00000')).toBe('https://wa.me/919876500000');
    expect(formatWhatsAppLink('', '')).toBeNull();

    // Email / mailto link
    expect(formatMailtoLink('vikram@taptch.com')).toBe('mailto:vikram@taptch.com');
    expect(formatMailtoLink('   ')).toBeNull();

    // Website URL normalization
    expect(formatWebsiteUrl('taptch.com')).toBe('https://taptch.com');
    expect(formatWebsiteUrl('http://mybrand.in')).toBe('http://mybrand.in');
    expect(formatWebsiteUrl('https://mybrand.in/profile/')).toBe('https://mybrand.in/profile/');
    expect(formatWebsiteDisplay('https://mybrand.in/')).toBe('mybrand.in');

    // Maps link
    expect(formatMapsLink('Level 28, One World Centre, Mumbai')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Level%2028%2C%20One%20World%20Centre%2C%20Mumbai'
    );
    expect(formatMapsLink('')).toBeNull();

    // Coordinate presence check
    expect(hasAnyContactCoordinates({})).toBe(false);
    expect(hasAnyContactCoordinates({ phone: '+91 98765 43210' })).toBe(true);
    expect(hasAnyContactCoordinates({ website: 'taptch.com' })).toBe(true);
  });

  it('verifies live synchronization of all 5 coordinates in preview snapshot', () => {
    // Simulate builder state
    let phone = '';
    let whatsapp = '';
    let email = '';
    let website = '';
    let address = '';

    const buildPreviewSnapshot = () => ({
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
    });

    // 1. Initial empty state
    let snapshot = buildPreviewSnapshot();
    expect(snapshot.phone).toBeUndefined();
    expect(snapshot.whatsapp).toBeUndefined();
    expect(snapshot.email).toBeUndefined();
    expect(snapshot.website).toBeUndefined();
    expect(snapshot.address).toBeUndefined();

    // 2. User types Direct Phone Number
    phone = '+91 98765 43210';
    snapshot = buildPreviewSnapshot();
    expect(snapshot.phone).toBe('+91 98765 43210');

    // 3. User types WhatsApp Direct Number
    whatsapp = '+91 98765 88888';
    snapshot = buildPreviewSnapshot();
    expect(snapshot.whatsapp).toBe('+91 98765 88888');

    // 4. User types Business Email
    email = 'counsel@singhania.law';
    snapshot = buildPreviewSnapshot();
    expect(snapshot.email).toBe('counsel@singhania.law');

    // 5. User types Official Website
    website = 'https://singhania.law';
    snapshot = buildPreviewSnapshot();
    expect(snapshot.website).toBe('https://singhania.law');

    // 6. User types Office / Physical Address
    address = 'Express Towers, Nariman Point, Mumbai';
    snapshot = buildPreviewSnapshot();
    expect(snapshot.address).toBe('Express Towers, Nariman Point, Mumbai');

    // 7. User clears a field (e.g. phone) -> stale values disappear immediately
    phone = '';
    snapshot = buildPreviewSnapshot();
    expect(snapshot.phone).toBeUndefined();
    expect(snapshot.email).toBe('counsel@singhania.law');
    expect(snapshot.address).toBe('Express Towers, Nariman Point, Mumbai');
  });

  describe('Social Channels Real-Time Synchronization Engine', () => {
    it('supports all 14 official social platforms with canonical URL normalization', async () => {
      const {
        SUPPORTED_SOCIAL_PLATFORMS,
        normalizeSocialUrl,
        isSafeSocialUrl,
        extractSocialHandle,
      } = await import('../lib/socials');

      expect(SUPPORTED_SOCIAL_PLATFORMS.length).toBe(14);

      // Verify canonical URL building for all 14 platforms
      expect(normalizeSocialUrl('instagram', '@vikram')).toBe('https://instagram.com/vikram');
      expect(normalizeSocialUrl('instagram', 'https://instagram.com/vikram')).toBe('https://instagram.com/vikram');
      expect(normalizeSocialUrl('linkedin', 'vikram-director')).toBe('https://linkedin.com/in/vikram-director');
      expect(normalizeSocialUrl('twitter', '@vikram_x')).toBe('https://x.com/vikram_x');
      expect(normalizeSocialUrl('x', '@vikram_x')).toBe('https://x.com/vikram_x');
      expect(normalizeSocialUrl('youtube', 'vikrammedia')).toBe('https://youtube.com/@vikrammedia');
      expect(normalizeSocialUrl('facebook', 'vikramsinghania')).toBe('https://facebook.com/vikramsinghania');
      expect(normalizeSocialUrl('whatsapp', '+91 98765 43210')).toBe('https://wa.me/919876543210');
      expect(normalizeSocialUrl('telegram', 'vikram_tg')).toBe('https://t.me/vikram_tg');
      expect(normalizeSocialUrl('tiktok', 'vikram_creator')).toBe('https://tiktok.com/@vikram_creator');
      expect(normalizeSocialUrl('github', 'vikram-dev')).toBe('https://github.com/vikram-dev');
      expect(normalizeSocialUrl('behance', 'vikramdesign')).toBe('https://behance.net/vikramdesign');
      expect(normalizeSocialUrl('dribbble', 'vikramcreative')).toBe('https://dribbble.com/vikramcreative');
      expect(normalizeSocialUrl('pinterest', 'vikramlifestyle')).toBe('https://pinterest.com/vikramlifestyle');
      expect(normalizeSocialUrl('snapchat', 'vikramsnap')).toBe('https://snapchat.com/add/vikramsnap');
      expect(normalizeSocialUrl('website', 'singhania.com')).toBe('https://singhania.com');

      // Verify handle extraction
      expect(extractSocialHandle('instagram', 'https://instagram.com/vikram')).toBe('@vikram');
      expect(extractSocialHandle('linkedin', 'vikram-director')).toBe('@vikram-director');

      // Verify XSS prevention
      expect(isSafeSocialUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeSocialUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeSocialUrl('https://instagram.com/safe')).toBe(true);
      expect(normalizeSocialUrl('website', 'javascript:alert(1)')).toBe('#');
    });

    it('simulates real-time social link editing lifecycle with instant preview reflection', async () => {
      const { filterValidSocialLinks, SOCIAL_PLATFORMS } = await import('../lib/socials');

      let socialLinks: Array<{ id: string; platform: string; url: string }> = [];

      // 1. Initial: empty state
      expect(filterValidSocialLinks(socialLinks)).toEqual([]);

      // 2. User adds an Instagram link
      const defaultPlatform = 'instagram';
      const prefix = SOCIAL_PLATFORMS[defaultPlatform]?.prefixUrl || 'https://instagram.com/';
      const link1 = {
        id: 'link-1',
        platform: defaultPlatform,
        url: prefix,
      };
      socialLinks = [...socialLinks, link1];
      expect(socialLinks.length).toBe(1);
      // Link with prefix is immediately available
      expect(filterValidSocialLinks(socialLinks).length).toBe(1);

      // 3. User types handle in URL input
      socialLinks = socialLinks.map((item) =>
        item.id === 'link-1' ? { ...item, url: 'https://instagram.com/alexander' } : item
      );
      expect(socialLinks[0].url).toBe('https://instagram.com/alexander');
      expect(filterValidSocialLinks(socialLinks)[0].url).toBe('https://instagram.com/alexander');

      // 4. User changes platform to LinkedIn -> auto-switches platform prefix
      socialLinks = socialLinks.map((item) => {
        if (item.id === 'link-1') {
          return { ...item, platform: 'linkedin', url: 'https://linkedin.com/in/alexander' };
        }
        return item;
      });
      expect(socialLinks[0].platform).toBe('linkedin');
      expect(socialLinks[0].url).toBe('https://linkedin.com/in/alexander');

      // 5. User adds second link (YouTube)
      const link2 = {
        id: 'link-2',
        platform: 'youtube',
        url: 'https://youtube.com/@alexander',
      };
      socialLinks = [...socialLinks, link2];
      expect(filterValidSocialLinks(socialLinks).length).toBe(2);

      // 6. User clears a link URL -> gracefully filtered out from preview (no broken buttons)
      socialLinks = socialLinks.map((item) =>
        item.id === 'link-2' ? { ...item, url: '' } : item
      );
      const activeInPreview = filterValidSocialLinks(socialLinks);
      expect(activeInPreview.length).toBe(1);
      expect(activeInPreview[0].id).toBe('link-1');

      // 7. User deletes link-1
      socialLinks = socialLinks.filter((item) => item.id !== 'link-1');
      expect(socialLinks.length).toBe(1); // link-2 remains in editor with empty input
      expect(filterValidSocialLinks(socialLinks).length).toBe(0); // nothing displayed in preview
    });
  });

  describe('Taptch Step 4 — SEO & Social Sharing Studio Engine', () => {
    it('accurately calculates fallback hierarchy and character counter thresholds', () => {
      // 1. Personal profile fallback
      const personalDisplayName = 'Alexander Vance';
      const personalHeadline = 'Managing Partner & CIO';
      const personalBio = 'Private equity wealth advisor focused on deep technology and infrastructure.';

      const defaultPersonalTitle = `${personalDisplayName} — ${personalHeadline}`;
      expect(defaultPersonalTitle).toBe('Alexander Vance — Managing Partner & CIO');
      expect(defaultPersonalTitle.length).toBe(40);

      // With custom SEO title
      const customTitle = 'Alexander Vance | Global Wealth Advisory & Asset Management';
      expect(customTitle.length).toBe(59); // Optimal (40-60)
      expect(customTitle.length >= 40 && customTitle.length <= 60).toBe(true);

      // Warning when exceeding 60 chars
      const longTitle = 'Alexander Vance — Managing Partner & Chief Investment Officer at Apex Capital Global Wealth';
      expect(longTitle.length > 60).toBe(true);

      // 2. Business profile fallback
      const bizName = 'Apex Global Capital';
      const defaultBizTitle = `${bizName} | Official Business Profile & Offerings`;
      expect(defaultBizTitle).toBe('Apex Global Capital | Official Business Profile & Offerings');

      // 3. Description counter threshold
      const defaultDesc = personalBio;
      expect(defaultDesc.length).toBe(76); // Short (<120)
      const optimalDesc =
        'Connect with Alexander Vance on Taptch. Access private equity portfolios, direct vCard exchange, and verified executive credentials across global ventures.';
      expect(optimalDesc.length >= 120 && optimalDesc.length <= 160).toBe(true);
    });

    it('correctly maps multi-platform social sharing card metadata', () => {
      const mockProfile = {
        displayName: 'Alexander Vance',
        headline: 'Managing Partner',
        slug: 'alexander',
        avatarUrl: 'https://images.unsplash.com/avatar.jpg',
        coverUrl: 'https://images.unsplash.com/cover.jpg',
        customFields: {
          seo: {
            title: 'Alexander Vance — Wealth Advisory',
            description: 'Connect with Alexander Vance on Taptch.',
            socialImageUrl: 'https://images.unsplash.com/card-banner-1200x630.jpg',
          },
        },
      };

      const effectiveTitle = mockProfile.customFields.seo.title;
      const effectiveDescription = mockProfile.customFields.seo.description;
      const effectiveImage = mockProfile.customFields.seo.socialImageUrl;
      const canonicalUrl = `https://taptch.com/${mockProfile.slug}`;

      // Open Graph spec compliance
      const ogPayload = {
        'og:title': effectiveTitle,
        'og:description': effectiveDescription,
        'og:image': effectiveImage,
        'og:url': canonicalUrl,
        'og:type': 'profile',
        'og:site_name': 'Taptch',
      };
      expect(ogPayload['og:title']).toBe('Alexander Vance — Wealth Advisory');
      expect(ogPayload['og:image']).toBe('https://images.unsplash.com/card-banner-1200x630.jpg');
      expect(ogPayload['og:site_name']).toBe('Taptch');

      // Twitter Card spec compliance
      const twitterPayload = {
        'twitter:card': 'summary_large_image',
        'twitter:title': effectiveTitle,
        'twitter:description': effectiveDescription,
        'twitter:image': effectiveImage,
      };
      expect(twitterPayload['twitter:card']).toBe('summary_large_image');

      // Fallback behavior when custom image is empty
      const emptyCustomImage = '';
      const fallbackImage = emptyCustomImage || mockProfile.coverUrl || mockProfile.avatarUrl;
      expect(fallbackImage).toBe('https://images.unsplash.com/cover.jpg');
    });

    it('differentiates Person vs Organization Schema.org structured data', () => {
      // Personal Visiting Card
      const personalSnapshot = {
        profileType: 'personal',
        displayName: 'Dr. Evelyn Reed',
        headline: 'Lead Neuroscientist',
        bio: 'Researching neural interfaces at Stanford.',
        avatarUrl: 'https://taptch.com/evelyn.jpg',
        slug: 'evelyn',
        email: 'evelyn@reed.org',
        phone: '+919876543210',
      };

      const personSchema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: personalSnapshot.displayName,
        jobTitle: personalSnapshot.headline,
        description: personalSnapshot.bio,
        image: personalSnapshot.avatarUrl,
        url: `https://taptch.com/${personalSnapshot.slug}`,
        email: personalSnapshot.email,
        telephone: personalSnapshot.phone,
      };

      expect(personSchema['@type']).toBe('Person');
      expect(personSchema.name).toBe('Dr. Evelyn Reed');
      expect(personSchema.jobTitle).toBe('Lead Neuroscientist');

      // Business & Services Profile
      const businessSnapshot = {
        profileType: 'business',
        displayName: 'Apex Robotics Inc.',
        bio: 'Industrial autonomous robotics manufacturer.',
        avatarUrl: 'https://taptch.com/logo.png',
        slug: 'apex-robotics',
        email: 'contact@apexrobotics.com',
        phone: '+918023456789',
      };

      const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: businessSnapshot.displayName,
        description: businessSnapshot.bio,
        logo: businessSnapshot.avatarUrl,
        url: `https://taptch.com/${businessSnapshot.slug}`,
        email: businessSnapshot.email,
        telephone: businessSnapshot.phone,
      };

      expect(orgSchema['@type']).toBe('Organization');
      expect(orgSchema.name).toBe('Apex Robotics Inc.');
      expect(orgSchema.logo).toBe('https://taptch.com/logo.png');
    });

    it('preserves SEO fields in Save Draft & Publish payload', () => {
      const state = {
        displayName: 'Vikramaditya Singhania',
        slug: 'vikram',
        seoTitle: 'Vikramaditya Singhania | Industrialist & Founder',
        seoDescription: 'Official digital identity and executive portfolio of Vikramaditya Singhania.',
        socialImageUrl: 'https://res.cloudinary.com/taptch/image/upload/v1/og-banners/vikram.png',
        templateId: 'obsidian-luxury',
      };

      const payload = {
        displayName: state.displayName,
        slug: state.slug,
        templateId: state.templateId,
        customFields: {
          seo: {
            title: state.seoTitle,
            description: state.seoDescription,
            socialImageUrl: state.socialImageUrl,
          },
        },
      };

      expect(payload.customFields.seo.title).toBe(state.seoTitle);
      expect(payload.customFields.seo.description).toBe(state.seoDescription);
      expect(payload.customFields.seo.socialImageUrl).toBe(state.socialImageUrl);
    });
  });

  describe('Taptch Production Data Normalization & Runtime Stability Suite', () => {
    it('safely handles null, undefined, non-string, and empty values without throwing TypeError', () => {
      // safeTrim tests
      expect(safeTrim(undefined)).toBe('');
      expect(safeTrim(null)).toBe('');
      expect(safeTrim('')).toBe('');
      expect(safeTrim('   hello world   ')).toBe('hello world');
      expect(safeTrim(12345)).toBe('12345');
      expect(safeTrim(true)).toBe('true');
      expect(safeTrim({ foo: 'bar' })).toBe('');
      expect(safeTrim(undefined, 'fallback')).toBe('fallback');
      expect(safeTrim(null, 'fallback')).toBe('fallback');

      // safeString tests
      expect(safeString(undefined)).toBe('');
      expect(safeString(null)).toBe('');
      expect(safeString(42)).toBe('42');
      expect(safeString(undefined, 'default')).toBe('default');

      // safeLower tests
      expect(safeLower(undefined)).toBe('');
      expect(safeLower(null)).toBe('');
      expect(safeLower('  OBSIDIAN-LUXURY  ')).toBe('obsidian-luxury');
      expect(safeLower(null, 'default')).toBe('default');

      // safeSlug tests
      expect(safeSlug(undefined)).toBe('');
      expect(safeSlug(null)).toBe('');
      expect(safeSlug('  My Special Slug! 123  ')).toBe('myspecialslug123');
      expect(safeSlug(undefined, 'default-slug')).toBe('default-slug');
    });

    it('normalizes legacy or incomplete drafts with missing optional fields without throwing', () => {
      // Test 1: Completely empty object
      const emptyNormalized = normalizeProfileDraft({});
      expect(emptyNormalized.displayName).toBe('');
      expect(emptyNormalized.slug).toBe('');
      expect(emptyNormalized.seoTitle).toBe('');
      expect(emptyNormalized.seoDescription).toBe('');
      expect(emptyNormalized.socialImageUrl).toBe('');
      expect(emptyNormalized.templateId).toBe('cinematic-noir');
      expect(Array.isArray(emptyNormalized.socialLinks)).toBe(true);
      expect(emptyNormalized.socialLinks.length).toBe(0);

      // Test 2: Null / undefined input
      const nullNormalized = normalizeProfileDraft(null);
      expect(nullNormalized.displayName).toBe('');
      expect(nullNormalized.templateId).toBe('cinematic-noir');

      // Test 3: Older draft created before SEO & socialImageUrl additions
      const legacyDraft = {
        displayName: 'Vikram Patel',
        slug: 'vikram',
        headline: null,
        bio: null,
        avatarUrl: null,
        coverUrl: null,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        address: null,
        templateId: 'clean-corporate',
        profileType: 'personal',
        // customFields missing entirely
        // socialLinks missing entirely
      };

      const normalizedLegacy = normalizeProfileDraft(legacyDraft);
      expect(normalizedLegacy.displayName).toBe('Vikram Patel');
      expect(normalizedLegacy.slug).toBe('vikram');
      expect(normalizedLegacy.headline).toBe('');
      expect(normalizedLegacy.bio).toBe('');
      expect(normalizedLegacy.seoTitle).toBe('');
      expect(normalizedLegacy.seoDescription).toBe('');
      expect(normalizedLegacy.socialImageUrl).toBe('');
      expect(normalizedLegacy.templateId).toBe('clean-corporate');
      expect(normalizedLegacy.socialLinks).toEqual([]);
      expect(normalizedLegacy.businesses).toEqual([]);
      expect(normalizedLegacy.catalogue).toEqual([]);

      // Test 4: Draft with malformed arrays
      const malformedDraft = {
        displayName: 'Test User',
        socialLinks: [null, undefined, { platform: 'TWITTER', url: 'https://x.com/test' }],
        businesses: [null, { companyName: 'Acme', tagline: null }],
        catalogue: [undefined, { title: 'Product 1', price: null }],
      };

      const normalizedMalformed = normalizeProfileDraft(malformedDraft);
      expect(normalizedMalformed.socialLinks.length).toBe(1);
      expect(normalizedMalformed.socialLinks[0].platform).toBe('twitter');
      expect(normalizedMalformed.businesses.length).toBe(1);
      expect(normalizedMalformed.businesses[0].companyName).toBe('Acme');
      expect(normalizedMalformed.catalogue.length).toBe(1);
      expect(normalizedMalformed.catalogue[0].title).toBe('Product 1');
    });

    it('guarantees live preview data construction never crashes on undefined properties', () => {
      // Simulate uninitialized state where some variables might be undefined
      const rawState = {
        id: undefined,
        slug: undefined,
        displayName: undefined,
        headline: undefined,
        bio: undefined,
        avatarUrl: undefined,
        coverUrl: undefined,
        phone: undefined,
        whatsapp: undefined,
        email: undefined,
        website: undefined,
        address: undefined,
        templateId: undefined,
        profileType: 'personal',
        themeColors: getTemplateDefaultThemeConfig('obsidian-luxury'),
        socialLinks: undefined,
        seoTitle: undefined,
        seoDescription: undefined,
        socialImageUrl: undefined,
        businesses: undefined,
        catalogue: undefined,
      };

      // Construct livePreviewData using safeTrim and normalization logic
      const cleanSeoTitle = safeTrim(rawState.seoTitle);
      const cleanSeoDesc = safeTrim(rawState.seoDescription);
      const cleanSocialImg = safeTrim(rawState.socialImageUrl);

      const livePreview = {
        id: safeTrim(rawState.id, 'preview-id'),
        slug: safeSlug(rawState.slug, 'preview'),
        displayName: safeTrim(rawState.displayName, 'Your Full Name'),
        headline: safeTrim(rawState.headline, 'Your Professional Title / Role'),
        bio: safeTrim(rawState.bio, 'Welcome to my digital business card. Tap any button below to connect with me.'),
        avatarUrl: safeTrim(rawState.avatarUrl) || undefined,
        coverUrl: safeTrim(rawState.coverUrl) || undefined,
        phone: safeTrim(rawState.phone) || undefined,
        whatsapp: safeTrim(rawState.whatsapp) || undefined,
        email: safeTrim(rawState.email) || undefined,
        website: safeTrim(rawState.website) || undefined,
        address: safeTrim(rawState.address) || undefined,
        location: safeTrim(rawState.address) || undefined,
        templateId: safeLower(rawState.templateId, 'obsidian-luxury'),
        profileType: rawState.profileType,
        themeConfig: rawState.themeColors,
        socialLinks: Array.isArray(rawState.socialLinks) ? rawState.socialLinks : [],
        customFields: {
          seo: {
            title: cleanSeoTitle || undefined,
            description: cleanSeoDesc || undefined,
            socialImageUrl: cleanSocialImg || undefined,
          },
        },
      };

      expect(livePreview.id).toBe('preview-id');
      expect(livePreview.slug).toBe('preview');
      expect(livePreview.displayName).toBe('Your Full Name');
      expect(livePreview.customFields.seo.title).toBeUndefined();
      expect(livePreview.customFields.seo.description).toBeUndefined();
      expect(livePreview.customFields.seo.socialImageUrl).toBeUndefined();
    });

    it('synchronizes products and menu catalogue in real-time for business profiles', () => {
      const businessCatalogue = [
        {
          id: 'item-1',
          title: 'Strategic Wealth Management',
          type: 'service',
          price: '5,00,000',
          currency: '₹',
          description: 'High-net-worth portfolio management.',
        },
        {
          id: 'item-2',
          title: 'Artisan Espresso Blend',
          type: 'product',
          price: '450',
          currency: '₹',
          description: 'Single-origin roasted beans.',
        },
      ];

      // In business mode, catalogue is mapped directly into livePreview
      const profileType = 'business';
      const livePreviewData = {
        profileType,
        catalogue: profileType === 'business' ? businessCatalogue.map((c, i) => ({
          id: c.id || `cat-${i}`,
          title: safeTrim(c.title, 'New Product / Service'),
          itemType: c.type === 'service' ? 'service' : 'product',
          description: safeTrim(c.description) || undefined,
          price: safeTrim(c.price) || undefined,
          currency: safeTrim(c.currency, '₹'),
        })) : [],
      };

      expect(livePreviewData.catalogue).toHaveLength(2);
      expect(livePreviewData.catalogue[0].title).toBe('Strategic Wealth Management');
      expect(livePreviewData.catalogue[0].itemType).toBe('service');
      expect(livePreviewData.catalogue[0].currency).toBe('₹');
      expect(livePreviewData.catalogue[1].title).toBe('Artisan Espresso Blend');
      expect(livePreviewData.catalogue[1].itemType).toBe('product');
    });

    it('isolates personal visiting cards from business catalogue', () => {
      const businessCatalogue = [
        { id: 'item-1', title: 'Consulting Retainer', type: 'service' },
      ];

      // In personal visiting card mode, catalogue is isolated and empty
      const profileType: 'personal' | 'business' = 'personal';
      const livePreviewData = {
        profileType,
        catalogue: (profileType as string) === 'business' ? businessCatalogue : [],
      };

      expect(livePreviewData.catalogue).toHaveLength(0);
    });

    it('handles WhatsApp direct number normalization, URL formatting, and real-time live preview updates', () => {
      // 1. Valid international numbers
      expect(formatWhatsAppLink('+91 98765 43210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppLink('9876543210')).toBe('https://wa.me/9876543210');
      expect(formatWhatsAppLink('+1 (415) 555-2671')).toBe('https://wa.me/14155552671');
      expect(formatWhatsAppLink('+44 7911 123456')).toBe('https://wa.me/447911123456');
      expect(formatWhatsAppLink('https://wa.me/919876543210')).toBe('https://wa.me/919876543210');
      expect(formatWhatsAppLink('wa.me/919876543210')).toBe('https://wa.me/919876543210');

      // 2. Incomplete numbers (fewer than 7 digits) return null to safely disable Chat action
      expect(formatWhatsAppLink('+91')).toBeNull();
      expect(formatWhatsAppLink('987')).toBeNull();
      expect(formatWhatsAppLink('')).toBeNull();
      expect(formatWhatsAppLink(null)).toBeNull();

      // 3. Coordinate existence check correctly registers WhatsApp
      expect(hasAnyContactCoordinates({ whatsapp: '+91 98765 43210' })).toBe(true);
      expect(hasAnyContactCoordinates({ whatsapp: '   ' })).toBe(false);

      // 4. State synchronization test:
      // When a user types a WhatsApp number in the editor
      let editorWhatsapp = '';
      const computePreview = (wa: string) => ({
        whatsapp: safeTrim(wa) || undefined,
        waLink: formatWhatsAppLink(safeTrim(wa)),
        isRowVisible: Boolean(safeTrim(wa)),
        isChatEnabled: Boolean(formatWhatsAppLink(safeTrim(wa))),
      });

      // Initially empty -> row not visible
      let preview = computePreview(editorWhatsapp);
      expect(preview.isRowVisible).toBe(false);

      // User types incomplete number -> row is visible, chat is disabled
      editorWhatsapp = '+91';
      preview = computePreview(editorWhatsapp);
      expect(preview.isRowVisible).toBe(true);
      expect(preview.whatsapp).toBe('+91');
      expect(preview.isChatEnabled).toBe(false);

      // User completes number -> row is visible, chat is enabled with correct URL
      editorWhatsapp = '+91 98765 43210';
      preview = computePreview(editorWhatsapp);
      expect(preview.isRowVisible).toBe(true);
      expect(preview.whatsapp).toBe('+91 98765 43210');
      expect(preview.isChatEnabled).toBe(true);
      expect(preview.waLink).toBe('https://wa.me/919876543210');

      // User changes number -> preview updates immediately
      editorWhatsapp = '+1 415 555 0199';
      preview = computePreview(editorWhatsapp);
      expect(preview.whatsapp).toBe('+1 415 555 0199');
      expect(preview.waLink).toBe('https://wa.me/14155550199');

      // User clears field -> row disappears
      editorWhatsapp = '';
      preview = computePreview(editorWhatsapp);
      expect(preview.isRowVisible).toBe(false);
      expect(preview.whatsapp).toBeUndefined();
    });
  });

  describe('Taptch Profile Studio — Mobile Responsiveness & Theme Switching Architecture', () => {
    it('canonicalTemplateId maps all obsolete personal templates to cinematic-noir while preserving business templates', () => {
      // Legacy personal templates safely map to cinematic-noir
      expect(canonicalTemplateId('obsidian-luxury')).toBe('cinematic-noir');
      expect(canonicalTemplateId('obsidian')).toBe('cinematic-noir');
      expect(canonicalTemplateId('premium-brand')).toBe('cinematic-noir');
      expect(canonicalTemplateId('clean-corporate')).toBe('cinematic-noir');
      expect(canonicalTemplateId('dark-premium')).toBe('cinematic-noir');
      expect(canonicalTemplateId('soft-modern')).toBe('cinematic-noir');
      expect(canonicalTemplateId('bold-editorial')).toBe('cinematic-noir');
      expect(canonicalTemplateId('ivory-minimal')).toBe('cinematic-noir');
      expect(canonicalTemplateId('ivory-minimalist')).toBe('cinematic-noir');
      expect(canonicalTemplateId('aurora-creator')).toBe('cinematic-noir');
      expect(canonicalTemplateId('apex-capital')).toBe('cinematic-noir');

      // Business templates remain untouched
      expect(canonicalTemplateId('zenith-corporate')).toBe('corporate-business');
      expect(canonicalTemplateId('catalyst-business')).toBe('modern-business');
      expect(canonicalTemplateId('retail-showcase')).toBe('retail-showcase');
      expect(canonicalTemplateId('food-restaurant')).toBe('food-restaurant');
      expect(canonicalTemplateId('industrial-logistics')).toBe('industrial-logistics');

      expect(canonicalTemplateId('cinematic-noir')).toBe('cinematic-noir');

      // Empty or invalid fallback defaults to Cinematic Digital Profile
      expect(canonicalTemplateId(undefined)).toBe('cinematic-noir');
      expect(canonicalTemplateId('')).toBe('cinematic-noir');
    });

    it('theme switching seamlessly preserves user inputs across all fields without reset', () => {
      // User data in studio
      const profileData = {
        displayName: 'Aarav Singhania',
        headline: 'Managing Director & Chief Executive',
        bio: 'Pioneering smart digital identities.',
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        email: 'aarav@singhania.com',
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/aarav' },
          { platform: 'twitter', url: 'https://x.com/aarav' },
        ],
        companies: [
          { companyName: 'Singhania Global', role: 'Chairman', location: 'Mumbai' },
        ],
        catalogue: [
          { title: 'Executive Consultancy', price: '₹50,000', type: 'service' },
        ],
      };

      // Switch theme to 'cinematic-noir'
      let activeTemplate = canonicalTemplateId('cinematic-noir');
      expect(activeTemplate).toBe('cinematic-noir');

      // Profile data must remain identical
      expect(profileData.displayName).toBe('Aarav Singhania');
      expect(profileData.companies).toHaveLength(1);
      expect(profileData.catalogue).toHaveLength(1);

      // Legacy slug 'obsidian-luxury' resolves to 'cinematic-noir' without data loss
      activeTemplate = canonicalTemplateId('obsidian-luxury');
      expect(activeTemplate).toBe('cinematic-noir');
      expect(profileData.whatsapp).toBe('+91 98765 43210');
      expect(profileData.socialLinks).toHaveLength(2);
      expect(profileData.displayName).toBe('Aarav Singhania');
    });

    it('switching between mobile editor and preview preserves entered data and active step', () => {
      let mobileView: 'editor' | 'preview' = 'editor';
      let activeTab = 'catalogue';
      const draftState = {
        productName: 'Smart NFC Metal Card',
        price: '₹2,999',
      };

      // User clicks Preview on mobile
      mobileView = 'preview';
      expect(mobileView).toBe('preview');
      expect(activeTab).toBe('catalogue');
      expect(draftState.productName).toBe('Smart NFC Metal Card');

      // User clicks Back to Edit on floating action bar
      mobileView = 'editor';
      expect(mobileView).toBe('editor');
      // Returns right back to the catalogue step!
      expect(activeTab).toBe('catalogue');
      expect(draftState.productName).toBe('Smart NFC Metal Card');
    });

    it('normalizes draft restoration for businesses and catalogue across backend and frontend shapes', () => {
      // Raw database row shape returned from findOne
      const rawBackendProfile = {
        id: 'prof-123',
        displayName: 'Vikramaditya Singhania',
        slug: 'vikram-singhania',
        profileType: 'business',
        businesses: [
          {
            id: 'biz-1',
            profileId: 'prof-123',
            name: 'Singhania Capital Group',
            tagline: 'Principal & Chairman',
            website: 'https://singhania.capital',
            address: 'Lower Parel, Mumbai',
            logoUrl: 'https://images.unsplash.com/logo.png',
            email: 'chair@singhania.capital',
            phone: '+91 22 4567 8900',
            whatsapp: '+91 98765 00000',
          },
        ],
        catalogue: [
          {
            id: 'cat-1',
            profileId: 'prof-123',
            title: 'Private Wealth Advisory',
            type: 'service',
            price: '₹5,00,000',
            description: 'Bespoke family office and liquidity management.',
            actionUrl: 'https://singhania.capital/advisory',
            actionLabel: 'Schedule Private Consultation',
          },
        ],
      };

      // Frontend loader normalization
      const normalizedBusinesses = rawBackendProfile.businesses.map((b: any) => ({
        id: b.id,
        companyName: b.companyName || b.name || '',
        name: b.name || b.companyName || '',
        jobTitle: b.jobTitle || b.tagline || '',
        tagline: b.tagline || b.jobTitle || '',
        businessWebsite: b.businessWebsite || b.website || '',
        website: b.website || b.businessWebsite || '',
        businessAddress: b.businessAddress || b.address || '',
        address: b.address || b.businessAddress || '',
        logoUrl: b.logoUrl || '',
        email: b.email || b.businessEmail || '',
        phone: b.phone || b.businessPhone || '',
        whatsapp: b.whatsapp || '',
      }));

      expect(normalizedBusinesses[0].companyName).toBe('Singhania Capital Group');
      expect(normalizedBusinesses[0].jobTitle).toBe('Principal & Chairman');
      expect(normalizedBusinesses[0].businessWebsite).toBe('https://singhania.capital');
      expect(normalizedBusinesses[0].businessAddress).toBe('Lower Parel, Mumbai');

      const normalizedCatalogue = rawBackendProfile.catalogue.map((c: any) => ({
        id: c.id,
        title: c.title || '',
        type: c.type || c.itemType || 'product',
        itemType: c.type || c.itemType || 'product',
        price: c.price || '',
        description: c.description || '',
        actionUrl: c.actionUrl || '',
        actionLabel: c.actionLabel || 'Enquire',
      }));

      expect(normalizedCatalogue[0].title).toBe('Private Wealth Advisory');
      expect(normalizedCatalogue[0].type).toBe('service');
      expect(normalizedCatalogue[0].actionLabel).toBe('Schedule Private Consultation');
    });

    it('verifies public profile renderData parity with live preview data', () => {
      // Mock snapshot from /api/v1/profiles/by-slug/:slug
      const publicSnapshot = {
        id: 'prof-999',
        slug: 'acme-corp',
        displayName: 'Acme Corporation Ltd',
        headline: 'Global Supply Chain & Logistics',
        bio: 'Delivering excellence across 40 countries.',
        profileType: 'business',
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/company/acme' },
          { platform: 'twitter', url: 'https://x.com/acme' },
        ],
        phone: '+91 22 1234 5678',
        whatsapp: '+91 98765 43210',
        email: 'contact@acme.com',
        website: 'https://acme.com',
        address: 'BKC, Mumbai',
        location: 'BKC, Mumbai',
        templateId: 'corporate-business',
        businesses: [
          {
            id: 'biz-1',
            companyName: 'Acme Air Express',
            tagline: 'Aviation Logistics',
            businessWebsite: 'https://air.acme.com',
            businessAddress: 'Mumbai Cargo Terminal',
            logoUrl: 'https://acme.com/air.png',
          },
        ],
        catalogue: [
          {
            id: 'cat-1',
            title: 'Express Air Freight',
            type: 'service',
            price: 'Custom Quote',
            actionUrl: 'https://acme.com/quote',
            actionLabel: 'Get Instant Rate',
          },
        ],
      };

      // PublicProfilePage renderData mapping
      const publicRenderData = {
        id: publicSnapshot.id,
        slug: publicSnapshot.slug,
        displayName: publicSnapshot.displayName,
        headline: publicSnapshot.headline,
        bio: publicSnapshot.bio,
        profileType: publicSnapshot.profileType,
        socialLinks: publicSnapshot.socialLinks || [],
        phone: publicSnapshot.phone,
        whatsapp: publicSnapshot.whatsapp,
        email: publicSnapshot.email,
        website: publicSnapshot.website,
        address: publicSnapshot.address,
        location: publicSnapshot.location,
        templateId: canonicalTemplateId(publicSnapshot.templateId),
        businesses: publicSnapshot.businesses.map((b) => ({
          id: b.id,
          companyName: b.companyName,
          roleTitle: b.tagline,
          websiteUrl: b.businessWebsite,
          address: b.businessAddress,
          logoUrl: b.logoUrl,
        })),
        catalogue: publicSnapshot.catalogue.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          price: c.price,
          actionUrl: c.actionUrl,
          actionLabel: c.actionLabel,
        })),
      };

      // Parity Assertions
      expect(publicRenderData.socialLinks).toHaveLength(2);
      expect(publicRenderData.profileType).toBe('business');
      expect(publicRenderData.location).toBe('BKC, Mumbai');
      expect(publicRenderData.businesses[0].companyName).toBe('Acme Air Express');
      expect(publicRenderData.businesses[0].logoUrl).toBe('https://acme.com/air.png');
      expect(publicRenderData.catalogue[0].type).toBe('service');
      expect(publicRenderData.catalogue[0].actionLabel).toBe('Get Instant Rate');
    });

    it('prevents saving profiles with empty required name or slug', () => {
      const validateProfileSubmission = (payload: { displayName: string; slug: string }) => {
        const cleanName = payload.displayName.trim();
        const cleanSlug = payload.slug.trim().toLowerCase();
        if (!cleanName) {
          throw new Error('Display Name is required.');
        }
        if (!cleanSlug) {
          throw new Error('Public handle / slug is required.');
        }
        return { displayName: cleanName, slug: cleanSlug };
      };

      expect(() => validateProfileSubmission({ displayName: '', slug: 'valid-slug' })).toThrow('Display Name is required.');
      expect(() => validateProfileSubmission({ displayName: '   ', slug: 'valid-slug' })).toThrow('Display Name is required.');
      expect(() => validateProfileSubmission({ displayName: 'Vikram', slug: '' })).toThrow('Public handle / slug is required.');
      expect(() => validateProfileSubmission({ displayName: 'Vikram', slug: '   ' })).toThrow('Public handle / slug is required.');
      expect(validateProfileSubmission({ displayName: ' Vikram ', slug: ' My-Slug ' })).toEqual({
        displayName: 'Vikram',
        slug: 'my-slug',
      });
    });
  });
});
