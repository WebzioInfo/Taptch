import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface TemplateDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'minimal' | 'luxury' | 'creator' | 'corporate' | 'business' | 'retail' | 'food' | 'industrial';
  thumbnailUrl: string;
  premiumTier: 'nano' | 'micro' | 'mini' | 'max';
  defaultColors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
  };
  features: string[];
}

export const SEEDED_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'clean-corporate',
    slug: 'clean-corporate',
    name: 'Clean Corporate',
    description: 'Structured enterprise navy and titanium precision card layout with crisp typography and clean borders.',
    category: 'corporate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#0A2540', background: '#F1F5F9', surface: '#FFFFFF', text: '#0F172A' },
    features: ['Deep Navy Theme', 'Save Contact vCard', 'Associated Ventures', 'Direct Coordinates'],
  },
  {
    id: 'dark-premium',
    slug: 'dark-premium',
    name: 'Dark Premium',
    description: 'Near-black background, restrained champagne gold accent, high contrast, and generous architectural spacing.',
    category: 'luxury',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#C5A880', background: '#08090A', surface: '#121316', text: '#F4F4F6' },
    features: ['Champagne Gold Accent', 'Executive Hero Name', 'Portfolio & Companies', 'Encrypted V-Card'],
  },
  {
    id: 'soft-modern',
    slug: 'soft-modern',
    name: 'Soft Modern',
    description: 'Warm neutral stone palette, large rounded photo, airy editorial layout, and contemporary Fraunces serif heading.',
    category: 'minimal',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#24352D', background: '#F6F4EE', surface: '#FFFFFF', text: '#23201D' },
    features: ['Fraunces Serif Display', 'Pill Button Geometry', 'Founding Companies Monograms', 'Warm Stone Card'],
  },
  {
    id: 'bold-editorial',
    slug: 'bold-editorial',
    name: 'Bold Editorial',
    description: 'Swiss magazine dossier layout, oversized Space Grotesk typography, razor-thin black divider rules, and spec table.',
    category: 'creator',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#000000', background: '#ECECEC', surface: '#FFFFFF', text: '#000000' },
    features: ['Space Grotesk Typography', 'Dossier Colophon', 'Spec Table Grid', 'Magazine Index List'],
  },
  {
    id: 'obsidian-luxury',
    slug: 'obsidian-luxury',
    name: 'Obsidian Luxury',
    description: 'Our flagship aesthetic: deep obsidian charcoal paired with brushed metallic gold and VIP verified shield.',
    category: 'luxury',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#D4AF37', background: '#0A0A0C', surface: '#121216', text: '#F4F4F6' },
    features: ['Obsidian Luxury Theme', 'vCard 3.0 Instant Save', 'VIP Verified Shield', 'High-Contrast Cards'],
  },
  {
    id: 'ivory-minimalist',
    slug: 'ivory-minimalist',
    name: 'Ivory Minimalist',
    description: 'Warm alabaster editorial aesthetic with timeless serif typography and subtle dividers for legal & advisory.',
    category: 'luxury',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#8C6D3B', background: '#FAF8F5', surface: '#FFFFFF', text: '#1C1917' },
    features: ['Editorial Serif Typography', 'Partner Credentials', 'Chambers Location', 'Discreet vCard'],
  },
  {
    id: 'aurora-creator',
    slug: 'aurora-creator',
    name: 'Aurora Creator',
    description: 'Vibrant neon-infused glassmorphism crafted for digital creatives, founders, agency owners, and artists.',
    category: 'creator',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'micro',
    defaultColors: { primary: '#A855F7', background: '#0B0D1B', surface: '#151833', text: '#F8FAFC' },
    features: ['Glassmorphic Backdrop Blur', 'Visual Portfolio Grid', 'Social Link Showcase', 'Interactive Project Cards'],
  },
  {
    id: 'corporate-business',
    slug: 'corporate-business',
    name: 'Corporate Business',
    description: 'Structured enterprise navy and titanium precision grid for executives, board directors, and M&A holding groups.',
    category: 'corporate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'mini',
    defaultColors: { primary: '#2563EB', background: '#0B0F19', surface: '#111827', text: '#F8FAFC' },
    features: ['Executive Header', 'Corporate Credentials', 'Venture Switcher', 'B2B Enquiry Form'],
  },
  {
    id: 'modern-business',
    slug: 'modern-business',
    name: 'Modern Business',
    description: 'Commercial showcase design featuring dedicated product shelves, service cards, and quick lead capture.',
    category: 'business',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'mini',
    defaultColors: { primary: '#059669', background: '#064E3B', surface: '#065F46', text: '#ECFDF5' },
    features: ['Product/Service Showcase', 'Dual Tab Navigation', 'Contact Exchange', 'Fast Booking'],
  },
  {
    id: 'apex-capital',
    slug: 'apex-capital',
    name: 'Apex Capital & Wealth',
    description: 'Prestige emerald and dark graphite tailored for luxury developers, venture capital, and private wealth.',
    category: 'corporate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'max',
    defaultColors: { primary: '#10B981', background: '#022C22', surface: '#064E3B', text: '#F0FDFA' },
    features: ['Prestige Luxury Styling', 'Private Off-Market Assets', 'Escrow Concierge', 'VIP Wealth Advisory'],
  },
  {
    id: 'industrial-manufacturing',
    slug: 'industrial-manufacturing',
    name: 'Industrial & Manufacturing',
    description: 'Heavy machinery, plant specs, technical PDF brochures, and direct RFQ engineering enquiry.',
    category: 'industrial',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'mini',
    defaultColors: { primary: '#D97706', background: '#0F172A', surface: '#1E293B', text: '#F8FAFC' },
    features: ['Machinery Catalogue', 'Technical PDF Specs', 'Plant Location', 'Direct RFQ Quotation'],
  },
  {
    id: 'retail-shopping',
    slug: 'retail-shopping',
    name: 'Retail & Storefront',
    description: 'Vibrant storefront with product gallery, INR price tags, store hours, and direct WhatsApp ordering.',
    category: 'retail',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'micro',
    defaultColors: { primary: '#E11D48', background: '#0F172A', surface: '#1E293B', text: '#FFF1F2' },
    features: ['Storefront Product Grid', 'WhatsApp Quick Buy', 'Opening Hours Badge', 'Physical Store Location'],
  },
  {
    id: 'food-restaurant',
    slug: 'food-restaurant',
    name: 'Food & Restaurant',
    description: 'Culinary layout with signature menu cards, chef specialties, opening timings, and table reservation enquiry.',
    category: 'food',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'micro',
    defaultColors: { primary: '#EA580C', background: '#18181B', surface: '#27272A', text: '#FFF7ED' },
    features: ['Chef Specials Showcase', 'Menu Pricing & Categories', 'Table Reservation', 'Kitchen Timings'],
  },
];

@Injectable()
export class TemplatesService {
  constructor(private dbService: DatabaseService) {}

  async findAll() {
    try {
      const dbTemplates = await this.dbService.db.select().from(schema.templates);
      if (dbTemplates.length > 0) return dbTemplates;
    } catch {
      // Fallback
    }
    return SEEDED_TEMPLATES;
  }

  async findOne(id: string) {
    const list = await this.findAll();
    const found = list.find((t) => t.id === id || t.slug === id);
    if (!found) {
      throw new NotFoundException(`Template "${id}" not found.`);
    }
    return found;
  }
}
