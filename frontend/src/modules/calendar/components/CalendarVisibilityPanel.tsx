import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function CalendarVisibilityPanel() {
  const { t } = useTranslation();
  const { settings, updateBirthdaySettings } = useCalendarSettings();

  if (!settings) return null;

  const bs = settings.birthdays;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          title={t('calendar.settings.title')}
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('calendar.settings.title')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>{t('calendar.settings.title')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Основной переключатель дни рождения */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-birthdays"
                checked={bs.enabled}
                onCheckedChange={(v) => updateBirthdaySettings({ enabled: Boolean(v) })}
              />
              <Label htmlFor="enable-birthdays" className="cursor-pointer font-medium">
                {t('calendar.settings.birthdays.title')}
              </Label>
            </div>

            {bs.enabled && (
              <>
                <Separator className="my-3" />

                {/* Контрагенты - День регистрации */}
                <div className="flex items-center space-x-2 pl-6">
                  <Checkbox
                    id="show-contractors"
                    checked={bs.showContractors}
                    onCheckedChange={(v) => updateBirthdaySettings({ showContractors: Boolean(v) })}
                  />
                  <Label htmlFor="show-contractors" className="cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      {t('calendar.settings.birthdays.show_contractors')}
                    </div>
                  </Label>
                </div>

                {/* Сотрудники - День рождения */}
                <div className="flex items-center space-x-2 pl-6">
                  <Checkbox
                    id="show-employees"
                    checked={bs.showEmployees}
                    onCheckedChange={(v) => updateBirthdaySettings({ showEmployees: Boolean(v) })}
                  />
                  <Label htmlFor="show-employees" className="cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      {t('calendar.settings.birthdays.show_employees')}
                    </div>
                  </Label>
                </div>

                {/* Сотрудники - Годовщина найма */}
                <div className="flex items-center space-x-2 pl-6">
                  <Checkbox
                    id="show-hire-dates"
                    checked={bs.showHireDates}
                    onCheckedChange={(v) => updateBirthdaySettings({ showHireDates: Boolean(v) })}
                  />
                  <Label htmlFor="show-hire-dates" className="cursor-pointer text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      {t('calendar.settings.birthdays.show_hire_dates')}
                    </div>
                  </Label>
                </div>

                <Separator className="my-3" />

                {/* Напоминание за N дней */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-semibold">
                    {t('calendar.settings.birthdays.warning_days')}
                  </Label>
                  <div className="flex gap-1 flex-wrap">
                    {[0, 1, 3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => updateBirthdaySettings({ warningDays: days })}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                          bs.warningDays === days
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {days === 0 ? 'Сегодня' : `${days}д`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Показывать в день события */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-on-birth-day"
                    checked={bs.showOnBirthDay}
                    onCheckedChange={(v) => updateBirthdaySettings({ showOnBirthDay: Boolean(v) })}
                  />
                  <Label htmlFor="show-on-birth-day" className="cursor-pointer text-sm">
                    {t('calendar.settings.birthdays.on_birth_day')}
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-xs text-muted-foreground">
          Совет: Те же настройки можно изменить в модуле Настройки → Календарь
        </p>
      </SheetContent>
    </Sheet>
  );
}
