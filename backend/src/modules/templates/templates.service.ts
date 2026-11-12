import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'luxury' | 'creator' | 'corporate';
  thumbnailUrl: string;
  premiumTier: 'free' | 'mini' | 'max';
  defaultColors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
  };
}

export const SEEDED_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    description: 'Understated elegance with high contrast typography and clean hierarchy.',
    category: 'minimal',
    thumbnailUrl: '/templates/previews/executive-minimal.png',
    premiumTier: 'free',
    defaultColors: { primary: '#18181B', background: '#FAFAFA', surface: '#FFFFFF', text: '#09090B' },
  },
  {
    id: 'onyx-minimal',
    name: 'Onyx Minimal',
    description: 'Sleek dark mode minimalism tailored for technology leaders and architects.',
    category: 'minimal',
    thumbnailUrl: '/templates/previews/onyx-minimal.png',
    premiumTier: 'free',
    defaultColors: { primary: '#E4E4E7', background: '#09090B', surface: '#18181B', text: '#FAFAFA' },
  },
  {
    id: 'obsidian-luxury',
    name: 'Obsidian Luxury',
    description: 'Our flagship aesthetic: deep obsidian charcoal paired with brushed metallic gold.',
    category: 'luxury',
    thumbnailUrl: '/templates/previews/obsidian-luxury.png',
    premiumTier: 'free',
    defaultColors: { primary: '#D4AF37', background: '#0A0A0C', surface: '#121216', text: '#F4F4F6' },
  },
  {
    id: 'ivory-minimalist',
    name: 'Ivory Minimalist',
    description: 'Warm editorial paper aesthetic inspired by bespoke stationary.',
    category: 'luxury',
    thumbnailUrl: '/templates/previews/ivory-minimalist.png',
    premiumTier: 'mini',
    defaultColors: { primary: '#2D2824', background: '#F8F6F0', surface: '#FFFFFF', text: '#1C1917' },
  },
  {
    id: 'aurora-creator',
    name: 'Aurora Creator',
    description: 'Vibrant fluid glassmorphism crafted for digital creatives and founders.',
    category: 'creator',
    thumbnailUrl: '/templates/previews/aurora-creator.png',
    premiumTier: 'mini',
    defaultColors: { primary: '#8B5CF6', background: '#0D0E15', surface: '#181A26', text: '#F8FAFC' },
  },
  {
    id: 'apex-capital',
    name: 'Apex Capital',
    description: 'Refined corporate prestige engineered for venture partners and private equity.',
    category: 'corporate',
    thumbnailUrl: '/templates/previews/apex-capital.png',
    premiumTier: 'max',
    defaultColors: { primary: '#0D9488', background: '#021C1E', surface: '#062B2F', text: '#F0FDFA' },
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
    const found = list.find((t) => t.id === id);
    if (!found) {
      throw new NotFoundException(`Template "${id}" not found.`);
    }
    return found;
  }
}
