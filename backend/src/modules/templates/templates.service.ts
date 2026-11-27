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
  templateType: 'PERSONAL' | 'BUSINESS';
  supportedProfileTypes: ('personal' | 'business')[];
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
    id: 'cinematic-noir',
    slug: 'cinematic-noir',
    name: 'Cinematic Digital Profile',
    description:
      'Atmospheric dark editorial layout with an interactive curtain reveal, full-bleed portrait hero, numbered ventures roster, and instant UPI & vCard terminal.',
    category: 'luxury',
    templateType: 'PERSONAL',
    supportedProfileTypes: ['personal'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#0866F8', background: '#0A0A0B', surface: '#121215', text: '#F4F4F6' },
    features: [
      'Cinematic Curtain Intro',
      'Full-Bleed Portrait Hero',
      'Editorial Ventures Roster',
      'Instant vCard & UPI Terminal',
    ],
  },
  {
    id: 'dark-premium',
    slug: 'dark-premium',
    name: 'Dark Premium',
    description:
      'Near-black architectural layout with restrained champagne accent, bold typography, high contrast, and generous spacing.',
    category: 'luxury',
    templateType: 'PERSONAL',
    supportedProfileTypes: ['personal', 'business'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    premiumTier: 'nano',
    defaultColors: { primary: '#C5A880', background: '#08090A', surface: '#121316', text: '#F4F4F6' },
    features: [
      'Champagne Gold Accent',
      'Plus Jakarta Sans Typography',
      'Ventures & Catalogue Support',
      'Direct Coordinates & vCard',
    ],
  },
];

@Injectable()
export class TemplatesService {
  constructor(private dbService: DatabaseService) {}

  async findAll(filter?: { accountType?: 'personal' | 'business'; templateType?: 'PERSONAL' | 'BUSINESS' }) {
    // Phase 1 Profile Redesign: expose only the newly redesigned active template(s).
    // Slot 2 is reserved for Phase 2 and intentionally omitted until implemented.
    let list = SEEDED_TEMPLATES;

    if (filter?.templateType) {
      list = list.filter((t) => t.templateType === filter.templateType);
    } else if (filter?.accountType) {
      const targetType = filter.accountType.toUpperCase() as 'PERSONAL' | 'BUSINESS';
      list = list.filter(
        (t) =>
          t.templateType === targetType ||
          (t.supportedProfileTypes && t.supportedProfileTypes.includes(filter.accountType!))
      );
    }

    return list;
  }

  async findOne(id: string) {
    const list = await this.findAll();
    const found = list.find((t) => t.id === id || t.slug === id);
    if (found) return found;

    // Fallback check in DB for legacy references without exposing them in findAll()
    try {
      const [dbTemplate] = await this.dbService.db
        .select()
        .from(schema.templates)
        .where(eq(schema.templates.id, id));
      if (dbTemplate) return dbTemplate;
    } catch {
      // Ignore DB fallback errors
    }

    throw new NotFoundException(`Template "${id}" not found.`);
  }
}
