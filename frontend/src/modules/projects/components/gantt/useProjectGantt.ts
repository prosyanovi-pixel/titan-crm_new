import { parse, differenceInDays, addMonths, startOfMonth, eachMonthOfInterval, endOfMonth, isBefore, isAfter } from "date-fns";
import { Project } from "../../types";

/**
 * Парсит строку даты в объект Date
 * Поддерживает форматы "ДД.ММ.ГГГГ" и стандартный ISO
 * 
 * @param dateStr - Строка с датой
 * @returns Объект Date
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  if (dateStr.includes('.')) {
    const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  
  return new Date();
}

/**
 * Возвращает CSS-класс цвета в зависимости от статуса проекта
 * 
 * @param status - ID статуса проекта
 * @returns Tailwind CSS класс цвета фона
 */
export function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-primary';
    case 'pending': return 'bg-amber-500';
    case 'finished': return 'bg-green-600';
    case 'paused': return 'bg-slate-400';
    case 'archived': return 'bg-slate-500';
    default: return 'bg-slate-400';
  }
}

/**
 * Хук для расчета временного диапазона и параметров диаграммы Ганта
 * 
 * Рассчитывает:
 * - Минимальную и максимальную дату среди всех проектов
 * - Список месяцев для временной шкалы
 * - Общее количество дней в диапазоне
 * 
 * @param projects - Список проектов для отображения
 * @returns Параметры для рендеринга диаграммы Ганта
 */
export function useProjectGantt(projects: Project[]) {
  const today = new Date();
  
  let minDate = startOfMonth(today);
  let maxDate = endOfMonth(addMonths(today, 6));

  const calculateRange = (items: Project[]) => {
    items.forEach(project => {
      const start = project.startDate ? parseDate(project.startDate) : null;
      const end = project.endDate ? parseDate(project.endDate) : project.deadline ? parseDate(project.deadline) : null;
      
      if (start && isBefore(start, minDate)) {
        minDate = start;
      }
      if (end && isAfter(end, maxDate)) {
        maxDate = end;
      }

      if (project.subProjects && project.subProjects.length > 0) {
        calculateRange(project.subProjects);
      }
    });
  };

  calculateRange(projects);

  minDate = startOfMonth(addMonths(minDate, -1));
  maxDate = endOfMonth(addMonths(maxDate, 1));

  const months = eachMonthOfInterval({ start: minDate, end: maxDate });
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  return { minDate, maxDate, months, totalDays };
}
