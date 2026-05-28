// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui
// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: markdown-search-and-quick-access

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router/index.js';
import { QuickAccessPalette } from './components/QuickAccessPalette.js';
import { useQuickAccess } from './hooks/useQuickAccess.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2000,
    },
  },
});

function AppInner() {
  const { isOpen, close } = useQuickAccess();
  return (
    <>
      <AppRoutes />
      <QuickAccessPalette isOpen={isOpen} onClose={close} />
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
