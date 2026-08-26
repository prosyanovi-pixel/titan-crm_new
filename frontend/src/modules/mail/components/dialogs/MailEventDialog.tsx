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
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { Mail as MailType } from "../../types";

interface MailEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mail: MailType | null;
  onConfirm: (data: any) => void;
  onCancel: () => void;
}

export function MailEventDialog({ 
  open, 
  onOpenChange, 
  mail, 
  onConfirm, 
  onCancel 
}: MailEventDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('mail.event_dialog.title')}</DialogTitle>
          <DialogDescription>
            {mail?.subject && (
              <p className="text-sm mt-2">{t('mail.event_dialog.based_on_mail', { subject: mail.subject })}</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="event-title">{t('mail.event_dialog.event_title')}</Label>
            <Input
              id="event-title"
              defaultValue={mail?.subject || t('mail.event_dialog.default_title')}
              placeholder={t('mail.event_dialog.event_title')}
              readOnly
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {t('mail.event_dialog.description')}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => {
              if (mail) {
                const senderName = typeof mail.sender === 'object' 
                  ? mail.sender?.name 
                  : (typeof mail.sender === 'string' 
                      ? mail.sender 
                      : t('mail.event_dialog.unknown_sender'));
                onConfirm({
                  title: mail.subject,
                  description: t('mail.event_dialog.confirm_desc', { sender: senderName }),
                });
              }
            }}
          >
            {t('mail.event_dialog.title')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
