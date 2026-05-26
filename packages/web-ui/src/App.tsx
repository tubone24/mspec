// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router/index.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}
