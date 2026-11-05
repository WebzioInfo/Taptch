'use client';

import * as React from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/auth/client';
import { ArrowLeft, Search, Calendar, QrCode, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryItem {
  id: string;
  token: string;
  label: string | null;
  serialNumber: string;
  manualRedirectUrl: string | null;
  status: string;
  assignedAt: string | null;
  scanCount: number;
  customerName: string | null;
  customerPhone: string | null;
  customerBusiness: string | null;
  customerPlace: string | null;
}

export default function StaffHistoryPage() {
  const { data: session } = useSession();
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/admin/staff/${session.user.id}/analytics?limit=100`)
        .then((res) => res.json())
        .then((res) => {
          if (res.data?.history) {
            setItems(res.data.history);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [session?.user?.id]);

  const filteredItems = items.filter((it) => {
    const q = search.toLowerCase();
    return (
      it.token.toLowerCase().includes(q) ||
      it.customerName?.toLowerCase().includes(q) ||
      it.customerBusiness?.toLowerCase().includes(q) ||
      it.customerPhone?.toLowerCase().includes(q) ||
      it.manualRedirectUrl?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground flex flex-col pb-12">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-800 bg-[#0A0A0C]/90 px-4 backdrop-blur">
        <Link href="/staff/dashboard" className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-xs font-bold text-white tracking-wide">MY ACTIVATION HISTORY</span>
          <div className="text-[10px] text-neutral-400">{items.length} total QRs configured</div>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search by customer, business, token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs bg-[#121216] border-neutral-800 text-white placeholder:text-neutral-500 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-neutral-500 text-xs space-y-2">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            <p>Loading history...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs space-y-2 bg-[#121216] rounded-2xl border border-neutral-800 p-6">
            <QrCode className="h-8 w-8 mx-auto text-neutral-600" />
            <p>No activations found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#121216] border border-neutral-800 rounded-xl p-3.5 space-y-2 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 truncate">
                    <div className="text-xs font-bold text-white truncate">
                      {item.customerBusiness || item.customerName || item.label || 'Unnamed QR'}
                    </div>
                    {item.customerName && item.customerBusiness && (
                      <div className="text-[11px] text-neutral-400 truncate">{item.customerName}</div>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-mono bg-neutral-900 text-primary border border-primary/20 px-2 py-0.5 rounded font-semibold">
                    {item.token}
                  </span>
                </div>

                <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1.5">
                  <span className="text-neutral-500">Target:</span>
                  <span className="text-neutral-300 font-mono truncate">{item.manualRedirectUrl || 'Not configured'}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{item.assignedAt ? format(new Date(item.assignedAt), 'dd MMM yyyy, HH:mm') : '—'}</span>
                  </div>
                  <Link
                    href={`/staff/assign/${item.token}`}
                    className="text-primary hover:underline font-medium"
                  >
                    Edit / Reassign
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
