import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { CreditCard, Sparkles } from 'lucide-react';
import { CardPreview } from '../components/cards/CardPreview';

export function CardsPage() {
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/cards'),
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto font-body text-[var(--ink)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <h1 className="font-head text-2xl font-medium tracking-tight text-[var(--ink)]">
            Physical NFC Cards
          </h1>
          <p className="font-body text-sm text-[var(--ink-muted)] mt-1">
            Activate, track, and rebind your physical matte PVC and metal cards
          </p>
        </div>
        <Link to="/studio">
          <Button variant="accent" className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5 shadow-none">
            <Sparkles className="w-4 h-4" />
            <span>Open Design Studio</span>
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse"
              />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-head text-lg font-medium text-[var(--ink)] mb-1">No Cards Linked Yet</h3>
            <p className="font-body text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto mb-6">
              When you receive your physical NFC card, simply tap it with your smartphone camera to activate and claim it to your account.
            </p>
            <Link to="/studio">
              <Button variant="accent" className="rounded-[var(--radius-sm)] text-xs font-medium">
                Design Your Custom NFC Card
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                    <div className="w-[85.6px] h-[54px] rounded-[6px] overflow-hidden border border-[var(--border)] shrink-0 bg-[#161616]">
                      <CardPreview
                        frontUrl={c.previewFrontUrl || c.designPreviewUrl || c.previewUrl}
                        backUrl={c.previewBackUrl || c.backPreviewUrl}
                        width="85.6px"
                        height="54px"
                        cloudinaryWidth={240}
                        alt={c.serialNumber || 'Linked NFC Card'}
                      />
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-medium text-[var(--ink)]">{c.serialNumber}</h3>
                      <p className="font-body text-xs text-[var(--ink-muted)] mt-0.5">
                        Material: <span className="capitalize">{c.material}</span> &bull; Status:{' '}
                        <span className="uppercase text-[var(--success)] font-mono font-medium">{c.status}</span>
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
