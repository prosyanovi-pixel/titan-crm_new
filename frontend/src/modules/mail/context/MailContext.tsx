/**
 * MailContext.tsx - Refactored Entry Point
 * 
 * После рефакторинга (разделения на отдельные хуки):
 * - Старая логика (708 строк) была разделена на отдельные управляемые хуки
 * - MailContextProvider.tsx теперь содержит основную реализацию (~350 строк)
 * - Отдельные хуки логики в папке logic/
 * 
 * Этот файл экспортирует обратно совместимый API.
 * 
 * ОБРАТНАЯ СОВМЕСТИМОСТЬ: Все компоненты, использующие useMailContext(),
 * будут работать без изменений благодаря MailContextProvider.
 */

export { MailProvider, useMailContext, MailContext } from './MailContextProvider';
