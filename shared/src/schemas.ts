import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z.string().trim().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.').optional(),
  headline: z.string().trim().nullable().optional(),
  bio: z.string().trim().nullable().optional(),
  avatarUrl: z.string().trim().nullable().optional(),
  coverUrl: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  whatsapp: z.string().trim().nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal('')),
  website: z.string().trim().url().nullable().optional().or(z.literal('')),
  address: z.string().trim().nullable().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  themeId: z.string().optional(),
  customThemeColors: z.record(z.string(), z.string()).nullable().optional(),
});

export const createLeadSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required.'),
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  quantity: z.number().int().min(1).default(1),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1).default('India'),
    phone: z.string().min(10),
  }),
  cardMaterial: z.enum(['metal', 'matte_black_pvc', 'wood']).default('matte_black_pvc'),
  profileId: z.string().optional(),
});

export const dynamicQrCreateSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  destinationUrl: z.string().url('A valid destination URL is required.'),
  categoryId: z.string().optional(),
  groupId: z.string().optional(),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type DynamicQrCreateInput = z.infer<typeof dynamicQrCreateSchema>;
