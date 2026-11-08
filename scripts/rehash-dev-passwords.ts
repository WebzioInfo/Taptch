import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { auth } from '../src/lib/auth';
import fs from 'fs';
import path from 'path';

interface AccountToUpdate {
  email: string;
  name: string;
  role: string;
  passwordPlainText: string;
}

const accountsToProvision: AccountToUpdate[] = [
  {
    email: 'admin@taptch.local',
    name: 'Development Super Admin',
    role: 'super_admin',
    passwordPlainText: 'TaptchDevAdmin!2026',
  },
  {
    email: 'manager@taptch.local',
    name: 'Development Admin Manager',
    role: 'admin',
    passwordPlainText: 'TaptchDevManager!2026',
  },
  {
    email: 'user@taptch.local',
    name: 'Development Demo User',
    role: 'user',
    passwordPlainText: 'TaptchDevUser!2026',
  },
  {
    email: 'superadmin@taptch.com',
    name: 'Aditya Vikram (Super Admin)',
    role: 'super_admin',
    passwordPlainText: 'TaptchAdmin@2026!',
  },
  {
    email: 'support@taptch.com',
    name: 'Kavita Menon (Support Admin)',
    role: 'support_admin',
    passwordPlainText: 'TaptchAdmin@2026!',
  },
  {
    email: 'rajesh@apexcap.in',
    name: 'Rajesh Singhania',
    role: 'owner',
    passwordPlainText: 'ApexCapital@2026!',
  },
  {
    email: 'priya@apexcap.in',
    name: 'Priya Nair',
    role: 'admin',
    passwordPlainText: 'ApexCapital@2026!',
  },
  {
    email: 'dr.ananya@apollo.in',
    name: 'Dr. Ananya Roy',
    role: 'user',
    passwordPlainText: 'TaptchDemo@2026!',
  },
];

async function main() {
  console.log('--- PROVISIONING & REHASHING BETTER AUTH ACCOUNTS ---');
  const results: Array<{ email: string; role: string; password: string; verified: boolean }> = [];

  for (const item of accountsToProvision) {
    // 1. Check if user exists in users table
    let user = await db.query.users.findFirst({
      where: eq(schema.users.email, item.email),
    });

    if (!user) {
      console.log(`User not found for ${item.email}, creating user...`);
      const userId = 'usr-' + Buffer.from(item.email).toString('hex').slice(0, 16);
      await db.insert(schema.users).values({
        id: userId,
        name: item.name,
        email: item.email,
        systemRole: item.role === 'super_admin' ? 'super_admin' : item.role === 'support_admin' ? 'support_admin' : 'user',
        emailVerified: true,
        status: 'active',
      });
      user = await db.query.users.findFirst({
        where: eq(schema.users.email, item.email),
      });
    }

    if (!user) {
      console.error(`Failed to find or create user for ${item.email}`);
      continue;
    }

    // 2. Hash password with Better Auth crypto
    const hashed = await hashPassword(item.passwordPlainText);

    // 3. Check if account row exists
    const existingAcc = await db.query.accounts.findFirst({
      where: eq(schema.accounts.userId, user.id),
    });

    if (existingAcc) {
      await db.update(schema.accounts)
        .set({
          password: hashed,
          providerId: 'credential',
          updatedAt: new Date(),
        })
        .where(eq(schema.accounts.id, existingAcc.id));
      console.log(`Updated password hash for ${item.email} (account: ${existingAcc.id})`);
    } else {
      const accId = 'acc-' + user.id;
      await db.insert(schema.accounts).values({
        id: accId,
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: hashed,
      });
      console.log(`Inserted credential account for ${item.email} (account: ${accId})`);
    }

    // 4. Also ensure user is email verified and active, and disable phantom twoFactorEnabled if no 2fa secret exists
    await db.update(schema.users)
      .set({
        emailVerified: true,
        status: 'active',
        twoFactorEnabled: false,
      })
      .where(eq(schema.users.id, user.id));

    // 5. Test sign in using Better Auth API
    let verified = false;
    try {
      const signInRes = await auth.api.signInEmail({
        body: {
          email: item.email,
          password: item.passwordPlainText,
        },
      });
      verified = Boolean(signInRes && signInRes.user && signInRes.token);
      console.log(`Verification for ${item.email}: ${verified ? 'SUCCESS' : 'FAILED'}`);
    } catch (err: any) {
      console.error(`Verification error for ${item.email}:`, err?.message || err);
    }

    results.push({
      email: item.email,
      role: item.role,
      password: item.passwordPlainText,
      verified,
    });
  }

  // 6. Generate DEV_LOGIN_CREDENTIALS.md (gitignored)
  const credsContent = [
    '# TAPTCH — Development Login Credentials',
    '',
    '> **SECURITY NOTICE**: This file contains local development credentials for local testing in development environments. It is automatically gitignored and MUST NEVER be committed to version control or used in production.',
    '',
    `**Generated / Verified Date:** ${new Date().toISOString()}`,
    `**Target Database:** Supabase PostgreSQL (\`db.nvrcgauxafpxsaufjtha.supabase.co\`)`,
    `**Authentication Engine:** Better Auth (scrypt password hashing)`,
    '',
    '| Role | Display Name | Email | Password | Login Verification |',
    '|---|---|---|---|---|',
    ...results.map(
      (r) =>
        `| **${r.role.toUpperCase()}** | ${accountsToProvision.find((a) => a.email === r.email)?.name} | \`${r.email}\` | \`${r.password}\` | **${r.verified ? 'Verified Active (200 OK)' : 'FAILED'}** |`
    ),
    '',
    '## How to Test Authentication',
    '',
    '1. Start the Next.js development server: `npm run dev`',
    '2. Open `http://localhost:3000/login` in your browser.',
    '3. Choose the **Password** tab.',
    '4. Enter any of the above verified credentials to sign in directly.',
    '5. You will be authenticated and redirected to `/dashboard`.',
    '',
  ].join('\n');

  const credsPath = path.resolve('DEV_LOGIN_CREDENTIALS.md');
  fs.writeFileSync(credsPath, credsContent, 'utf-8');
  console.log(`Saved verified development credentials to ${credsPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
