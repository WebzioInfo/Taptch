export type ToastType = 'success' | 'error' | 'info' | 'limit_reached';

export interface ToastNotification {
  type: ToastType;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

export const PROFILE_LIMIT_TOAST_MESSAGE =
  'Profile limit reached. Upgrade to Business for more profiles.';

/**
 * Returns consistent auto-dismiss duration in milliseconds for each toast type.
 */
export function getToastDurationMs(type: ToastType): number {
  switch (type) {
    case 'success':
      return 3000;
    case 'info':
      return 4000;
    case 'error':
    case 'limit_reached':
      return 4500;
  }
}

/**
 * Maps a profile save/publish error into a concise customer-facing toast notification
 * while preserving the detailed error in developer logs.
 */
export function buildProfileSaveErrorNotification(
  err: unknown,
  userAccountType: 'personal' | 'business',
  isNew: boolean,
): ToastNotification {
  console.error('[BuilderPage] Profile save/publish failed:', err);

  const errorObj = err as { message?: string; status?: number; statusCode?: number } | null;
  const rawMsg = typeof errorObj?.message === 'string' ? errorObj.message.trim() : '';
  const status = errorObj?.statusCode ?? errorObj?.status;

  const isLimitError =
    status === 403 ||
    /personal accounts are limited|profile limit/i.test(rawMsg);

  if (isLimitError && userAccountType === 'personal' && isNew) {
    return {
      type: 'limit_reached',
      message: PROFILE_LIMIT_TOAST_MESSAGE,
      actionLabel: 'Upgrade',
      actionTo: '/pricing',
    };
  }

  return {
    type: 'error',
    message: rawMsg || 'Failed to save profile. Please check required fields.',
  };
}
