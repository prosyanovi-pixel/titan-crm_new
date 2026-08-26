import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReload: () => void;
  onGoHome: () => void;
}

function DefaultErrorFallback({ error, onReload, onGoHome }: DefaultErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          {t('common.errorBoundary.title')}
        </h2>
        <p className="text-slate-400 mb-4">
          {t('common.errorBoundary.description')}
        </p>

        {error && (
          <div className="bg-slate-950 rounded p-3 mb-4 text-left overflow-auto max-h-32">
            <p className="text-xs text-red-400 font-mono">
              {error.toString()}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onGoHome}
            className="border-slate-700 hover:bg-slate-800"
          >
            {t('common.errorBoundary.home')}
          </Button>
          <Button
            onClick={onReload}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {t('common.errorBoundary.reload')}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onGoHome={this.handleGoHome}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
