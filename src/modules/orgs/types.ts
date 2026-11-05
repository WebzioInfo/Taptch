import { z } from 'zod';

export type OrgRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

export type StaffMemberStatus = 'active' | 'suspended' | 'deactivated';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with dashes')
    .optional(),
  logo: z.string().url().optional().nullable(),
});

export const inviteStaffSchema = z.object({
  email: z.string().email('Valid email address is required'),
  phoneNumber: z.string().max(32).optional().nullable(),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']).default('staff'),
  permissions: z.array(z.string()).optional().default([]),
  assignedResponsibilities: z.string().max(500).optional().nullable(),
});

export const updateStaffSchema = z.object({
  role: z.enum(['admin', 'manager', 'staff', 'viewer']).optional(),
  status: z.enum(['active', 'suspended', 'deactivated']).optional(),
  permissions: z.array(z.string()).optional(),
  assignedResponsibilities: z.string().max(500).optional().nullable(),
});

export interface StaffMemberRecord {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: OrgRole;
  status: StaffMemberStatus;
  permissions: string[];
  assignedResponsibilities: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationRecord {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  phoneNumber: string | null;
  role: OrgRole;
  permissions: string[];
  status: InvitationStatus;
  expiresAt: Date;
  inviterId: string;
  inviterName?: string;
  createdAt: Date;
}

export interface StaffDashboardSummary {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  membership: {
    role: OrgRole;
    status: StaffMemberStatus;
    permissions: string[];
    assignedResponsibilities: string | null;
    joinedAt: Date;
  };
  assignedAssets: {
    totalQRs: number;
    activeProfiles: number;
    capturedLeads: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    createdAt: Date;
    metadata?: Record<string, unknown>;
  }>;
}
