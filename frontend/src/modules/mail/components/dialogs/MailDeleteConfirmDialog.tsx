import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail as MailType } from "../../types";

interface MailDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mail: MailType | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MailDeleteConfirmDialog({ open, onOpenChange, mail, onConfirm, onCancel }: MailDeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить письмо?</AlertDialogTitle>
          <AlertDialogDescription>
            {mail?.subject || 'Без темы'} будет удалено. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
