import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthGate } from '@/components/AuthGate';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/Home';
import { InventoryPage } from '@/pages/Inventory';
import { ConfigPage } from '@/pages/Config';

// Recharts é pesado: carrega o Dashboard só quando a rota abre
const DashboardPage = lazy(() =>
  import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/inventario" element={<InventoryPage />} />
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route path="/config" element={<ConfigPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </QueryClientProvider>
  );
}
