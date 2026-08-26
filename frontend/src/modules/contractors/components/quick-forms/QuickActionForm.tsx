import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useQuickActionMutations, QuickActionType } from "../../hooks/useQuickActionMutations";
import { EntityQuickForm } from "./EntityQuickForm";
import { EventReminderForm } from "./EventReminderForm";

interface QuickActionFormProps {
  type: QuickActionType;
  contractorName: string;
  contractorId?: number | string;
  statuses?: Array<{ id: string; name: string }>;
  priorities?: Array<{ id: string; name: string }>;
  projectTypes?: Array<{ id: string; name: string }>;
  caseTypes?: Array<{ id: string; name: string }>;
  initialDescription?: string;
  initialLocation?: string;
  onSuccess: () => void;
  // This ref is passed from parent to allow triggering save from the Sheet's button
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

interface Notification {
  id: string;
  value: string;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

interface User {
  id: number | string;
  name: string;
}

export function QuickActionForm({
  type,
  contractorName,
  contractorId,
  statuses = [],
  priorities = [],
  projectTypes = [],
  caseTypes = [],
  initialDescription = '',
  initialLocation = '',
  onSuccess,
  saveRef,
}: QuickActionFormProps) {
  const { t } = useTranslation();
  const { performAction } = useQuickActionMutations();

  // Initial values computed during first render
  const [title, setTitle] = useState(() => {
    const typeLabels: Record<string, string> = {
      task: t('components.label.task'),
      claim: t('components.label.claim'),
      project: t('components.label.projects'),
      event: t('components.label.event'),
      reminder: t('components.label.reminder')
    };
    return `${typeLabels[type] || t('components.label.action')} ${t('common.for_contractor')} ${contractorName}`;
  });
  
  const [description, setDescription] = useState(initialDescription || '');
  const [status, setStatus] = useState(() => {
    if ((type === 'event' || type === 'reminder') && statuses.length === 0) {
      return 'pending';
    }
    return statuses.length > 0 ? statuses[0].id : '';
  });
  
  const [priority, setPriority] = useState(() => {
    return priorities.length > 0 ? priorities[0].id : 'Medium';
  });
  
  const [assignee, setAssignee] = useState(() => {
    return localStorage.getItem("titan_user_id") || '2';
  });

  const [users, setUsers] = useState<User[]>([]);
  const [typeValue, setTypeValue] = useState('');
  const [startDate, setStartDate] = useState(() => {
    if (type === 'event' || type === 'reminder') {
      return new Date().toISOString().slice(0, 16);
    }
    return '';
  });
  const [endDate, setEndDate] = useState(() => {
    if (type === 'event' || type === 'reminder') {
      const oneHourLater = new Date(Date.now() + 3600000);
      return oneHourLater.toISOString().slice(0, 16);
    }
    return '';
  });
  
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState(initialLocation || '');
  const [repeat, setRepeat] = useState('none');
  const [notifications, setNotifications] = useState<Notification[]>(() => [
    { id: Math.random().toString(), value: '15', unit: 'minutes' }
  ]);
  const [remindOnDay, setRemindOnDay] = useState(true);
  const [remindAtTime, setRemindAtTime] = useState(true);
  const [reminderPriority, setReminderPriority] = useState('none');

  useEffect(() => {
    api.get('/users').then(response => {
      const usersData = Array.isArray(response) ? response : (response?.data || []);
      setUsers(usersData);
    }).catch(console.error);
  }, []);

  const addNotification = useCallback(() => {
    setNotifications(prev => [...prev, { id: Math.random().toString(), value: '30', unit: 'minutes' }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateNotification = useCallback((id: string, field: keyof Notification, value: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  }, []);

  const handleSave = useCallback(async () => {
    const selectedUser = users.find(u => String(u.id) === String(assignee));
    const assigneeName = selectedUser ? selectedUser.name : (assignee || '');

    const success = await performAction({
      type,
      title,
      description,
      contractorId,
      contractorName,
      status,
      priority: type === 'reminder' ? (reminderPriority !== 'none' ? reminderPriority : priority) : priority,
      assignee: (type === 'claim' || type === 'event' || type === 'reminder') ? assignee : assigneeName,
      typeValue,
      startDate,
      endDate,
      allDay: isAllDay,
      location,
      notifications: notifications.map(n => ({ value: n.value, unit: n.unit }))
    });

    if (success) {
      onSuccess();
    }
  }, [users, assignee, performAction, type, title, description, contractorId, contractorName, status, reminderPriority, priority, typeValue, startDate, endDate, isAllDay, location, notifications, onSuccess]);

  // Expose handleSave to parent
  useEffect(() => {
    saveRef.current = handleSave;
    return () => { saveRef.current = null; };
  }, [handleSave, saveRef]);

  if (type === 'event' || type === 'reminder') {
    return (
      <EventReminderForm
        type={type}
        title={title}
        setTitle={setTitle}
        location={location}
        setLocation={setLocation}
        isAllDay={isAllDay}
        setIsAllDay={setIsAllDay}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        repeat={repeat}
        setRepeat={setRepeat}
        notifications={notifications}
        addNotification={addNotification}
        removeNotification={removeNotification}
        updateNotification={updateNotification}
        status={status}
        setStatus={setStatus}
        statuses={statuses}
        priority={priority}
        setPriority={setPriority}
        priorities={priorities}
        reminderPriority={reminderPriority}
        setReminderPriority={setReminderPriority}
        remindOnDay={remindOnDay}
        setRemindOnDay={setRemindOnDay}
        remindAtTime={remindAtTime}
        setRemindAtTime={setRemindAtTime}
        assignee={assignee}
        setAssignee={setAssignee}
        description={description}
        setDescription={setDescription}
      />
    );
  }

  return (
    <EntityQuickForm
      type={type}
      contractorName={contractorName}
      title={title}
      setTitle={setTitle}
      description={description}
      setDescription={setDescription}
      status={status}
      setStatus={setStatus}
      statuses={statuses}
      priority={priority}
      setPriority={setPriority}
      priorities={priorities}
      assignee={assignee}
      setAssignee={setAssignee}
      typeValue={typeValue}
      setTypeValue={setTypeValue}
      caseTypes={caseTypes}
      projectTypes={projectTypes}
    />
  );
}
