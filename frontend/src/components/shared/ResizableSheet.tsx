// frontend/src/components/shared/ResizableSheet.tsx
import { useRef, useCallback, ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useSheetWidth } from '@/hooks/useSheetWidth';
import type { SheetWidthPreset } from '@/hooks/useSheetWidth';

export interface ResizableSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  onDelete?: () => void;
  title: ReactNode;
  description?: ReactNode;
  moduleKey: string; // Ключ модуля для сохранения ширины (например: 'project-sheet', 'lawyer-sheet')
  defaultWidth?: SheetWidthPreset;
  children: ReactNode;
  showDeleteButton?: boolean;
  saveButtonLabel?: string;
  cancelButtonLabel?: string;
  hasUnsavedChanges?: boolean;
  onShowDiscardDialog?: () => void;
  saveDisabled?: boolean;
  cancelButtonOnLeft?: boolean;
  contentClassName?: string;
  hideFooter?: boolean;
}

/**
 * Переиспользуемый компонент Sheet с функционалом изменения размера
 * Сохраняет ширину для каждого модуля отдельно
 */
export function ResizableSheet({
  open,
  onOpenChange,
  onSave,
  onDelete,
  title,
  description,
  moduleKey,
  defaultWidth = 'lg',
  children,
  showDeleteButton = true,
  saveButtonLabel = 'common.save',
  cancelButtonLabel = 'common.cancel',
  hasUnsavedChanges = false,
  onShowDiscardDialog,
  saveDisabled = false,
  cancelButtonOnLeft = false,
  contentClassName,
  hideFooter = false,
}: ResizableSheetProps) {
  const { t } = useTranslation();

  // Используем hook для управления шириной sheet'а
  const {
    width: sheetWidth,
    setCustomWidth: setSheetCustomWidth,
    getWidthClass,
    getWidthValue,
  } = useSheetWidth(moduleKey, defaultWidth);

  const sheetRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Обработчик изменения размера
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startXRef.current = e.clientX;
    // Берём реальную ширину из DOM элемента, а не из состояния
    const element = sheetRef.current;
    if (element) {
      startWidthRef.current = element.offsetWidth;
    } else {
      startWidthRef.current = sheetWidth.customWidth || getWidthValue();
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startXRef.current - moveEvent.clientX;
      const newWidth = Math.max(400, Math.min(startWidthRef.current + deltaX, Math.min(window.innerWidth * 0.9, 1600)));
      setSheetCustomWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sheetWidth.customWidth, setSheetCustomWidth, getWidthValue]);

  // Обработчик закрытия
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && onShowDiscardDialog) {
      onShowDiscardDialog();
    } else {
      onOpenChange(false);
    }
  }, [hasUnsavedChanges, onShowDiscardDialog, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetRef}
        className={cn('w-full', getWidthClass(), 'flex flex-col h-full p-0 gap-0')}
        style={
          sheetWidth.customWidth
            ? {
                width: `${sheetWidth.customWidth}px`,
                maxWidth: `${sheetWidth.customWidth}px`,
                transition: 'none',
              }
            : undefined
        }
        side="right"
      >
        {/* Resize Handle (левый край) */}
        <div
          ref={resizeHandleRef}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors z-[100]"
          onMouseDown={handleMouseDown}
          style={{
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        />

        {/* Header с близкой кнопкой */}
        <div className="p-4 sm:p-6 border-b border-border bg-background z-10">
          <div className="flex items-start justify-between gap-4">
            <SheetHeader className="flex-1">
              <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
              {description && (
                <SheetDescription className="flex items-center gap-2">
                  {description}
                </SheetDescription>
              )}
            </SheetHeader>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0 hover:bg-muted hover:text-muted-foreground"
              onClick={handleClose}
              title={`${t('common.close')} (Esc)`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className={cn("flex-1 overflow-y-auto p-4 sm:p-6", contentClassName)}>{children}</div>

        {/* Footer с кнопками */}
        {!hideFooter && (
          <SheetFooter className="p-4 sm:p-6 border-t border-border bg-background">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                {onDelete && showDeleteButton && (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </Button>
                )}
                {cancelButtonOnLeft && (
                  <Button variant="outline" onClick={handleClose}>
                    {t(cancelButtonLabel)}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {!cancelButtonOnLeft && (
                  <Button variant="outline" onClick={handleClose}>
                    {t(cancelButtonLabel)}
                  </Button>
                )}
                {onSave && (
                  <Button onClick={onSave} className="gap-2" disabled={saveDisabled}>
                    <CheckCircle2 className="w-4 h-4" />
                    {t(saveButtonLabel)}
                  </Button>
                )}
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
