/**
 * Глобальный диалог подтверждения и уведомления
 * Используется вместо window.confirm() и window.alert()
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isAlert?: boolean;
}

let resolveRef: ((value: boolean) => void) | null = null;

/**
 * Императивный вызов диалога (для использования вне React компонентов)
 */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    resolveRef = resolve;
    window.dispatchEvent(new CustomEvent('open-confirm-dialog', { detail: options }));
  });
}

/**
 * Хук для использования в компонентах
 */
export function useConfirm() {
  const { t } = useTranslation();

  const confirm = useCallback((options: string | ConfirmOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return showConfirm({
      title: t('common.confirm_action'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      ...opts
    });
  }, [t]);

  const alert = useCallback((options: string | ConfirmOptions) => {
    const opts = typeof options === 'string' ? { description: options } : options;
    return showConfirm({
      title: t('common.attention'),
      confirmText: 'OK',
      isAlert: true,
      ...opts
    });
  }, [t]);

  return { confirm, alert };
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    description: '',
    variant: 'default',
  });

  const handleOpen = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as ConfirmOptions;
    setOptions(detail);
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef?.(true);
    resolveRef = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef?.(false);
    resolveRef = null;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  useEffect(() => {
    window.addEventListener('open-confirm-dialog', handleOpen as EventListener);
    return () => window.removeEventListener('open-confirm-dialog', handleOpen as EventListener);
  }, [handleOpen]);

  return (
    <>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
        <AlertDialogContent onKeyDown={handleKeyDown}>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title || t('common.confirm_dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="py-2">
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!options.isAlert && (
              <AlertDialogCancel onClick={handleCancel}>
                {options.cancelText || t('common.cancel')}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={options.variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
              autoFocus
            >
              {options.confirmText || t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
