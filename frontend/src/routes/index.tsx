import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { GlobalScrollReset } from '../components/common/GlobalScrollReset';
import { StudioRouteError } from '../components/common/StudioErrorBoundary';

// Lazy-load heavy layouts and feature pages so public profile routes (/:slug)
// never download Design Studio (Fabric.js / Three.js), Admin, or Dashboard bundles.
const MarketingLayout = lazy(() =>
  import('../layouts/MarketingLayout').then((m) => ({ default: m.MarketingLayout })),
);
const AppLayout = lazy(() =>
  import('../layouts/AppLayout').then((m) => ({ default: m.AppLayout })),
);
const ProtectedRoute = lazy(() =>
  import('../components/auth/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })),
);
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PublicProfilePage = lazy(() =>
  import('../pages/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })),
);
const CardsPage = lazy(() => import('../pages/CardsPage').then((m) => ({ default: m.CardsPage })));
const LeadsPage = lazy(() => import('../pages/LeadsPage').then((m) => ({ default: m.LeadsPage })));
const QrPage = lazy(() => import('../pages/QrPage').then((m) => ({ default: m.QrPage })));
const TemplatesPage = lazy(() => import('../pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })));
const PricingPage = lazy(() => import('../pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const BuilderPage = lazy(() => import('../pages/BuilderPage').then((m) => ({ default: m.BuilderPage })));
const AdminPage = lazy(() => import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const SupportPage = lazy(() => import('../pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const DesignStudioPage = lazy(() =>
  import('../pages/DesignStudioPage').then((m) => ({ default: m.DesignStudioPage })),
);
const CheckoutPage = lazy(() => import('../pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() =>
  import('../pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })),
);
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderTrackingPage = lazy(() =>
  import('../pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })),
);
const NfcCardsPage = lazy(() => import('../pages/NfcCardsPage').then((m) => ({ default: m.NfcCardsPage })));
const NfcProductDetailPage = lazy(() =>
  import('../pages/NfcProductDetailPage').then((m) => ({ default: m.NfcProductDetailPage })),
);
const NfcResolvePage = lazy(() =>
  import('../pages/NfcResolvePage').then((m) => ({ default: m.NfcResolvePage })),
);
const PostPurchaseProfileSetupPage = lazy(() =>
  import('../pages/PostPurchaseProfileSetupPage').then((m) => ({
    default: m.PostPurchaseProfileSetupPage,
  })),
);

function RouteSuspenseFallback() {
  return (
    <div
      className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex items-center gap-2" role="status">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] animate-bounce" />
      </div>
    </div>
  );
}

function RootScrollBoundary() {
  return (
    <>
      <GlobalScrollReset />
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Outlet />
      </Suspense>
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
