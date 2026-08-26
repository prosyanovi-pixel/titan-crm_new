import React from "react";
import { useTranslation } from "@/lib/i18n";
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

interface MailFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterName: string;
  fromEmail: string;
  onDataChange: (data: { filterName: string, fromEmail: string }) => void;
  onConfirm: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function MailFilterDialog({ 
  open, 
  onOpenChange, 
  filterName, 
  fromEmail, 
  onDataChange,
  onConfirm, 
  onCancel 
}: MailFilterDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("mail.filters.create_dialog_title")}</DialogTitle>
          <DialogDescription>
            {t("mail.filters.create_dialog_desc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onConfirm} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filter-name">{t("mail.filters.name")}</Label>
            <Input
              id="filter-name"
              value={filterName}
              onChange={(e) => onDataChange({ filterName: e.target.value, fromEmail })}
              placeholder={t("mail.filters.name_placeholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-email">{t("mail.filters.filter_email")}</Label>
            <Input
              id="filter-email"
              value={fromEmail}
              onChange={(e) => onDataChange({ filterName, fromEmail: e.target.value })}
              placeholder={t("mail.filters.filter_email")}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {t("mail.filters.filter_hint")}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {t("general.cancel")}
            </Button>
            <Button type="submit">
              {t("mail.filters.create_dialog_title")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
