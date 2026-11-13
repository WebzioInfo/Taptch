import React from 'react';
import { createBrowserRouter, Navigate, useParams, useLocation } from 'react-router-dom';
import { MarketingLayout } from '../layouts/MarketingLayout';
import { AppLayout } from '../layouts/AppLayout';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PublicProfilePage } from '../pages/PublicProfilePage';
import { CardsPage } from '../pages/CardsPage';
import { LeadsPage } from '../pages/LeadsPage';
import { QrPage } from '../pages/QrPage';
import { TemplatesPage } from '../pages/TemplatesPage';
import { PricingPage } from '../pages/PricingPage';
import { BuilderPage } from '../pages/BuilderPage';
import { AdminPage } from '../pages/AdminPage';
import { SupportPage } from '../pages/SupportPage';

function LegacyProfileRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  return <Navigate to={`/${slug}${location.search}`} replace />;
}

export const router = createBrowserRouter([
  // Marketing Routes
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/templates', element: <TemplatesPage /> },
      { path: '/templates/:id', element: <TemplatesPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/features', element: <HomePage /> },
      { path: '/how-it-works', element: <HomePage /> },
      { path: '/about', element: <HomePage /> },
      { path: '/contact', element: <HomePage /> },
      { path: '/faq', element: <HomePage /> },
      { path: '/nfc-business-card', element: <HomePage /> },
      { path: '/digital-business-card', element: <HomePage /> },
    ],
  },

  // Auth Routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <LoginPage /> },
  { path: '/reset-password', element: <LoginPage /> },
  { path: '/staff/login', element: <Navigate to="/login?redirect=/staff/dashboard" replace /> },

  // Admin & Operations
  { path: '/portal-x', element: <Navigate to="/admin" replace /> },
  { path: '/portal-x/*', element: <Navigate to="/admin" replace /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '/support', element: <SupportPage /> },
  { path: '/staff/dashboard', element: <Navigate to="/support" replace /> },
  { path: '/staff/*', element: <Navigate to="/support" replace /> },

  // App Dashboard (Protected)
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/cards', element: <CardsPage /> },
      { path: '/leads', element: <LeadsPage /> },
      { path: '/qr', element: <QrPage /> },
      { path: '/settings', element: <DashboardPage /> },
    ],
  },

  // Studio Builder (Full Workspace)
  { path: '/builder/:id', element: <BuilderPage /> },
  { path: '/builder/new', element: <BuilderPage /> },

  // Legacy Backward-Compatibility for existing printed NFC cards and QR codes
  { path: '/p/:slug', element: <LegacyProfileRedirect /> },
  { path: '/claim/:token', element: <RegisterPage /> },

  // Root Dynamic Public Identity
  { path: '/:slug', element: <PublicProfilePage /> },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

