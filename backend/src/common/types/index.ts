/**
 * Independent Backend Domain and Context Types
 */

export type UserRole = 'user' | 'staff' | 'admin' | 'superadmin';

export type PlanTier = 'nano' | 'micro' | 'mini' | 'max';

export type ProfileType = 'personal' | 'business' | 'creator';

export type ProfileStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type CardStatus = 'INACTIVE' | 'ACTIVE' | 'SUSPENDED';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type PaymentStatus = 'unpaid' | 'paid_offline' | 'waived';

export interface ActorContext {
  userId: string;
  orgId: string | null;
  role: string;
  isAdmin: boolean;
}

export interface ProfileSectionData {
  id: string;
  sectionType: string;
  title: string;
  content: Record<string, unknown>;
  orderIndex: number;
  isEnabled: boolean;
}

export interface ProfileBusinessData {
  id: string;
  companyName: string;
  jobTitle?: string | null;
  department?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessWebsite?: string | null;
  businessAddress?: string | null;
  logoUrl?: string | null;
  taxId?: string | null;
  isPrimary: boolean;
}

export interface ProfileCatalogueItemData {
  id: string;
  title: string;
  description?: string | null;
  price?: string | null;
  currency?: string;
  imageUrl?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  category?: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface PublicProfileSnapshot {
  id: string;
  slug: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  themeId: string;
  customThemeColors?: Record<string, string> | null;
  sections: ProfileSectionData[];
  businesses: ProfileBusinessData[];
  catalogue: ProfileCatalogueItemData[];
  socialLinks?: Record<string, string> | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
}

export interface DynamicQRResolution {
  token: string;
  destinationUrl: string;
  type: 'PROFILE' | 'EXTERNAL_URL' | 'VCARD' | 'UNCLAIMED_CARD';
  targetId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
