import type { ProfileRenderData } from '@/components/templates/ProfileRenderer';

export interface TemplateLayoutProps {
  profile: ProfileRenderData;
  onDownloadVCard: () => void;
  onOpenExchange: (initialNote?: string) => void;
  onOpenQr: () => void;
  copiedUrl: boolean;
  onCopyLink: () => void;
  previewPlanId?: string;
}

