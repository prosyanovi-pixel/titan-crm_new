import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function StatusDot({ status }: { status: string }) {
  if (status === 'ok') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertCircle className="w-4 h-4 text-yellow-500" />;
}

export function LevelBadge({ level }: { level: string }) {
  const variants: Record<string, string> = {
    error:   'bg-red-100 text-red-700 border-red-200',
    warn:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info:    'bg-blue-100 text-blue-700 border-blue-200',
    debug:   'bg-gray-100 text-gray-600 border-gray-200',
    http:    'bg-purple-100 text-purple-700 border-purple-200',
  };
  const cls = variants[level?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {level}
    </span>
  );
}

export function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd.MM.yy HH:mm', { locale: ru }); } catch { return d; }
}

export function ProgressBar({ value }: { value: number }) {
  const color = value > 85 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
