import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CalendarSettingsPanel() {
  const { t } = useTranslation();
  const { settings, updateBirthdaySettings } = useCalendarSettings();

  if (!settings) return null;

  const bs = settings.birthdays;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('calendar.settings.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Основной переключатель дни рождения */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div>
            <Label className="font-medium">{t('calendar.settings.birthdays.title')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.calendar.titles.birthdays_hint')}
            </p>
          </div>
          <Switch
            checked={bs.enabled}
            onCheckedChange={(v) => updateBirthdaySettings({ enabled: v })}
            className="ml-2"
          />
        </div>

        {bs.enabled && (
          <>
            {/* Контрагенты */}
            <div className="pl-4 border-l-2 border-primary space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-contractors">
                  {t('calendar.settings.birthdays.show_contractors')}
                </Label>
                <Switch
                  id="show-contractors"
                  checked={bs.showContractors}
                  onCheckedChange={(v) => updateBirthdaySettings({ showContractors: v })}
                />
              </div>

              {/* Сотрудники - День рождения */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-employees">
                  {t('calendar.settings.birthdays.show_employees')}
                </Label>
                <Switch
                  id="show-employees"
                  checked={bs.showEmployees}
                  onCheckedChange={(v) => updateBirthdaySettings({ showEmployees: v })}
                />
              </div>

              {/* Сотрудники - Годовщина найма */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-hire-dates">
                  {t('calendar.settings.birthdays.show_hire_dates')}
                </Label>
                <Switch
                  id="show-hire-dates"
                  checked={bs.showHireDates}
                  onCheckedChange={(v) => updateBirthdaySettings({ showHireDates: v })}
                />
              </div>

              {/* Напоминание за N дней */}
              <div className="space-y-2">
                <Label htmlFor="warning-days" className="text-sm">
                  {t('calendar.settings.birthdays.warning_days')}
                </Label>
                <Select
                  value={String(bs.warningDays)}
                  onValueChange={(v) => updateBirthdaySettings({ warningDays: parseInt(v, 10) })}
                >
                  <SelectTrigger id="warning-days" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('settings.calendar.intervals.days_0')}</SelectItem>
                    <SelectItem value="1">{t('settings.calendar.intervals.days_1')}</SelectItem>
                    <SelectItem value="3">{t('settings.calendar.intervals.days_3')}</SelectItem>
                    <SelectItem value="7">{t('settings.calendar.intervals.days_7')}</SelectItem>
                    <SelectItem value="14">{t('settings.calendar.intervals.days_14')}</SelectItem>
                    <SelectItem value="30">{t('settings.calendar.intervals.days_30')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('settings.calendar.intervals.hint')}
                </p>
              </div>

              {/* Показывать в день события */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-on-birth-day">
                  {t('calendar.settings.birthdays.on_birth_day')}
                </Label>
                <Switch
                  id="show-on-birth-day"
                  checked={bs.showOnBirthDay}
                  onCheckedChange={(v) => updateBirthdaySettings({ showOnBirthDay: v })}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
