import { addDays, isBefore, isAfter, startOfDay, format, parse } from 'date-fns';
import type { CalendarEvent, EventType } from '../types/calendar.types';
import type { CalendarSettings } from '../types/settings.types';

interface BirthdaySource {
  id: string;
  name: string;
  dateField: string | null; // YYYY-MM-DD дата
  type: 'contractor_registration' | 'employee_birth' | 'employee_hire';
  category: 'contractor' | 'employee';
}

/**
 * Расчитывает дню рождения для текущего года на основе даты из БД
 */
function calculateBirthdayThisYear(dateStr: string | null, currentDate: Date): Date | null {
  if (!dateStr) return null;

  try {
    // dateStr в формате YYYY-MM-DD или НН.ММ.ГГГГ
    let parsed: Date;
    
    if (dateStr.includes('-')) {
      // YYYY-MM-DD
      parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    } else if (dateStr.includes('.')) {
      // ДД.ММ.ГГГГ
      parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
    } else {
      return null;
    }

    if (isNaN(parsed.getTime())) return null;

    // Берем месяц и день из даты, применяем к текущему году
    const month = parsed.getMonth();
    const day = parsed.getDate();
    
    const birthdayThisYear = new Date(currentDate.getFullYear(), month, day);
    
    return birthdayThisYear;
  } catch (error) {
    console.error('Error calculating birthday:', error);
    return null;
  }
}

/**
 * Определяет, нужно ли показывать событие дня рождения
 */
function shouldShowBirthdayEvent(
  birthdayDate: Date,
  currentDate: Date,
  warningDays: number,
  showOnBirthDay: boolean
): boolean {
  const today = startOfDay(currentDate);
  const warningStart = startOfDay(addDays(today, -warningDays));
  const warningEnd = startOfDay(addDays(today, 1));
  
  const birthdayDateNormalized = startOfDay(birthdayDate);

  if (showOnBirthDay && birthdayDateNormalized.getTime() === today.getTime()) {
    return true;
  }

  return isBefore(birthdayDateNormalized, warningEnd) && 
         isAfter(birthdayDateNormalized, warningStart);
}

/**
 * Преобразует список дней рождения в события календаря
 */
export function transformBirthdaysToEvents(
  contractors: any[] = [],
  employees: any[] = [],
  settings: CalendarSettings,
  currentDate: Date = new Date()
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  if (!settings.birthdays.enabled) {
    return events;
  }

  // Дни регистрации контрагентов
  if (settings.birthdays.showContractors) {
    contractors.forEach((contractor) => {
      if (!contractor.registrationDate) return;

      const birthdayDate = calculateBirthdayThisYear(contractor.registrationDate, currentDate);
      if (!birthdayDate) return;

      if (shouldShowBirthdayEvent(birthdayDate, currentDate, settings.birthdays.warningDays, settings.birthdays.showOnBirthDay)) {
        const daysUntil = Math.ceil(
          (birthdayDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        events.push({
          id: `birthday-contractor-${contractor.id}`,
          title: contractor.name,
          date: birthdayDate,
          type: 'contractor-anniversary' as EventType,
          allDay: true,
          description: `Годовщина регистрации контрагента${
            daysUntil > 0 ? ` (через ${daysUntil} ${getPluralDays(daysUntil)})` : ' (сегодня!)'
          }`,
          client: contractor.name,
          notifications: [],
        } as CalendarEvent);
      }
    });
  }

  // Дни рождения сотрудников
  if (settings.birthdays.showEmployees) {
    employees.forEach((employee) => {
      if (!employee.birth_date) return;

      const birthdayDate = calculateBirthdayThisYear(employee.birth_date, currentDate);
      if (!birthdayDate) return;

      if (shouldShowBirthdayEvent(birthdayDate, currentDate, settings.birthdays.warningDays, settings.birthdays.showOnBirthDay)) {
        const daysUntil = Math.ceil(
          (birthdayDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        events.push({
          id: `birthday-employee-${employee.id}`,
          title: employee.full_name,
          date: birthdayDate,
          type: 'birthday' as EventType,
          allDay: true,
          description: `День рождения${
            daysUntil > 0 ? ` (через ${daysUntil} ${getPluralDays(daysUntil)})` : ' (сегодня!)'
          }`,
          assignee: employee.full_name,
          notifications: [],
        } as CalendarEvent);
      }
    });
  }

  // Годовщины найма сотрудников
  if (settings.birthdays.showHireDates) {
    employees.forEach((employee) => {
      if (!employee.hire_date) return;

      const hireAnniversary = calculateBirthdayThisYear(employee.hire_date, currentDate);
      if (!hireAnniversary) return;

      if (shouldShowBirthdayEvent(hireAnniversary, currentDate, settings.birthdays.warningDays, settings.birthdays.showOnBirthDay)) {
        const daysUntil = Math.ceil(
          (hireAnniversary.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        events.push({
          id: `hire-anniversary-${employee.id}`,
          title: employee.full_name,
          date: hireAnniversary,
          type: 'hire-anniversary' as EventType,
          allDay: true,
          description: `Годовщина найма${
            daysUntil > 0 ? ` (через ${daysUntil} ${getPluralDays(daysUntil)})` : ' (сегодня!)'
          }`,
          assignee: employee.full_name,
          notifications: [],
        } as CalendarEvent);
      }
    });
  }

  return events;
}

/**
 * Возвращает правильное множественное число для слова "день"
 */
function getPluralDays(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return 'дней';
  }
  if (mod10 === 1) {
    return 'день';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'дня';
  }
  return 'дней';
}
