'use client';

import * as React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  Loader2,
  RefreshCw,
  Palette,
  FileCheck2,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  Check,
  X,
  Eye,
  Power,
} from 'lucide-react';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import type { ProfileRenderData } from '@/components/templates/ProfileRenderer';

interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  totalCards: number;
  totalLeads: number;
  totalOrders: number;
}

interface PublicationItem {
  id: string;
  profileId: string;
  userId: string;
  status: string;
  requestedPlanId: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  correctionsRequested: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  createdAt: string;
  profileName: string;
  profileSlug: string;
  profileType: string;
  profileStatus: string;
  templateId: string;
  customerName: string;
  customerEmail: string;
}

interface AdminOrder {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  material: string;
  quantity: number;
  shippingAddress: {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  orderStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
}

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  requiredPlanId: string;
  isActive: boolean;
  isFeatured: boolean;
  thumbnailUrl?: string;
  usageCount?: number;
  features?: string[];
  description?: string;
}

interface MediaItem {
  id: string;
  ownerName: string | null;
  ownerEmail: string | null;
  profileSlug: string | null;
  resourceType: string;
  mediaCategory: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  format: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [publications, setPublications] = React.useState<PublicationItem[]>([]);
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [templates, setTemplates] = React.useState<TemplateItem[]>([]);
  const [mediaList, setMediaList] = React.useState<MediaItem[]>([]);
  const [mediaStats, setMediaStats] = React.useState<{ totalCount: number; totalBytes: number }>({ totalCount: 0, totalBytes: 0 });
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'publications' | 'orders' | 'templates' | 'media'>('publications');
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = React.useState<string | null>(null);

  // Form state for publication approval
  const [planSelections, setPlanSelections] = React.useState<Record<string, string>>({});
  const [validitySelections, setValiditySelections] = React.useState<Record<string, number>>({});
  const [paymentSelections, setPaymentSelections] = React.useState<Record<string, string>>({});

  // Template preview state for admin review
  const [adminPreviewTemplateId, setAdminPreviewTemplateId] = React.useState<string | null>(null);
  const [adminPreviewProfile, setAdminPreviewProfile] = React.useState<ProfileRenderData | null>(null);
  const [loadingProfilePreview, setLoadingProfilePreview] = React.useState<string | null>(null);

  const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === 'super_admin';

  const loadAdminData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, pubRes, ordersRes, templatesRes, mediaRes] = await Promise.all([
        fetch('/api/v1/admin/stats').then((r) => r.json()).catch(() => ({ data: null })),
        fetch('/api/v1/admin/publications').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/v1/admin/orders').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/v1/admin/templates').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/v1/admin/media').then((r) => r.json()).catch(() => ({ data: [], meta: { totalCount: 0, totalBytes: 0 } })),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (pubRes.data) setPublications(pubRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
      if (mediaRes.data) setMediaList(mediaRes.data);
      if (mediaRes.meta) setMediaStats({ totalCount: mediaRes.meta.totalCount, totalBytes: mediaRes.meta.totalBytes });
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleReviewPublication = async (
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTIONS' | 'SUSPEND' | 'UNPUBLISH'
  ) => {
    try {
      setReviewingId(requestId);
      const planId = planSelections[requestId] || 'nano';
      const validDays = validitySelections[requestId] || 365;
      const paymentStatus = paymentSelections[requestId] || 'NOT_RECORDED';

      const res = await fetch(`/api/v1/admin/publications/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          planId,
          validDays,
          paymentStatus,
          adminNotes: `Action ${action} executed by Super Admin`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Review failed');
      }

      await loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Review action failed: ${msg}`);
    } finally {
      setReviewingId(null);
    }
  };

  const handleUpdateOrder = async (orderId: string, updates: { orderStatus?: string; paymentStatus?: string; trackingNumber?: string }) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/v1/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update order');
      await loadAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePreviewCustomerProfile = async (pub: PublicationItem) => {
    try {
      setLoadingProfilePreview(pub.id);
      const res = await fetch(`/api/v1/profiles/${pub.profileId}`);
      if (!res.ok) throw new Error('Failed to load profile details');
      const json = await res.json();
      const profile = json.data;
      setAdminPreviewProfile({
        id: profile.id,
        slug: profile.slug,
        displayName: profile.displayName,
        headline: profile.headline,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        coverUrl: profile.coverUrl,
        profileType: profile.profileType,
        templateId: pub.templateId || profile.templateId,
        businesses: profile.businesses || [],
        catalogue: profile.catalogue || [],
      });
      setAdminPreviewTemplateId(pub.templateId || profile.templateId);
    } catch (err) {
      console.error('Failed to preview customer profile:', err);
      alert('Could not load profile preview for this customer.');
    } finally {
      setLoadingProfilePreview(null);
    }
  };

  const handleUpdateTemplate = async (templateId: string, updates: Partial<TemplateItem>) => {
    try {
      const res = await fetch(`/api/v1/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update template configuration');
      await loadAdminData();
    } catch (err) {
      console.error('Error updating template:', err);
      alert('Failed to update template configuration.');
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-card/60 border border-destructive/30 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This portal is restricted to authorized platform administrators.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{brandConfig.name} Executive Cockpit</h1>
            <Badge variant="gold" className="uppercase text-[10px] tracking-wider">
              <ShieldCheck className="w-3 h-3 mr-1 inline" /> Admin Control
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Controlled publishing, commercial plan assignments, Cloudinary media, and physical card fulfillment.
          </p>
        </div>

        <Button onClick={loadAdminData} disabled={loading} variant="outline" size="sm" className="gap-2 self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-card/40 border-border/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Platform Users</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.totalUsers ?? '—'}</div>
        </Card>
        <Card className="bg-card/40 border-border/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Digital Profiles</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.totalProfiles ?? '—'}</div>
        </Card>
        <Card className="bg-card/40 border-border/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Pending Requests</div>
          <div className="text-2xl font-bold text-primary mt-1">
            {publications.filter((p) => p.status === 'PENDING_PUBLICATION').length}
          </div>
        </Card>
        <Card className="bg-card/40 border-border/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Hardware Orders</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.totalOrders ?? '—'}</div>
        </Card>
        <Card className="bg-card/40 border-border/60 p-4">
          <div className="text-xs text-muted-foreground font-medium">Cloudinary Storage</div>
          <div className="text-2xl font-bold text-[#D4AF37] mt-1">
            {Math.round((mediaStats.totalBytes / (1024 * 1024)) * 10) / 10} MB
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-border/60 gap-4">
        <button
          onClick={() => setActiveTab('publications')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'publications' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4" />
            Publication Requests ({publications.length})
          </div>
          {activeTab === 'publications' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Card Orders ({orders.length})
          </div>
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'templates' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Template Registry ({templates.length})
          </div>
          {activeTab === 'templates' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'media' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Cloudinary Media ({mediaStats.totalCount})
          </div>
          {activeTab === 'media' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Publications Queue Tab */}
      {activeTab === 'publications' && (
        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Controlled Publication Requests</CardTitle>
            <CardDescription className="text-xs">
              Every user collects full data. Review profile, conduct commercial discussion via WhatsApp/phone, assign plan, and approve publication.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/40">
                <tr>
                  <th className="p-3">Customer & Profile</th>
                  <th className="p-3">Contact Links</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Plan Assignment</th>
                  <th className="p-3">Validity & Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {publications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No publication requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  publications.map((pub) => {
                    const phoneClean = (pub.contactPhone || pub.contactWhatsapp || '').replace(/[^0-9]/g, '');
                    const waLink = phoneClean ? `https://wa.me/${phoneClean}?text=Hi%20${encodeURIComponent(pub.customerName)},%20I%20am%20reviewing%20your%20${brandConfig.name}%20profile%20request.` : null;

                    return (
                      <tr key={pub.id} className="hover:bg-muted/10">
                        <td className="p-3">
                          <div className="font-semibold text-foreground text-sm">{pub.customerName}</div>
                          <div className="text-[11px] text-muted-foreground">{pub.customerEmail}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-medium text-white/90">{pub.profileName}</span>
                            <button
                              type="button"
                              onClick={() => handlePreviewCustomerProfile(pub)}
                              disabled={loadingProfilePreview === pub.id}
                              className="text-primary hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                              title="Preview Customer Template with Real Data"
                            >
                              {loadingProfilePreview === pub.id ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Eye className="w-2.5 h-2.5 text-primary" />
                              )}
                              <span>Preview Template</span>
                            </button>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col gap-1.5">
                            {pub.contactPhone && (
                              <a
                                href={`tel:${pub.contactPhone}`}
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                              >
                                <Phone className="w-3 h-3" /> {pub.contactPhone}
                              </a>
                            )}
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-medium"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp Chat
                              </a>
                            )}
                            {!pub.contactPhone && !pub.contactWhatsapp && (
                              <span className="text-muted-foreground text-[10px]">No phone listed</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {pub.templateId}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{pub.profileType}</div>
                        </td>

                        <td className="p-3">
                          <select
                            value={planSelections[pub.id] || pub.requestedPlanId || 'nano'}
                            onChange={(e) =>
                              setPlanSelections((prev) => ({ ...prev, [pub.id]: e.target.value }))
                            }
                            className="px-2 py-1 rounded bg-background border border-border text-xs uppercase font-semibold text-foreground w-28"
                          >
                            <option value="nano">Nano</option>
                            <option value="micro">Micro</option>
                            <option value="mini">Mini</option>
                            <option value="max">Max</option>
                          </select>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            <select
                              value={validitySelections[pub.id] || 365}
                              onChange={(e) =>
                                setValiditySelections((prev) => ({ ...prev, [pub.id]: Number(e.target.value) }))
                              }
                              className="px-2 py-1 rounded bg-background border border-border text-[11px] text-foreground w-28"
                            >
                              <option value={30}>30 Days</option>
                              <option value={90}>90 Days</option>
                              <option value={365}>1 Year (365d)</option>
                              <option value={1000}>3 Years</option>
                            </select>

                            <select
                              value={paymentSelections[pub.id] || 'NOT_RECORDED'}
                              onChange={(e) =>
                                setPaymentSelections((prev) => ({ ...prev, [pub.id]: e.target.value }))
                              }
                              className="px-2 py-1 rounded bg-background border border-border text-[10px] uppercase text-foreground w-28"
                            >
                              <option value="NOT_RECORDED">Unpaid</option>
                              <option value="PENDING_VERIFICATION">Verifying</option>
                              <option value="PAID">Paid</option>
                              <option value="WAIVED">Waived</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-3">
                          <Badge
                            variant={
                              pub.status === 'APPROVED' || pub.profileStatus === 'PUBLISHED'
                                ? 'gold'
                                : pub.status === 'PENDING_PUBLICATION'
                                ? 'secondary'
                                : pub.status === 'REJECTED'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="text-[10px] uppercase tracking-wide"
                          >
                            {pub.profileStatus || pub.status}
                          </Badge>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pub.profileStatus !== 'PUBLISHED' ? (
                              <Button
                                size="sm"
                                variant="gold"
                                onClick={() => handleReviewPublication(pub.id, 'APPROVE')}
                                disabled={reviewingId === pub.id}
                                className="h-7 text-xs font-semibold px-2.5"
                              >
                                {reviewingId === pub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                Approve & Publish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReviewPublication(pub.id, 'SUSPEND')}
                                disabled={reviewingId === pub.id}
                                className="h-7 text-xs px-2"
                              >
                                Suspend
                              </Button>
                            )}

                            {pub.status === 'PENDING_PUBLICATION' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewPublication(pub.id, 'REJECT')}
                                disabled={reviewingId === pub.id}
                                className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                              >
                                <X className="w-3 h-3 mr-0.5" /> Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <CardTitle className="text-lg">Physical Card Order Kanban & Fulfillment</CardTitle>
            <CardDescription className="text-xs">
              Manage custom physical card production, shipping addresses, manual offline payment status, and courier tracking IDs.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider border-y border-border/40">
                <tr>
                  <th className="p-3">Customer & Order ID</th>
                  <th className="p-3">Hardware Spec</th>
                  <th className="p-3">Shipping Address</th>
                  <th className="p-3">Production Status</th>
                  <th className="p-3">Payment Verification</th>
                  <th className="p-3">Courier Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No card orders in queue.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/10">
                      <td className="p-3 font-mono">
                        <div className="font-semibold text-foreground">{ord.userName || 'User'}</div>
                        <div className="text-[11px] text-muted-foreground">{ord.userEmail}</div>
                        <div className="text-[10px] text-primary">{ord.id.slice(0, 14)}...</div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize font-medium">{ord.material}</span> (x{ord.quantity})
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-xs">
                        <div>{ord.shippingAddress?.recipientName}</div>
                        <div>{ord.shippingAddress?.street}, {ord.shippingAddress?.city}</div>
                        <div>{ord.shippingAddress?.state} - {ord.shippingAddress?.postalCode}</div>
                        <div>Phone: {ord.shippingAddress?.phone}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateOrder(ord.id, { orderStatus: e.target.value })}
                          disabled={updatingOrderId === ord.id}
                          className="px-2 py-1 rounded bg-background border border-border text-xs capitalize text-foreground"
                        >
                          <option value="requested">Requested</option>
                          <option value="in_production">In Production</option>
                          <option value="qc">Quality Check</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) => handleUpdateOrder(ord.id, { paymentStatus: e.target.value })}
                          disabled={updatingOrderId === ord.id}
                          className="px-2 py-1 rounded bg-background border border-border text-xs capitalize text-foreground"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid_offline">Paid Offline</option>
                          <option value="waived">Waived / Entitled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          defaultValue={ord.trackingNumber || ''}
                          placeholder="e.g. BLUEDART-12345"
                          onBlur={(e) => {
                            if (e.target.value !== ord.trackingNumber) {
                              handleUpdateOrder(ord.id, { trackingNumber: e.target.value });
                            }
                          }}
                          className="px-2 py-1 rounded bg-background border border-border text-xs font-mono text-foreground w-36"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Template Directory Governance</h3>
              <p className="text-xs text-muted-foreground">Manage active status, required plan tiers, and test realistic demo previews across all 8 business verticals.</p>
            </div>
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              {templates.length} Authoritative Templates
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="border-border/80 bg-card/60 overflow-hidden flex flex-col justify-between">
                {tpl.thumbnailUrl && (
                  <div className="aspect-[16/9] w-full bg-neutral-900 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tpl.thumbnailUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover brightness-85"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <Badge variant={tpl.isActive ? 'outline' : 'secondary'} className={`text-[10px] ${tpl.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'}`}>
                        {tpl.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] uppercase font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">
                        {tpl.category}
                      </span>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold">{tpl.name}</CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {tpl.description || 'Enterprise responsive template layout.'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Adoption &amp; Usage:</span>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {tpl.usageCount || 0} customer profiles
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Required Plan:</span>
                      <select
                        value={tpl.requiredPlanId}
                        onChange={(e) => handleUpdateTemplate(tpl.id, { requiredPlanId: e.target.value })}
                        className="px-2 py-0.5 rounded bg-background border border-border text-xs uppercase font-semibold text-foreground"
                      >
                        <option value="nano">Nano (Base)</option>
                        <option value="micro">Micro (Solo)</option>
                        <option value="mini">Mini (Growth)</option>
                        <option value="max">Max (Luxury)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdminPreviewProfile(null);
                        setAdminPreviewTemplateId(tpl.id);
                      }}
                      className="flex-1 text-xs gap-1.5 h-8"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>Preview Demo</span>
                    </Button>

                    <Button
                      variant={tpl.isActive ? 'outline' : 'gold'}
                      size="sm"
                      onClick={() => handleUpdateTemplate(tpl.id, { isActive: !tpl.isActive })}
                      className="text-xs h-8 px-3 gap-1"
                    >
                      <Power className="w-3 h-3" />
                      <span>{tpl.isActive ? 'Disable' : 'Enable'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cloudinary Media Inspection Tab */}
      {activeTab === 'media' && (
        <Card className="border-border/80 bg-card/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Cloudinary Media Asset Registry</CardTitle>
                <CardDescription className="text-xs">
                  Centralized repository of all user avatars, logos, cover photos, gallery images, videos, and PDF brochures.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37]">
                Cloud: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dhydmxcq2'}
              </Badge>
            </div>
          </CardHeader>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaList.length === 0 ? (
              <div className="col-span-full p-8 text-center text-muted-foreground text-xs">
                No Cloudinary media assets registered yet.
              </div>
            ) : (
              mediaList.map((m) => (
                <div key={m.id} className="rounded-xl border border-white/10 overflow-hidden bg-black/40 group relative">
                  <div className="aspect-square flex items-center justify-center bg-white/5 overflow-hidden">
                    {m.resourceType === 'image' ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={m.secureUrl} alt={m.cloudinaryPublicId} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : m.resourceType === 'video' ? (
                      <video src={m.secureUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3">
                        <FileCheck2 className="w-8 h-8 mx-auto text-[#D4AF37] mb-1" />
                        <span className="text-[10px] text-white/70 uppercase font-mono">{m.format || 'PDF'}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-[10px]">
                    <div className="font-semibold text-white/90 truncate">{m.ownerName || 'User'}</div>
                    <div className="text-white/40 capitalize">{m.mediaCategory}</div>
                    <div className="text-[9px] text-[#D4AF37] mt-0.5 truncate">{m.cloudinaryPublicId}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Admin Template Preview Modal (For Customer Profile Review or Demo Business Inspection) */}
      {adminPreviewTemplateId && (
        <TemplatePreviewModal
          isOpen={!!adminPreviewTemplateId}
          onClose={() => {
            setAdminPreviewTemplateId(null);
            setAdminPreviewProfile(null);
          }}
          initialTemplateId={adminPreviewTemplateId}
          customerProfile={adminPreviewProfile}
          onSelectTemplate={(tplId) => {
            // Admin testing selection - updates local preview
            setAdminPreviewTemplateId(tplId);
          }}
        />
      )}
    </div>
  );
}
