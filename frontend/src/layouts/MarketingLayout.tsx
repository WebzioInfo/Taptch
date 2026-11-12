import React from 'react';
import { Outlet } from 'react-router-dom';
import { MarketingHeader } from '../components/marketing/MarketingHeader';
import { MarketingFooter } from '../components/marketing/MarketingFooter';

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C] text-[#F4F4F6]">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}

