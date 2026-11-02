import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name cannot be empty')
    .max(128, 'Display name cannot exceed 128 characters')
    .optional(),
  headline: z.string().max(255, 'Headline cannot exceed 255 characters').nullish(),
  bio: z.string().max(5000, 'Bio cannot exceed 5000 characters').nullish(),
  avatarUrl: z.string().nullish(),
  coverUrl: z.string().nullish(),
  templateId: z.string().nullish(),
  themeConfig: z.record(z.unknown()).nullish(),
  phone: z.string().max(50, 'Phone cannot exceed 50 characters').nullish(),
  whatsapp: z.string().max(50, 'WhatsApp cannot exceed 50 characters').nullish(),
  email: z.string().email('Invalid email address format').or(z.literal('')).nullish(),
  website: z.string().nullish(),
  address: z.string().max(500, 'Address cannot exceed 500 characters').nullish(),
  location: z.string().max(255, 'Location cannot exceed 255 characters').nullish(),
  socialLinks: z
    .union([
      z.record(z.unknown()),
      z.array(
        z.object({
          platform: z.string().min(1, 'Social platform is required'),
          url: z.string().min(1, 'Social URL is required'),
        })
      ),
    ])
    .nullish(),
  skills: z.array(z.string().min(1)).nullish(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        period: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .nullish(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        year: z.string().optional(),
      })
    )
    .nullish(),
  achievements: z
    .array(
      z.object({
        title: z.string(),
        year: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .nullish(),
  portfolio: z
    .array(
      z.object({
        title: z.string(),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .nullish(),
  gallery: z
    .array(
      z.object({
        url: z.string(),
        caption: z.string().optional(),
      })
    )
    .nullish(),
  videos: z
    .array(
      z.object({
        title: z.string(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
      })
    )
    .nullish(),
  brochures: z
    .array(
      z.object({
        title: z.string(),
        fileUrl: z.string(),
        fileSize: z.string().optional(),
      })
    )
    .nullish(),
  customFields: z.record(z.unknown()).nullish(),
  status: z
    .enum([
      'DRAFT',
      'PENDING_PUBLICATION',
      'PUBLISHED',
      'UNPUBLISHED',
      'draft',
      'pending_publication',
      'published',
      'unpublished',
    ])
    .optional(),
});

export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;

