import React from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { GlobalScrollReset } from '../components/common/GlobalScrollReset';
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
import { StudioRouteError } from '../components/common/StudioErrorBoundary';
import { AdminPage } from '../pages/AdminPage';
import { SupportPage } from '../pages/SupportPage';
import { DesignStudioPage } from '../pages/DesignStudioPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import { NfcCardsPage } from '../pages/NfcCardsPage';
import { NfcProductDetailPage } from '../pages/NfcProductDetailPage';
import { NfcResolvePage } from '../pages/NfcResolvePage';
import { PostPurchaseProfileSetupPage } from '../pages/PostPurchaseProfileSetupPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

function LegacyProfileRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  return <Navigate to={`/${slug}${location.search}`} replace />;
}

function RootScrollBoundary() {
  return (
    <>
      <GlobalScrollReset />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootScrollBoundary />,
    children: [
  // Marketing Routes
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/templates', element: <TemplatesPage /> },
      { path: '/templates/:id', element: <TemplatesPage /> },
      { path: '/nfc-cards', element: <NfcCardsPage /> },
      { path: '/nfc-cards/:slug', element: <NfcProductDetailPage /> },
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
      { path: '/dashboard/nfc-shop', element: <NfcCardsPage /> },
      { path: '/dashboard/my-nfc-cards', element: <CardsPage /> },
      { path: '/cards', element: <CardsPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/leads', element: <LeadsPage /> },
      { path: '/qr', element: <QrPage /> },
      { path: '/settings', element: <DashboardPage /> },
    ],
  },

  // Post-Purchase Digital Profile Setup & Card Attachment (Protected)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/profile-setup', element: <PostPurchaseProfileSetupPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/orders/:id/confirmation', element: <OrderConfirmationPage /> },
      { path: '/orders/:id/track', element: <OrderTrackingPage /> },
      { path: '/orders/:id', element: <OrderTrackingPage /> },
      { path: '/builder/:id', element: <BuilderPage />, errorElement: <StudioRouteError /> },
      { path: '/builder/new', element: <BuilderPage />, errorElement: <StudioRouteError /> },
    ],
  },
  { path: '/journey', element: <Navigate to="/nfc-cards" replace /> },

  // Live NFC Card Design Studio
  { path: '/studio', element: <DesignStudioPage /> },
  { path: '/studio/:productId', element: <DesignStudioPage /> },

  // Canonical Production NFC Public Resolution & Backward-Compatible /nfc/:token
  { path: '/b/:uniqueKey', element: <NfcResolvePage expectedProfileType="business" /> },
  { path: '/p/:uniqueKey', element: <NfcResolvePage expectedProfileType="personal" /> },
  { path: '/nfc/:token', element: <NfcResolvePage /> },
  { path: '/claim/:token', element: <RegisterPage /> },

  // Root Dynamic Public Identity
  { path: '/:slug', element: <PublicProfilePage /> },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

