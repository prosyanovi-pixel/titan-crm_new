import { useState, useEffect, useCallback } from 'react';
import { Mail } from '../types';

type ViewMode = 'list' | 'mail' | 'compose' | 'settings';

interface UseMailViewReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  isComposeMinimized: boolean;
  setIsComposeMinimized: (minimized: boolean) => void;
  settingsAccountId: string | null;
  setSettingsAccountId: (id: string | null) => void;
  replyToMail: Mail | null;
  setReplyToMail: (mail: Mail | null) => void;
  isReplyAll: boolean;
  setIsReplyAll: (isAll: boolean) => void;
  forwardMail: Mail | null;
  setForwardMail: (mail: Mail | null) => void;
  handleReply: (mail: Mail) => void;
  handleReplyAll: (mail: Mail) => void;
  handleForward: (mail: Mail) => void;
  handleCloseCompose: () => void;
  handleCloseSettings: () => void;
  handleOpenSettings: (accountId?: string) => void;
}

/**
 * Хук для управления режимом просмотра почты
 */
export const useMailView = (): UseMailViewReturn => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState<boolean>(false);
  const [settingsAccountId, setSettingsAccountId] = useState<string | null>(null);
  const [replyToMail, setReplyToMail] = useState<Mail | null>(null);
  const [isReplyAll, setIsReplyAll] = useState<boolean>(false);
  const [forwardMail, setForwardMail] = useState<Mail | null>(null);

  // Обработчик открытия окна написания письма из боковой панели
  useEffect(() => {
    const handleOpenCompose = () => {
      setComposeOpen(true);
      setViewMode('compose');
    };

    // Обработчик открытия настроек аккаунта
    const handleOpenSettings = (event: CustomEvent) => {
      const accountId = event.detail?.accountId;
      setSettingsAccountId(accountId || null);
      setViewMode('settings');
    };

    window.addEventListener('open-mail-compose', handleOpenCompose as EventListener);
    window.addEventListener('open-mail-settings', handleOpenSettings as EventListener);

    return () => {
      window.removeEventListener('open-mail-compose', handleOpenCompose as EventListener);
      window.removeEventListener('open-mail-settings', handleOpenSettings as EventListener);
    };
  }, []);

  // Обработчик ответа на письмо
  const handleReply = useCallback((mail: Mail) => {
    setReplyToMail(mail);
    setIsReplyAll(false);
    setComposeOpen(true);
    setViewMode('compose');
  }, []);

  // Обработчик ответа всем
  const handleReplyAll = useCallback((mail: Mail) => {
    setReplyToMail(mail);
    setIsReplyAll(true);
    setComposeOpen(true);
    setViewMode('compose');
  }, []);

  // Обработчик пересылки письма
  const handleForward = useCallback((mail: Mail) => {
    setForwardMail(mail);
    setComposeOpen(true);
    setViewMode('compose');
  }, []);

  // Открыть настройки аккаунта
  const handleOpenSettings = useCallback((accountId?: string) => {
    setSettingsAccountId(accountId || null);
    setViewMode('settings');
  }, []);

  // Закрыть настройки
  const handleCloseSettings = useCallback(() => {
    setSettingsAccountId(null);
    setViewMode('list');
  }, []);

  // Закрытие окна compose
  const handleCloseCompose = useCallback(() => {
    setComposeOpen(false);
    setIsComposeMinimized(false);
    setReplyToMail(null);
    setForwardMail(null);
    // Больше не меняем viewMode на 'list', так как compose теперь плавающий
  }, []);

  // Установка режима просмотра с синхронизацией composeOpen
  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    // При переключении режима просмотра НЕ закрываем автоматически плавающее окно
    if (mode !== 'settings') {
      setSettingsAccountId(null);
    }
  }, []);

  // Установка состояния composeOpen с синхронизацией viewMode
  const handleSetComposeOpen = useCallback((open: boolean) => {
    setComposeOpen(open);
    if (!open) {
      setIsComposeMinimized(false);
    }
  }, []);

  return {
    viewMode,
    setViewMode: handleSetViewMode,
    composeOpen,
    setComposeOpen: handleSetComposeOpen,
    isComposeMinimized,
    setIsComposeMinimized,
    settingsAccountId,
    setSettingsAccountId,
    replyToMail,
    setReplyToMail,
    isReplyAll,
    setIsReplyAll,
    forwardMail,
    setForwardMail,
    handleReply,
    handleReplyAll,
    handleForward,
    handleCloseCompose,
    handleCloseSettings,
    handleOpenSettings,
  };
};