import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { StudioErrorBoundary } from './components/common/StudioErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export function App() {
  return (
    <StudioErrorBoundary
      fallbackTitle="Application Encountered an Error"
      fallbackMessage="Something went wrong while loading this page. Click Retry to reload safely."
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StudioErrorBoundary>
  );
}

