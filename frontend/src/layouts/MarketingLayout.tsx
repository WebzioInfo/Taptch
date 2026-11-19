import React from 'react';
import { Outlet } from 'react-router-dom';
import { MarketingHeader } from '../components/marketing/MarketingHeader';
import { MarketingFooter } from '../components/marketing/MarketingFooter';

export function MarketingLayout() {
  return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--ink)] font-body selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]">
        <MarketingHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <MarketingFooter />
      </div>
      );
}
