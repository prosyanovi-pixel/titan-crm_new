import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MailFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'rename';
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  parentFolderName?: string;
}

export function MailFolderDialog({
  open,
  onOpenChange,
  mode,
  folderName,
  onFolderNameChange,
  onConfirm,
  onCancel,
  parentFolderName,
}: MailFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Создать подпапку' : 'Переименовать папку'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {mode === 'create' && parentFolderName && (
            <div className="text-sm text-muted-foreground">
              Родительская папка: <span className="font-medium text-foreground">{parentFolderName}</span>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Название папки</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
              placeholder="Введите название..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && folderName.trim()) {
                  onConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onConfirm} disabled={!folderName.trim()}>
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
