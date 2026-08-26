import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouterProvider } from "react-router";
import { router } from './routes';
import { AppInitializer } from './components/AppInitializer';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <AppInitializer>
        <TooltipProvider>
          <Sonner position="top-right" richColors closeButton duration={4000} />
          <RouterProvider router={router} />
        </TooltipProvider>
      </AppInitializer>
    </ErrorBoundary>
  );
};

export default App;
