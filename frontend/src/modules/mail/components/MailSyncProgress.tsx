import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, RefreshCw, Mail, AlertTriangle } from 'lucide-react';

interface FolderCount {
  name: string;
  path: string;
  total: number;
  newEmails: number;
}

interface MailSyncProgressProps {
  status: 'counting' | 'progress' | 'completed' | 'error';
  progress: number;
  message: string;
  folderName?: string;
  folderProgress?: number;
  processedEmails?: number;
  totalEmailsToProcess?: number;
  emailsSynced?: number;
  attachmentsDownloaded?: number;
  folderCounts?: FolderCount[];
}

export function MailSyncProgress({
  status,
  progress,
  message,
  folderName,
  folderProgress = 0,
  processedEmails = 0,
  totalEmailsToProcess = 0,
  emailsSynced = 0,
  attachmentsDownloaded = 0,
  folderCounts = [],
}: MailSyncProgressProps) {
  const isCounting = status === 'counting';
  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isInProgress = status === 'progress';

  const Icon = isCompleted ? CheckCircle2 : isError ? AlertTriangle : isCounting ? RefreshCw : Loader2;

  return (
    <div className="mx-2 my-2 p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2">
      {/* Status header */}
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${isInProgress ? 'animate-spin text-primary' : isCompleted ? 'text-green-500' : isError ? 'text-destructive' : 'text-muted-foreground'}`} />
        <span className="text-sm font-medium truncate">{message}</span>
        {!isCompleted && !isError && (
          <Badge variant="outline" className="ml-auto shrink-0 text-xs">
            {Math.round(progress)}%
          </Badge>
        )}
      </div>

      {/* Overall progress bar */}
      {!isCompleted && (
        <Progress value={progress} className="h-1.5" />
      )}

      {/* Current folder progress */}
      {isInProgress && folderName && folderProgress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="truncate">📂 {folderName}</span>
            <span>{folderProgress}%</span>
          </div>
          <Progress value={folderProgress} className="h-1" />
        </div>
      )}

      {/* Stats */}
      {processedEmails > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {processedEmails}/{totalEmailsToProcess}
          </span>
          {attachmentsDownloaded > 0 && (
            <span>📎 {attachmentsDownloaded}</span>
          )}
        </div>
      )}

      {/* Folder breakdown (on counting or progress) */}
      {folderCounts.length > 0 && (status === 'counting' || isInProgress) && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Папки:</p>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {folderCounts.map((fc) => {
              const isCurrentFolder = isInProgress && folderName === fc.name;
              return (
                <div
                  key={fc.name}
                  className={`flex items-center justify-between text-xs px-1 py-0.5 rounded ${
                    isCurrentFolder ? 'bg-primary/10 font-medium' : ''
                  }`}
                >
                  <span className="truncate max-w-[120px]">{fc.name}</span>
                  <span className="text-muted-foreground">
                    {fc.newEmails > 0 ? `${fc.newEmails} новых` : `${fc.total} писем`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
