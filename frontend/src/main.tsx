import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { I18nProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { initErrorHandler } from "@/lib/errorHandler";
import { SettingsProvider } from "@/context/SettingsContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from '@/lib/queryPersister';

// Initialize global error handling
initErrorHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const persister = createIDBPersister();

createRoot(document.getElementById("root")!).render(
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
    <I18nProvider>
      <ErrorBoundary>
        <LayoutProvider>
          <SettingsProvider>
            <ConfirmDialogProvider>
              <App />
            </ConfirmDialogProvider>
          </SettingsProvider>
        </LayoutProvider>
      </ErrorBoundary>
    </I18nProvider>
  </PersistQueryClientProvider>
);
