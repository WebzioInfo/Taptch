import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

export function TemplatesPage() {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/templates'),
  });

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bespoke Design Studio</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          Luxury Themes for Every Industry
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Switch themes with one click. Your contact details, catalogues, and social links are preserved across all styles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl bg-[#121216] border border-border/60 overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-muted-foreground">
                  {t.category}
                </span>
                <span className="text-xs font-semibold text-primary uppercase">
                  {t.requiredPlanId || t.premiumTier || 'free'} Tier
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.description}
              </p>
            </div>

            <div className="p-6 pt-0">
              <Link to="/register">
                <Button className="w-full bg-white/5 hover:bg-primary hover:text-black border border-white/10 font-semibold rounded-xl text-xs transition-colors">
                  Choose {t.name}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
