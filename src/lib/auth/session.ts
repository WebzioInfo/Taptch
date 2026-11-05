import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import type { ActorContext } from '@/db';

/**
 * Extracts and verifies the ActorContext from incoming HTTP headers.
 * Uses Better Auth session verification.
 */
export async function getActorFromRequest(
  requestHeaders?: Headers
): Promise<ActorContext | null> {
  const reqHeaders = requestHeaders || (await headers());

  // Test environment bypass for deterministic automated testing
  if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_AUTH === 'true') {
    const testUserId = reqHeaders.get('x-test-user-id');
    if (testUserId) {
      return {
        userId: testUserId,
        orgId: reqHeaders.get('x-test-org-id') || null,
        role: reqHeaders.get('x-test-role') || 'user',
        isAdmin: reqHeaders.get('x-test-role') === 'super_admin',
      };
    }
  }

  try {
    const sessionData = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!sessionData || !sessionData.user) {
      return null;
    }

    const user = sessionData.user as Record<string, unknown>;
    const userId = (user.id as string) || '';
    const status = (user.status as string) || 'active';

    // Immediate session rejection for suspended or deactivated accounts
    if (status === 'suspended' || status === 'deactivated') {
      return null;
    }

    const systemRole = (user.systemRole as string) || (user.role as string) || 'user';
    const orgId = (user.activeOrganizationId as string) || null;

    return {
      userId,
      orgId,
      role: systemRole,
      isAdmin: systemRole === 'super_admin' || systemRole === 'admin',
    };
  } catch {
    return null;
  }
}
