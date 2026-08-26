import { dashboard } from '@/modules/dashboard/i18n/ru/dashboard';
import { modulesTasks } from '@/modules/tasks/i18n/ru/tasks';
import { finance } from '@/modules/finance/i18n/ru/finance';
import { calendar } from '@/modules/calendar/i18n/ru/calendar';
import { contractors } from '@/modules/contractors/i18n/ru/contractors';
import { documents } from '@/modules/documents/i18n/ru/documents';
import { legal } from '@/modules/lawyers/i18n/ru/lawyers';
import { ru as contractsI18n } from '@/modules/contracts/i18n/ru';

import { reports as reportsBuilder } from '@/modules/reports/i18n/ru';

export const modules = {
  dashboard,
  tasks: modulesTasks,
  finance,
  calendar,
  contractors,
  documents,
  lawyers: legal.lawyers,
  contracts: contractsI18n,
  reports: {
    title: 'Отчеты',
    myReports: 'Мои отчёты',
    sharedReports: 'Общие',
    ...reportsBuilder,
  },
};
