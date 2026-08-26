export interface CalendarSettings {
  birthdays: {
    enabled: boolean;
    showContractors: boolean;
    showEmployees: boolean;
    showHireDates: boolean;
    warningDays: number; // За сколько дней напоминать (0, 1, 3, 7)
    showOnBirthDay: boolean; // Показывать в день события
  };
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  birthdays: {
    enabled: true,
    showContractors: true,
    showEmployees: true,
    showHireDates: true,
    warningDays: 3,
    showOnBirthDay: true,
  },
};
