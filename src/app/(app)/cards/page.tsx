'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Plus,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CardItem {
  id: string;
  serialNumber: string;
  material: string;
  chipType: string;
  status: string;
  redirectToken: string;
  profileId: string | null;
  profileName: string | null;
  profileSlug: string | null;
  activatedAt: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  material: string;
  quantity: number;
  orderStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  profileName: string | null;
  createdAt: string;
}

interface ProfileOption {
  id: string;
  displayName: string;
  slug: string;
}

export default function CardsPage() {
  const [cards, setCards] = React.useState<CardItem[]>([]);
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [activationCode, setActivationCode] = React.useState('');
  const [claimProfileId, setClaimProfileId] = React.useState('');
  const [claiming, setClaiming] = React.useState(false);
  const [claimError, setClaimError] = React.useState<string | null>(null);

  // Order modal state
  const [showOrderModal, setShowOrderModal] = React.useState(false);
  const [orderMaterial, setOrderMaterial] = React.useState<'pvc' | 'metal'>('pvc');
  const [orderQuantity, setOrderQuantity] = React.useState(1);
  const [orderProfileId, setOrderProfileId] = React.useState('');
  const [shippingForm, setShippingForm] = React.useState({
    recipientName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
  });
  const [ordering, setOrdering] = React.useState(false);
  const [orderError, setOrderError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [cardsRes, ordersRes, profilesRes] = await Promise.all([
        fetch('/api/v1/cards').then((r) => r.json()),
        fetch('/api/v1/orders').then((r) => r.json()),
        fetch('/api/v1/profiles').then((r) => r.json()),
      ]);

      if (cardsRes.data) setCards(cardsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (profilesRes.data) {
        setProfiles(profilesRes.data);
        if (profilesRes.data.length > 0) {
          setClaimProfileId(profilesRes.data[0].id);
          setOrderProfileId(profilesRes.data[0].id);
        }
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;

    setClaiming(true);
    setClaimError(null);

    try {
      const res = await fetch('/api/v1/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationCode: activationCode.trim(),
          profileId: claimProfileId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to claim card.');

      setShowClaimModal(false);
      setActivationCode('');
      await fetchData();
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Error claiming card.');
    } finally {
      setClaiming(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrdering(true);
    setOrderError(null);

    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: orderMaterial,
          quantity: orderQuantity,
          profileId: orderProfileId || undefined,
          shippingAddress: shippingForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit order.');

      setShowOrderModal(false);
      await fetchData();
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Error placing order.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Cards
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowClaimModal(true)} className="h-8 text-xs gap-1.5 px-3">
            <Plus className="h-3.5 w-3.5" />
            <span>Activate</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => setShowOrderModal(true)} className="h-8 text-xs font-semibold gap-1.5 px-3">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Order</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Active Cards Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Linked Cards
              </h2>
              <span className="text-xs text-muted-foreground">{cards.length} cards</span>
            </div>

            {cards.length === 0 ? (
              <Card className="border-border/60 bg-card/40 text-center py-10">
                <CardContent className="space-y-3 max-w-sm mx-auto">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground">No Cards Linked</h3>
                  <p className="text-xs text-muted-foreground">
                    Activate a card using its packaging code or order new hardware.
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setShowClaimModal(true)} className="h-7 text-xs px-2.5">
                      Activate
                    </Button>
                    <Button variant="gold" size="sm" onClick={() => setShowOrderModal(true)} className="h-7 text-xs px-2.5 font-semibold">
                      Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <Card key={card.id} className="border-border/70 bg-card/40 p-4 space-y-3 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge variant="gold" className="text-[10px] tracking-wider uppercase px-1.5 py-0">
                        {card.material}
                      </Badge>
                      <Badge variant={card.status === 'active' ? 'outline' : 'secondary'} className="text-[10px] capitalize px-1.5 py-0">
                        {card.status}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm font-mono font-semibold text-foreground">
                        {card.serialNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Chip: {card.chipType.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Profile:</span>
                        <span className="font-medium text-foreground">
                          {card.profileName ? (
                            <Link href={`/p/${card.profileSlug}`} target="_blank" className="hover:text-primary transition-colors flex items-center gap-1">
                              {card.profileName}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-amber-400">Unlinked</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tap:</span>
                        <code className="text-[11px] text-primary">/n/{card.redirectToken.slice(0, 10)}...</code>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Orders Section */}
          <section className="space-y-3 pt-4">
            <h2 className="text-sm font-semibold text-foreground">
              Orders
            </h2>

            {orders.length === 0 ? (
              <Card className="border-border/60 bg-card/20 py-6 text-center">
                <CardContent>
                  <p className="text-xs text-muted-foreground">No hardware orders.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/70 bg-card/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px]">
                        <th className="p-2.5">Order</th>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Payment</th>
                        <th className="p-2.5">Tracking</th>
                        <th className="p-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-muted/10">
                          <td className="p-2.5 font-mono font-medium">{ord.id.slice(0, 10)}...</td>
                          <td className="p-2.5 capitalize">{ord.material}</td>
                          <td className="p-2.5">{ord.quantity}</td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">
                              {ord.orderStatus.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-2.5">
                            <Badge variant={ord.paymentStatus === 'paid_offline' || ord.paymentStatus === 'waived' ? 'gold' : 'secondary'} className="text-[10px] capitalize px-1.5 py-0">
                              {ord.paymentStatus.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                            {ord.trackingNumber || '—'}
                          </td>
                          <td className="p-2.5 text-muted-foreground text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        </>
      )}

      {/* Claim / Activate Card Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Activate Physical Smart Card
              </CardTitle>
              <CardDescription>
                Enter the activation code printed on your card presentation box.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                {claimError && (
                  <div className="p-3 text-xs rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs font-medium">Activation Code</Label>
                  <Input
                    id="code"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TPZ-ACT-XXXX"
                    className="font-mono uppercase text-center tracking-wider"
                    required
                  />
                </div>
                {profiles.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="linkProfile" className="text-xs font-medium">Link to Profile</Label>
                    <select
                      id="linkProfile"
                      value={claimProfileId}
                      onChange={(e) => setClaimProfileId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id} className="bg-card text-foreground">
                          {p.displayName} (/{p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowClaimModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" size="sm" disabled={claiming} className="gap-2">
                    {claiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Activation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Physical Card Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl my-8">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Request Physical Smart Card
              </CardTitle>
              <CardDescription>
                Precision engineered NFC cards with edge routing and anti-metal shielding.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                {orderError && (
                  <div className="p-3 text-xs rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Material Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Hardware Material</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderMaterial('pvc')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        orderMaterial === 'pvc'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border/60 bg-background/50 hover:border-border text-muted-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground">Matte Black PVC</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">NTAG216 • Waterproof</div>
                      <div className="text-xs font-mono text-primary font-bold mt-2">₹999 / card</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderMaterial('metal')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        orderMaterial === 'metal'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border/60 bg-background/50 hover:border-border text-muted-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground">Brushed Stainless Metal</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Laser-engraved executive</div>
                      <div className="text-xs font-mono text-primary font-bold mt-2">₹2,499 / card</div>
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label htmlFor="orderQty" className="text-xs font-medium">Quantity</Label>
                  <Input
                    id="orderQty"
                    type="number"
                    min={1}
                    max={50}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Pre-link profile */}
                {profiles.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="orderProfile" className="text-xs font-medium">Pre-encode to Profile</Label>
                    <select
                      id="orderProfile"
                      value={orderProfileId}
                      onChange={(e) => setOrderProfileId(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id} className="bg-card text-foreground">
                          {p.displayName} (/{p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Shipping Details */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="text-xs font-semibold text-foreground">Shipping Delivery Address</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Recipient Full Name</Label>
                      <Input
                        value={shippingForm.recipientName}
                        onChange={(e) => setShippingForm({ ...shippingForm, recipientName: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Contact Phone (+91)</Label>
                      <Input
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Street Address / Landmark</Label>
                    <Input
                      value={shippingForm.street}
                      onChange={(e) => setShippingForm({ ...shippingForm, street: e.target.value })}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">City</Label>
                      <Input
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">State</Label>
                      <Input
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">PIN Code</Label>
                      <Input
                        value={shippingForm.postalCode}
                        onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Physical order requests are reviewed by our production team. Payment settlement is confirmed offline or waived under enterprise subscriptions.</span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowOrderModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" size="sm" disabled={ordering} className="gap-2">
                    {ordering && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Order Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
