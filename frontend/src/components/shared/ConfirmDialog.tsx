import React from 'react';
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
import { useTranslation } from '@/lib/i18n';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

/**
 * Универсальный диалог подтверждения действий
 * 
 * Поддерживает:
 * - Клик на кнопку "Подтвердить"
 * - Нажатие клавиши Enter для подтверждения
 * - Нажатие Escape для отмены
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   onConfirm={handleDelete}
 *   title="Удалить счет?"
 *   description="Это действие нельзя отменить"
 *   confirmText="Удалить"
 *   variant="destructive"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const finalConfirmText = confirmText || t('common.confirm');
  const finalCancelText = cancelText || t('common.cancel');
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter для подтверждения
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onKeyDown={handleKeyDown}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{finalCancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {loading ? t('common.loading') + '...' : finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
