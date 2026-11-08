import { pgTable, text, timestamp, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 64 }).primaryKey().default('default'),
  brandName: varchar('brand_name', { length: 128 }).notNull().default('TAPTCH'),
  brandTagline: text('brand_tagline').default('Intelligent Digital Identity & Smart Networking'),
  brandLogoUrl: text('brand_logo_url').default('/assets/brand/logo.svg'),
  brandColors: jsonb('brand_colors').$type<{
    primary: string;
    secondary: string;
    accent: string;
    obsidianGold: string;
  }>().notNull().default({
    primary: '#D4AF37',
    secondary: '#141418',
    accent: '#38BDF8',
    obsidianGold: '#D4AF37',
  }),
  contactEmail: varchar('contact_email', { length: 255 }).default('support@taptch.com'),
  customDomainCname: varchar('custom_domain_cname', { length: 255 }).default('domains.taptch.com'),
  featuresEnabled: jsonb('features_enabled').$type<{
    enablePublicRegistration: boolean;
    enableGoogleAuth: boolean;
    enablePhoneOtp: boolean;
    enableWalletPasses: boolean;
    enableCustomDomains: boolean;
  }>().notNull().default({
    enablePublicRegistration: true,
    enableGoogleAuth: false,
    enablePhoneOtp: true,
    enableWalletPasses: false,
    enableCustomDomains: true,
  }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description'),
  targetOrganizations: jsonb('target_organizations').$type<string[]>().default([]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

