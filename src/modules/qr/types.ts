export type QRDestinationType = 'profile' | 'url' | 'whatsapp' | 'vcard' | 'multilink';

export type QRStatus = 'draft' | 'available' | 'assigned' | 'active' | 'disabled' | 'archived';

export interface QRDesignConfig {
  fgColor: string; // Hex color e.g. '#000000' or '#D4AF37'
  bgColor: string; // Hex color e.g. '#FFFFFF' or '#0A0A0C'
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  cornerShape?: 'square' | 'rounded' | 'dots';
  dotShape?: 'square' | 'rounded';
  centerLogoUrl?: string | null;
  centerLogoSizePct?: number; // 10 to 25% max to prevent obstruction
  frameStyle?: 'none' | 'simple' | 'badge' | 'scan-me';
  frameText?: string | null;
  contrastRatio?: number;
}

export interface CreateQRInput {
  name?: string;
  destinationType: QRDestinationType;
  profileId?: string | null;
  targetUrl?: string | null;
  destinationPayload?: Record<string, unknown> | null;
  ownerUserId?: string | null;
  organizationId?: string | null;
  batchId?: string | null;
  isDynamic?: boolean;
  designConfig?: Partial<QRDesignConfig>;
}

export interface UpdateQRInput {
  destinationType?: QRDestinationType;
  profileId?: string | null;
  targetUrl?: string | null;
  destinationPayload?: Record<string, unknown> | null;
  status?: QRStatus;
  designConfig?: Partial<QRDesignConfig>;
}

export interface ResolveQRTarget {
  status: 'active' | 'available' | 'disabled' | 'archived' | 'not_found';
  qrId?: string;
  destinationType?: QRDestinationType;
  redirectUrl?: string;
  slug?: string;
  profileId?: string | null;
  token?: string;
}

export interface RecordQRScanParams {
  qrId: string;
  profileId?: string | null;
  destinationType: string;
  resolvedUrl: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
}

