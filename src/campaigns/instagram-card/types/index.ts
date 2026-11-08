import { z } from 'zod';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';
export type DesignOption = 'DIY' | 'DESIGNER';
export type CardMaterial = 'PVC' | 'METAL' | 'BAMBOO';

export type PaymentStatus = 
  | 'UNPAID' 
  | 'PAYMENT_REPORTED' 
  | 'PARTIALLY_PAID' 
  | 'PAID' 
  | 'REFUND_PENDING' 
  | 'PARTIALLY_REFUNDED' 
  | 'REFUNDED';

export type DesignStatus = 
  | 'DESIGN_PENDING' 
  | 'DESIGN_IN_PROGRESS' 
  | 'DESIGN_APPROVAL_PENDING' 
  | 'DESIGN_APPROVED' 
  | 'REVISION_REQUESTED';

export type ProductionStatus = 
  | 'PENDING_PRODUCTION' 
  | 'IN_PRODUCTION' 
  | 'QUALITY_CHECK' 
  | 'PRODUCED';

export type ShippingStatus = 
  | 'NOT_SHIPPED' 
  | 'READY_TO_SHIP' 
  | 'SHIPPED' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'RETURNED';

export type OverallOrderStatus = 
  | 'PENDING_PAYMENT' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface ShippingAddressInput {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CardDesignState {
  templateId: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  accentColor: string;
  avatarUrl?: string;
  logoUrl?: string;
  instagramUsername: string;
  headline?: string;
  tagline?: string;
}

export interface PriceBreakdown {
  unitPrice: number;
  quantity: number;
  productSubtotal: number;
  customizationFee: number;
  designerFee: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export const createCampaignOrderSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  quantity: z.number().int().min(1).max(50).default(1),
  designOption: z.enum(['DIY', 'DESIGNER']),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerPhone: z.string().min(10, 'Valid 10-digit phone number is required'),
  instagramUsername: z.string().min(1, 'Instagram username is required')
    .transform(u => u.replace(/^@/, '').trim()),
  instagramUrl: z.string().url('Invalid Instagram URL').optional(),
  shippingAddress: z.object({
    recipientName: z.string().min(2),
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default('India'),
    phone: z.string().min(10),
  }),
  designNotes: z.string().max(500).optional(),
  idempotencyKey: z.string().max(128).optional(),
  designState: z.object({
    templateId: z.string().default('gradient-classic'),
    backgroundColor: z.string().default('#0A0A0C'),
    textColor: z.string().default('#FFFFFF'),
    fontFamily: z.string().default('Inter'),
    accentColor: z.string().default('#2563EB'),
    avatarUrl: z.string().optional(),
    logoUrl: z.string().optional(),
    headline: z.string().max(80).optional(),
    tagline: z.string().max(100).optional(),
  }).optional(),
});

export type CreateCampaignOrderDTO = z.infer<typeof createCampaignOrderSchema>;

