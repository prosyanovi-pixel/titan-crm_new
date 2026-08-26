import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface UseGlobalQuickActionsOptions {
  onCreateTask?: () => void;
  onCreateProject?: () => void;
  onCreateInvoice?: () => void;
  onCreatePayment?: () => void;
  onCreateEvent?: () => void;
  onCreateCase?: () => void;
  onCreateContractor?: () => void;
  onNavigate?: (path: string) => void;
}

/**
 * Хук для обработки глобальных быстрых действий (без контекста записи).
 * Вызывается из глобального меню быстрых действий модуля.
 */
export function useGlobalQuickActions(options: UseGlobalQuickActionsOptions = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch (action) {
      // Tasks
      case 'create_task':
        if (options.onCreateTask) {
          options.onCreateTask();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;

      // Projects
      case 'create_project':
        if (options.onCreateProject) {
          options.onCreateProject();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;

      // Finance
      case 'create_invoice':
        if (options.onCreateInvoice) {
          options.onCreateInvoice();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;
      case 'record_payment':
        if (options.onCreatePayment) {
          options.onCreatePayment();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;

      // Calendar
      case 'create_event':
      case 'schedule_meeting':
      case 'set_reminder':
        if (options.onCreateEvent) {
          options.onCreateEvent();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;

      // Lawyers / Cases
      case 'create_case':
        if (options.onCreateCase) {
          options.onCreateCase();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;

      // Contractors
      case 'add_note':
        if (options.onCreateContractor) {
          options.onCreateContractor();
        } else {
          toast.info(t('settings.action_not_implemented'));
        }
        break;

      // Mail navigation
      case 'send_email':
        if (options.onNavigate) {
          options.onNavigate('/mail');
        } else {
          navigate('/mail');
        }
        break;
      case 'view_inbox':
      case 'view_drafts':
      case 'view_sent':
        if (options.onNavigate) {
          options.onNavigate('/mail');
        } else {
          navigate('/mail');
        }
        break;

      default:
        toast.info(t('settings.action_not_implemented'));
    }
  };

  return { handleAction };
}
