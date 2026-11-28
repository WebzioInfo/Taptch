export const CARD_STATUSES = [
  'UNASSIGNED',
  'ASSIGNED',
  'ACTIVE',
  'SUSPENDED',
  'LOST',
] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  UNASSIGNED: 'Unassigned',
  ASSIGNED: 'Assigned',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  LOST: 'Lost',
};

export function normalizeCardStatus(raw?: string | null): CardStatus {
  const upper = (raw || '').toUpperCase();
  if (upper === 'ACTIVE') return 'ACTIVE';
  if (upper === 'ASSIGNED' || upper === 'PROFILE_ATTACHED' || upper === 'ACTIVATION_PENDING') {
    return 'ASSIGNED';
  }
  if (upper === 'SUSPENDED' || upper === 'REVOKED' || upper === 'DEACTIVATED') return 'SUSPENDED';
  if (upper === 'LOST') return 'LOST';
  return 'UNASSIGNED';
}
