export * from './auth';
export * from './business';
export * from './common';
export * from './components';
export * from './general';
export * from './layout';
export * from './legal';
export * from './lost';
export * from './errors';
export * from './notifications';
export * from './office';
export * from './placeholders';
export * from './profile';
export * from './references';
export * from './settings';
export * from './modules';
export { products } from '@/modules/products/i18n/ru/index';
export { services } from '@/modules/services/i18n/ru/index';
export { finance } from '@/modules/finance/i18n/ru/index';
export { calendar } from '@/modules/calendar/i18n/ru/calendar';
export { workflows } from '@/modules/workflow/i18n/ru/index';
export { dashboard } from '@/modules/dashboard/i18n/ru/index';
export { projects } from '@/modules/projects/i18n/ru/index';
export { reports } from '@/modules/reports/i18n/ru/index';
export { marketing } from '@/modules/marketing/i18n/ru/marketing';
export { templates } from '@/modules/templates/i18n/ru/index';
export { warehouse } from '@/modules/warehouse/i18n/ru/index';

// Прямые экспорты из модулей для соответствия коду (t("tasks.title"))
export { tasks, task_sheet, confirm, validation, keywords } from '@/modules/tasks/i18n/ru/tasks';

// Экспорт contracts без обёртки - ключи уже имеют префикс contracts.*
import { ru as contractsTranslations } from '@/modules/contracts/i18n/ru/index';
export const contracts = contractsTranslations;

// Экспорт mail модуля
export { mail } from '@/modules/mail/i18n/ru/index';

// Алиас activity для совместимости с ActivityList.tsx
export { activity } from './common';
