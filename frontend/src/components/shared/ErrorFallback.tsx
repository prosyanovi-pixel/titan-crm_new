import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertTriangle, RefreshCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function ErrorFallback() {
  const { t } = useTranslation();
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);

  // Extract error info based on the type of error from React Router
  let title = 'Oops! Something went wrong.';
  let message = 'An unexpected error occurred.';
  let stack = '';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || error.data;
  } else if (error instanceof Error) {
    message = error.message;
    stack = error.stack || '';
  } else if (typeof error === 'string') {
    message = error;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header Region */}
        <div className="bg-destructive/10 p-6 flex items-center gap-4 border-b border-border/50">
          <div className="bg-destructive/20 p-3 rounded-full shrink-0">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-destructive mb-1">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              We're sorry, but the application encountered an error while trying to render this page.
            </p>
          </div>
        </div>

        {/* Error Details Region */}
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
            <h2 className="text-sm font-semibold mb-2">Error Message:</h2>
            <code className="text-sm text-destructive break-words font-mono bg-destructive/5 px-2 py-1 rounded">
              {message}
            </code>
          </div>

          {stack && (
            <div className="flex flex-col border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex justify-between items-center px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-sm font-medium"
              >
                <span>Stack Trace (For Developers)</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  showDetails ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden bg-zinc-950 text-zinc-300">
                  <pre className="p-4 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
                    {stack}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Region */}
        <div className="bg-muted/10 p-6 flex flex-wrap gap-3 justify-end border-t border-border/50 mt-auto">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Page
          </Button>
          <Button 
            variant="default"
            onClick={() => {
              navigate('/');
            }}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
