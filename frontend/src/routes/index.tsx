import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
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

  // Public Identity Hot Path
  { path: '/p/:slug', element: <PublicProfilePage /> },
  { path: '/claim/:token', element: <RegisterPage /> },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

