import { useSettings } from './use-settings';

/**
 * Результат хука useCompanyVat
 */
export interface CompanyVatInfo {
  /** Применяется ли НДС согласно налоговому режиму компании */
  hasVat: boolean;
  /** Ставка НДС в процентах (0 если нет НДС) */
  vatRate: number;
  /** Строковое представление ставки для отображения, напр. "22%" */
  vatRateLabel: string;
  /** Код налогового режима компании, если задан */
  taxRegimeCode: string | null;
  /** Название налогового режима компании, если задан */
  taxRegimeName: string | null;
}

/**
 * Хук для получения информации о НДС компании.
 *
 * Определяет наличие НДС и ставку на основе налогового режима,
 * выбранного в профиле компании (Настройки → Реквизиты).
 *
 * Использует семантическое поле `has_vat` из таблицы `finance_tax_regimes`
 * вместо хрупкой проверки строки кода режима.
 *
 * @example
 * const { hasVat, vatRate } = useCompanyVat();
 * // vatRate === 22 при режиме ОСН, 0 при УСН
 *
 * @remarks
 * - НДС может быть разным: 0%, 5%, 7%, 10%, 20%, 22% и т.д.
 * - При отсутствии профиля или режима — hasVat = false, vatRate = 0.
 * - Ставка контрагента носит справочный характер и не переопределяет эту ставку
 *   в выставляемых документах (КП, счета).
 */
export function useCompanyVat(): CompanyVatInfo {
  const { companyProfile, taxRegimes } = useSettings();

  const regimeId = companyProfile?.taxRegimeId ?? null;

  if (!regimeId) {
    return {
      hasVat: false,
      vatRate: 0,
      vatRateLabel: '0%',
      taxRegimeCode: null,
      taxRegimeName: null,
    };
  }

  const regime = taxRegimes.find((r) => String(r.id) === String(regimeId));

  if (!regime) {
    return {
      hasVat: false,
      vatRate: 0,
      vatRateLabel: '0%',
      taxRegimeCode: null,
      taxRegimeName: null,
    };
  }

  // Используем семантическое поле БД (requiresNds) ИЛИ наличие ставки
  const defaultVatRateNum = Number(regime.defaultVatRate) || 0;
  const hasVat = regime.hasVat === true || regime.requiresNds === true || defaultVatRateNum > 0;
  const vatRate = hasVat ? (defaultVatRateNum > 0 ? defaultVatRateNum : 22) : 0;

  return {
    hasVat,
    vatRate,
    vatRateLabel: `${vatRate}%`,
    taxRegimeCode: regime.code ?? null,
    taxRegimeName: regime.name ?? null,
  };
}
