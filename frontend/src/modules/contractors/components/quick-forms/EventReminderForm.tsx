import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserSelect } from "@/components/shared/UserSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, X, Bell } from "lucide-react";

interface Notification {
  id: string;
  value: string;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

interface EventReminderFormProps {
  type: 'event' | 'reminder';
  title: string;
  setTitle: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  repeat: string;
  setRepeat: (v: string) => void;
  notifications: Notification[];
  addNotification: () => void;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, field: keyof Notification, value: string) => void;
  status: string;
  setStatus: (v: string) => void;
  statuses: Array<{ id: string; name: string }>;
  priority: string;
  setPriority: (v: string) => void;
  priorities: Array<{ id: string; name: string }>;
  reminderPriority: string;
  setReminderPriority: (v: string) => void;
  remindOnDay: boolean;
  setRemindOnDay: (v: boolean) => void;
  remindAtTime: boolean;
  setRemindAtTime: (v: boolean) => void;
  assignee: string;
  setAssignee: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

import { useTranslation } from "@/lib/i18n";
// ... (imports)

// ... (interfaces)

export function EventReminderForm({
  type,
  title,
  setTitle,
  location,
  setLocation,
  isAllDay,
  setIsAllDay,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  repeat,
  setRepeat,
  notifications,
  addNotification,
  removeNotification,
  updateNotification,
  status,
  setStatus,
  statuses,
  priority,
  setPriority,
  priorities,
  reminderPriority,
  setReminderPriority,
  remindOnDay,
  setRemindOnDay,
  remindAtTime,
  setRemindAtTime,
  assignee,
  setAssignee,
  description,
  setDescription,
}: EventReminderFormProps) {
  const { t } = useTranslation();
  if (type === 'event') {
    return (
      <div className="space-y-5">
        {/* Группа 1: Название и Место */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3">
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('common.name')} 
              className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="px-4 py-3 border-t">
            <Input 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('contractor_sheet.placeholder.location_or_video')} 
              className="text-sm border-none p-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Группа 2: Время и Повтор */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium">{t('common.all_day')}</Label>
            <Checkbox checked={isAllDay} onCheckedChange={(v) => setIsAllDay(!!v)} className="rounded-full" />
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between group">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.start')}</Label>
            <input 
              type={isAllDay ? "date" : "datetime-local"} 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-[15px] bg-transparent border-none outline-none text-right text-primary font-medium focus:opacity-70 transition-opacity"
            />
          </div>

          <div className="px-4 py-3 flex items-center justify-between group">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.end')}</Label>
            <input 
              type={isAllDay ? "date" : "datetime-local"} 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-[15px] bg-transparent border-none outline-none text-right text-primary font-medium focus:opacity-70 transition-opacity"
            />
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.repeat')}</Label>
            <Select value={repeat} onValueChange={setRepeat}>
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.repeat_none')}</SelectItem>
                <SelectItem value="daily">{t('common.repeat_daily')}</SelectItem>
                <SelectItem value="weekly">{t('common.repeat_weekly')}</SelectItem>
                <SelectItem value="monthly">{t('common.repeat_monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Группа 3: Уведомления */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center justify-between">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Bell className="w-3 h-3" /> {t('common.notifications_label')}
            </Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={addNotification}
              className="h-5 px-2 text-[11px] font-bold text-primary hover:bg-primary/10"
            >
              <Plus className="w-3 h-3 mr-1" /> {t('common.add')}
            </Button>
          </div>
          
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-center px-4 py-2 group">
                <div className="flex-1 flex items-center gap-1">
                  <Input 
                    type="number" 
                    value={notif.value} 
                    onChange={(e) => updateNotification(notif.id, 'value', e.target.value)}
                    className="w-12 h-7 text-sm border-none bg-muted/20 focus-visible:ring-1 text-center p-0 rounded-md"
                  />
                  <Select 
                    value={notif.unit} 
                    onValueChange={(v) => updateNotification(notif.id, 'unit', v as Notification['unit'])}
                  >
                    <SelectTrigger className="h-7 text-sm border-none bg-transparent focus:ring-0 w-auto px-1 font-medium text-foreground/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">{t('common.minutes_before')}</SelectItem>
                      <SelectItem value="hours">{t('common.hours_before')}</SelectItem>
                      <SelectItem value="days">{t('common.days_before')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeNotification(notif.id)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground italic text-center">
                {t('common.no_notifications')}
              </div>
            )}
          </div>
        </div>

        {/* Группа 4: Метаданные */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {statuses.length === 0 ? (
                  <>
                    <SelectItem value="pending">{t('common.status_pending')}</SelectItem>
                    <SelectItem value="completed">{t('common.status_completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('common.status_cancelled')}</SelectItem>
                  </>
                ) : (
                  statuses.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <Label className="text-[15px] font-medium text-foreground/80">{t('common.priority')}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 text-foreground font-medium bg-transparent">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[15px] font-medium text-foreground/80">{t('common.assignee')}</Label>
            </div>
            <UserSelect value={assignee} onValueChange={setAssignee} className="h-9 border-none bg-muted/30 focus:ring-1" />
          </div>
        </div>

        {/* Группа 5: Описание */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3">
            <Label className="text-[15px] font-medium text-foreground/80 block mb-2">{t('common.notes')}</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('common.add_text_placeholder')} 
              className="min-h-[200px] border-none p-0 focus-visible:ring-0 resize-y bg-transparent placeholder:text-muted-foreground/40" 
            />
          </div>
        </div>
      </div>
    );
  }

  // Reminder Style
  return (
    <div className="space-y-5">
      {/* Группа 1: Название и Заметки */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3">
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('common.remind_me_about_placeholder')} 
            className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="px-4 py-3 border-t">
          <Textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('common.notes')} 
            className="text-sm border-none p-0 focus-visible:ring-0 bg-transparent min-h-[150px] resize-y placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Группа 2: Время */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <Label className="text-[15px] font-medium">{t('common.on_day')}</Label>
            <span className="text-[11px] text-muted-foreground">{t('common.notify_on_selected_date')}</span>
          </div>
          <div className="flex items-center gap-3">
            {remindOnDay && (
              <input 
                type="date" 
                value={startDate.split('T')[0]} 
                onChange={(e) => setStartDate(e.target.value + 'T' + startDate.split('T')[1])}
                className="text-sm bg-transparent border-none outline-none text-right text-primary font-medium focus:opacity-70 transition-opacity" 
              />
            )}
            <Checkbox 
              checked={remindOnDay} 
              onCheckedChange={(v) => setRemindOnDay(!!v)} 
              className="rounded-full"
            />
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <Label className="text-[15px] font-medium">{t('common.by_time')}</Label>
            <span className="text-[11px] text-muted-foreground">{t('common.notify_at_exact_time')}</span>
          </div>
          <div className="flex items-center gap-3">
            {remindAtTime && (
              <input 
                type="time" 
                value={startDate.split('T')[1]} 
                onChange={(e) => setStartDate(startDate.split('T')[0] + 'T' + e.target.value)}
                className="text-sm bg-transparent border-none outline-none text-right text-primary font-medium focus:opacity-70 transition-opacity" 
              />
            )}
            <Checkbox 
              checked={remindAtTime} 
              onCheckedChange={(v) => setRemindAtTime(!!v)} 
              className="rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Группа 3: Приоритет и Ответственный */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden divide-y">
        <div className="px-4 py-3 flex items-center justify-between">
          <Label className="text-[15px] font-medium text-foreground/80">{t('common.priority')}</Label>
          <Select value={reminderPriority} onValueChange={setReminderPriority}>
            <SelectTrigger className="w-auto border-none p-0 h-auto focus:ring-0 font-medium bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('common.none')}</SelectItem>
              <SelectItem value="low">{t('common.priority_low')}</SelectItem>
              <SelectItem value="Medium">{t('common.priority_medium')}</SelectItem>
              <SelectItem value="high">{t('common.priority_high')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="px-4 py-3">
          <Label className="text-[15px] font-medium text-foreground/80 block mb-2">{t('common.assignee')}</Label>
          <UserSelect value={assignee} onValueChange={setAssignee} className="h-9 border-none bg-muted/30 focus:ring-1" />
        </div>
      </div>
    </div>
  );
}
