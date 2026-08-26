import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";

/** Тип быстрого действия для контрагента */
export type QuickActionType = 'task' | 'claim' | 'project' | 'event' | 'reminder';

interface QuickActionParams {
  type: QuickActionType;
  title: string;
  description: string;
  contractorId?: number | string;
  contractorName: string;
  status: string;
  priority: string;
  assignee: string;
  typeValue?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  notifyAssignee?: boolean;
  notifyClient?: boolean;
  notifications?: Array<{ value: string; unit: string }>;
}

/**
 * Хук для выполнения быстрых действий над контрагентом (создание задачи, претензии, проекта, события, напоминания).
 * @returns Метод performAction для выполнения действия и флаг isSaving
 */
export function useQuickActionMutations() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const performAction = useCallback(async (params: QuickActionParams) => {
    const { 
      type, title, description, contractorId, contractorName, 
      status, priority, assignee, typeValue, startDate, endDate,
      allDay, location, notifyAssignee, notifyClient, notifications
    } = params;

    if (!title.trim() && type !== 'event' && type !== 'reminder') {
      toast.error(t('generated.zapolnite_nazvanie'));
      return false;
    }

    setIsSaving(true);

    try {
      if (type === 'task') {
        await api.post('/tasks', {
          title,
          description,
          status: status || 'To Do',
          priority: priority || 'Medium',
          contractorId,
          contractorName,
          assignee, // Here we expect the display name from the caller if needed
          dueDate: '',
        });
        toast.success(t('generated.zadacha_sozdana'));
      } else if (type === 'claim') {
        await api.post('/legal-cases', {
          title,
          description,
          type: typeValue || 'claim',
          status: status || 'new',
          contractorId,
          contractorName,
          lawyerUserId: assignee, // ID is expected here
          outcome: '',
        });
        toast.success(t('generated.pretenziya_sozdana'));
      } else if (type === 'event' || type === 'reminder') {
        const isReminder = type === 'reminder';
        const payload = {
          title: title || (isReminder ? t('quick_sheet.new_reminder') : t('quick_sheet.new_event')),
          description,
          startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
          endDate: isReminder 
            ? (startDate ? new Date(startDate).toISOString() : new Date().toISOString()) 
            : (endDate ? new Date(endDate).toISOString() : new Date().toISOString()),
          status: status || 'pending',
          priority: priority || 'Medium',
          contractorId: contractorId ? String(contractorId) : null,
          assignee: assignee || null,
          type: isReminder ? 'reminder' : 'meeting',
          allDay,
          location: location || '',
          notifyAssignee,
          notifyClient,
          notifications: notifications?.map(n => ({ type: 'relative', value: n.value, unit: n.unit })) || []
        };
        await api.post('/calendar/events', payload);
        toast.success(isReminder ? t('toast.reminder_created') : t('calendar.event_created'));
      } else if (type === 'project') {
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
        
        await api.post('/projects', {
          name: title,
          description,
          status: status || 'active',
          priority: priority || 'Medium',
          type: typeValue,
          contractorId,
          contractorName,
          manager: assignee,
          budget: 0,
          deadline: formattedDate,
        });
        toast.success(t('generated.proekt_sozdan'));
      }
      return true;
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      toast.error(t('generated.oshibka_sozdaniya'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [t]);

  return {
    performAction,
    isSaving,
  };
}
