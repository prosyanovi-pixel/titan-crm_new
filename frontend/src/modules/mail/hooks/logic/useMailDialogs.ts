import { useState, useCallback } from "react";
import { Mail as MailType, ApiMailFolder } from "../../types";

export function useMailDialogs() {
  // Состояние для диалога подтверждения удаления
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    mail: MailType | null;
  }>({ open: false, mail: null });

  // Состояние для диалога очистки папки
  const [clearFolderDialog, setClearFolderDialog] = useState<{
    open: boolean;
    folderId: string | null;
    folderName: string | null;
  }>({ open: false, folderId: null, folderName: null });

  // Состояние для создания метки
  const [createLabelDialog, setCreateLabelDialog] = useState<{
    open: boolean;
    mail: MailType | null;
  }>({ open: false, mail: null });
  const [newLabelName, setNewLabelName] = useState('');

  // Состояние для создания события из письма
  const [createEventDialog, setCreateEventDialog] = useState<{
    open: boolean;
    mail: MailType | null;
  }>({ open: false, mail: null });

  // Состояние для создания фильтра из письма
  const [createFilterDialog, setCreateFilterDialog] = useState<{
    open: boolean;
    mail: MailType | null;
    filterName: string;
    fromEmail: string;
  }>({ open: false, mail: null, filterName: '', fromEmail: '' });

  // Состояние для управления папками (создание/переименование)
  const [folderDialog, setFolderDialog] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    folder: ApiMailFolder | null;
  }>({ open: false, mode: 'create', folder: null });
  const [folderDialogName, setFolderDialogName] = useState('');

  return {
    deleteConfirmDialog,
    setDeleteConfirmDialog,
    clearFolderDialog,
    setClearFolderDialog,
    createLabelDialog,
    setCreateLabelDialog,
    newLabelName,
    setNewLabelName,
    createEventDialog,
    setCreateEventDialog,
    createFilterDialog,
    setCreateFilterDialog,
    folderDialog,
    setFolderDialog,
    folderDialogName,
    setFolderDialogName,
  };
}
