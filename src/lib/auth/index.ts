import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { phoneNumber } from 'better-auth/plugins/phone-number';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { sendOtpEmail, sendOtpSms } from './otp-provider';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || 'tappzio-development-better-auth-secret-min-32-chars-long',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    'https://tappzio.webziotech.in',
  ].filter(Boolean) as string[],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
      twoFactor: schema.twoFactor,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // OTP flow preferred
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
    twoFactor({
      issuer: 'Tappzio Identity',
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendOtpSms(phoneNumber, code);
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail(email, otp, type);
      },
    }),
    nextCookies(),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session once a day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});

export type Session = typeof auth.$Infer.Session;
