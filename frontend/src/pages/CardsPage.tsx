import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { CreditCard, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';

export function CardsPage() {
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/cards'),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-white">Physical NFC Cards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Activate, track, and rebind your physical matte PVC and metal cards
          </p>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#121216] border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border/60 bg-[#121216]/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Cards Linked Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              When you receive your TAPTCH physical NFC card, simply tap it with your smartphone camera to activate and claim it to your account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl bg-[#121216] border border-border/60 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{c.serialNumber}</h3>
                    <p className="text-xs text-muted-foreground">
                      Material: <span className="capitalize">{c.material}</span> • Status: <span className="uppercase text-emerald-400 font-semibold">{c.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

