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
const TemplatesPage = lazy(() => import('../pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })));
const PricingPage = lazy(() => import('../pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const BuilderPage = lazy(() => import('../pages/BuilderPage').then((m) => ({ default: m.BuilderPage })));
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminProfilesPage = lazy(() =>
  import('../pages/admin/AdminProfilesPage').then((m) => ({
    default: m.AdminProfilesPage,
  })),
);
const AdminProductsPage = lazy(() =>
  import('../pages/admin/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('../pages/admin/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminOrdersPage = lazy(() =>
  import('../pages/admin/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  })),
);
const AdminCardsPage = lazy(() =>
  import('../pages/admin/AdminCardsPage').then((m) => ({
    default: m.AdminCardsPage,
  })),
);
const AdminPlansPage = lazy(() =>
  import('../pages/admin/AdminPlansPage').then((m) => ({
    default: m.AdminPlansPage,
  })),
);
const AdminTemplatesPage = lazy(() =>
  import('../pages/admin/AdminTemplatesPage').then((m) => ({
    default: m.AdminTemplatesPage,
  })),
);
const AdminTicketsPage = lazy(() =>
  import('../pages/admin/AdminTicketsPage').then((m) => ({
    default: m.AdminTicketsPage,
  })),
);
const AdminRolesPage = lazy(() =>
  import('../pages/admin/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage })),
);
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
      className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex items-center gap-2" role="status">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-bounce" />
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

      // Legacy Admin/Support Redirects
      { path: '/portal-x', element: <Navigate to="/admin" replace /> },
      { path: '/portal-x/*', element: <Navigate to="/admin" replace /> },
      { path: '/support', element: <Navigate to="/admin/tickets" replace /> },
      { path: '/staff/dashboard', element: <Navigate to="/admin/tickets" replace /> },
      { path: '/staff/*', element: <Navigate to="/admin/tickets" replace /> },

      // Unified App Shell (User + Role-Gated Admin Routes)
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/dashboard/nfc-shop', element: <NfcCardsPage /> },
          { path: '/dashboard/my-nfc-cards', element: <CardsPage /> },
          { path: '/cards', element: <CardsPage /> },
          { path: '/orders', element: <OrdersPage /> },
          { path: '/leads', element: <LeadsPage /> },
          { path: '/qr', element: <Navigate to="/dashboard" replace /> },
          { path: '/settings', element: <DashboardPage /> },

          // Admin Routes (super_admin, admin, support_admin)
          {
            element: (
              <ProtectedRoute
                allowedRoles={['super_admin', 'admin', 'support_admin']}
                redirectTo="/"
              />
            ),
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/dashboard', element: <Navigate to="/admin" replace /> },
              { path: '/admin/profiles', element: <AdminProfilesPage /> },
              { path: '/admin/cards', element: <AdminCardsPage /> },
              { path: '/admin/orders', element: <AdminOrdersPage /> },
              { path: '/admin/products', element: <AdminProductsPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/plans', element: <AdminPlansPage /> },
              { path: '/admin/templates', element: <AdminTemplatesPage /> },
              { path: '/admin/tickets', element: <AdminTicketsPage /> },
            ],
          },

          // Roles & Permissions (super_admin and admin only)
          {
            element: <ProtectedRoute allowedRoles={['super_admin', 'admin']} redirectTo="/" />,
            children: [{ path: '/admin/roles', element: <AdminRolesPage /> }],
          },
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

      // Public Profile Routes (/p/:slug for personal, /b/:slug for business)
      { path: '/p/:slug', element: <PublicProfilePage /> },
      { path: '/b/:slug', element: <PublicProfilePage /> },
      { path: '/nfc/:token', element: <NfcResolvePage /> },
      { path: '/claim/:token', element: <RegisterPage /> },

      // Root NFC Card Resolution (/:cardId — must be last before fallback)
      { path: '/:cardId', element: <NfcResolvePage /> },

      // Fallback
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
