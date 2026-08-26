import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface MailComposeFormProps {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  onToChange: (value: string) => void;
  onCcChange: (value: string) => void;
  onBccChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (value: boolean) => void;
  disabled?: boolean;
  fromAccountId?: string;
  onFromAccountIdChange?: (value: string) => void;
  accounts?: any[];
}

export function MailComposeForm({
  to,
  cc,
  bcc,
  subject,
  onToChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
  showAdvanced,
  onShowAdvancedChange,
  disabled = false,
  fromAccountId,
  onFromAccountIdChange,
  accounts = [],
}: MailComposeFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {accounts.length > 1 && fromAccountId && onFromAccountIdChange && (
        <div className="space-y-1">
          <Label htmlFor="fromAccountId" className="text-sm font-medium flex items-center gap-2">
            <span>{t('mail.from')}</span>
          </Label>
          <select
            id="fromAccountId"
            value={fromAccountId}
            onChange={(e) => onFromAccountIdChange(e.target.value)}
            disabled={disabled}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.displayName || acc.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="to" className="text-sm font-medium flex items-center gap-2">
          <span>{t('mail.to')}</span>
          <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="to"
            placeholder="email@example.com"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            disabled={disabled}
            className="h-10 flex-1"
          />
          {!showAdvanced && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowAdvancedChange(true)}
              className="text-xs"
            >
              CC/BCC
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cc" className="text-sm font-medium">
              {t('mail.cc')} (CC)
            </Label>
            <Input
              id="cc"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => onCcChange(e.target.value)}
              disabled={disabled}
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bcc" className="text-sm font-medium">
              {t('mail.bcc')} (BCC)
            </Label>
            <Input
              id="bcc"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => onBccChange(e.target.value)}
              disabled={disabled}
              className="h-9"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowAdvancedChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ {t('common.hide')} CC/BCC
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="subject" className="text-sm font-medium flex items-center gap-2">
          <span>{t('mail.subject')}</span>
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          placeholder={t('mail.subject')}
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          disabled={disabled}
          className="h-10"
        />
      </div>
    </div>
  );
}

