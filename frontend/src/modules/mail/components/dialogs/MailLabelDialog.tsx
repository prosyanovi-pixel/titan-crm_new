import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface MailLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelName: string;
  onLabelNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MailLabelDialog({ 
  open, 
  onOpenChange, 
  labelName, 
  onLabelNameChange, 
  onConfirm, 
  onCancel 
}: MailLabelDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('mail.label_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('mail.label_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder={t('mail.label_dialog.placeholder')}
            value={labelName}
            onChange={(e) => onLabelNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={onConfirm}>
            {t('mail.label_dialog.create_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
