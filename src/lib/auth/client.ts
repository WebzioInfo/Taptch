import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { twoFactorClient } from 'better-auth/client/plugins';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { emailOTPClient } from 'better-auth/client/plugins';

function getClientBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [
    organizationClient(),
    twoFactorClient(),
    phoneNumberClient(),
    emailOTPClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  twoFactor,
  phoneNumber,
  emailOtp,
  forgetPassword,
  resetPassword,
  changePassword,
} = authClient;

export const requestPasswordReset = async (data: { email: string; redirectTo?: string }) => {
  return (authClient as unknown as {
    forgetPassword: (data: { email: string; redirectTo?: string }) => Promise<{ data?: unknown; error?: { message?: string } }>;
  }).forgetPassword(data);
};
