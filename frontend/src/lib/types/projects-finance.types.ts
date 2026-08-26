// ============================================================
// ОБЩИЕ ТИПЫ ДЛЯ ИНТЕГРАЦИИ PROJECTS + FINANCE
// ============================================================

// ============================================================
// НАЛОГОВЫЕ НАСТРОЙКИ (TAX SETTINGS)
// ============================================================

export type TaxRegimeCode = "OSN" | "USN_INCOME" | "USN_INCOME_EXPENSES" | "ESKH";

export interface TaxRegime {
  id: number;
  code: TaxRegimeCode;
  name: string;
  description?: string;
  isActive: boolean;
  
  // Типы налогов
  hasVat: boolean;
  hasProfitTax: boolean;
  hasUsnTax: boolean;
  hasInsurance: boolean;
  hasNdfl: boolean;
  
  // Ставки по умолчанию
  defaultVatRate: number;
  defaultProfitTaxRate: number;
  defaultUsnRate: number;
  defaultInsuranceRate: number;
  defaultNdflRate: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaxRegimeDTO {
  code: TaxRegimeCode;
  name: string;
  description?: string;
  hasVat?: boolean;
  hasProfitTax?: boolean;
  hasUsnTax?: boolean;
  hasInsurance?: boolean;
  hasNdfl?: boolean;
  defaultVatRate?: number;
  defaultProfitTaxRate?: number;
  defaultUsnRate?: number;
  defaultInsuranceRate?: number;
  defaultNdflRate?: number;
}

export interface UpdateTaxRegimeDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  hasVat?: boolean;
  hasProfitTax?: boolean;
  hasUsnTax?: boolean;
  hasInsurance?: boolean;
  hasNdfl?: boolean;
  defaultVatRate?: number;
  defaultProfitTaxRate?: number;
  defaultUsnRate?: number;
  defaultInsuranceRate?: number;
  defaultNdflRate?: number;
}

// ============================================================
// СТАВКИ НАЛОГОВ (TAX RATES)
// ============================================================

export type TaxType = "vat" | "profit_tax" | "usn" | "insurance" | "ndfl";

export interface TaxRate {
  id: number;
  taxRegimeId: number;
  taxType: TaxType;
  name: string;
  rate: number; // Процент
  isFixed: boolean;
  fixedAmount?: number;
  minBase?: number;
  maxBase?: number;
  description?: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaxRateDTO {
  taxRegimeId: number;
  taxType: TaxType;
  name: string;
  rate: number;
  isFixed?: boolean;
  fixedAmount?: number;
  minBase?: number;
  maxBase?: number;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateTaxRateDTO {
  name?: string;
  rate?: number;
  isFixed?: boolean;
  fixedAmount?: number;
  minBase?: number;
  maxBase?: number;
  description?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// ============================================================
// МЕТОДЫ РАСПРЕДЕЛЕНИЯ (ALLOCATION METHODS)
// ============================================================

export type AllocationBase = "direct_costs" | "labor_costs" | "revenue" | "headcount" | "square" | "custom";

export interface AllocationMethod {
  id: number;
  code: string;
  name: string;
  description?: string;
  allocationBase: AllocationBase;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAllocationMethodDTO {
  code: string;
  name: string;
  description?: string;
  allocationBase: AllocationBase;
}

export interface UpdateAllocationMethodDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ============================================================
// СТАТЬИ НАКЛАДНЫХ РАСХОДОВ (OVERHEAD ARTICLES)
// ============================================================

export type OverheadArticleType = "general" | "administrative" | "commercial" | "production" | "other";

export interface OverheadArticle {
  id: number;
  parentId?: number;
  code: string;
  name: string;
  description?: string;
  articleType: OverheadArticleType;
  allocationMethodId?: number;
  allocationMethod?: AllocationMethod;
  isDirect: boolean;
  isActive: boolean;
  defaultAmount: number;
  priority: number;
  parent?: OverheadArticle;
  children?: OverheadArticle[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOverheadArticleDTO {
  code: string;
  name: string;
  description?: string;
  articleType?: OverheadArticleType;
  parentId?: number;
  allocationMethodId?: number;
  isDirect?: boolean;
  defaultAmount?: number;
  priority?: number;
}

export interface UpdateOverheadArticleDTO {
  name?: string;
  description?: string;
  articleType?: OverheadArticleType;
  parentId?: number;
  allocationMethodId?: number;
  isDirect?: boolean;
  isActive?: boolean;
  defaultAmount?: number;
  priority?: number;
}

// ============================================================
// НАСТРОЙКИ ПО УМОЛЧАНИЮ (DEFAULTS SETTINGS)
// ============================================================

export type OverheadAllocationFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface FinanceDefaultsSettings {
  id: number;
  defaultTaxRegimeId?: number;
  defaultTaxRegime?: TaxRegime;
  defaultAllocationMethodId?: number;
  defaultAllocationMethod?: AllocationMethod;
  defaultCurrency: string;
  defaultPaymentTermsDays: number;
  autoCalculateVat: boolean;
  autoCalculateTaxes: boolean;
  autoAllocateOverhead: boolean;
  overheadAllocationFrequency: OverheadAllocationFrequency;
  minProfitabilityThreshold: number; // %
  maxBudgetVariance: number; // %
  enableBudgetAlerts: boolean;
  enableOverdueAlerts: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateFinanceDefaultsSettingsDTO {
  defaultTaxRegimeId?: number;
  defaultAllocationMethodId?: number;
  defaultCurrency?: string;
  defaultPaymentTermsDays?: number;
  autoCalculateVat?: boolean;
  autoCalculateTaxes?: boolean;
  autoAllocateOverhead?: boolean;
  overheadAllocationFrequency?: OverheadAllocationFrequency;
  minProfitabilityThreshold?: number;
  maxBudgetVariance?: number;
  enableBudgetAlerts?: boolean;
  enableOverdueAlerts?: boolean;
}

// ============================================================
// РАСЧЁТ НАЛОГОВ (TAX CALCULATION)
// ============================================================

export interface TaxCalculationRequest {
  projectId: number;
  revenue: number;
  expenses: number;
  taxRegimeId: number;
  calculateVat?: boolean;
  calculateProfitTax?: boolean;
  calculateUsn?: boolean;
  calculateInsurance?: boolean;
  calculateNdfl?: boolean;
}

export interface TaxCalculationResult {
  projectId: number;
  revenue: number;
  expenses: number;
  vatBase: number;
  vatAmount: number;
  profitTaxBase: number;
  profitTaxAmount: number;
  usnBase: number;
  usnAmount: number;
  insuranceBase: number;
  insuranceAmount: number;
  ndflBase: number;
  ndflAmount: number;
  totalTaxes: number;
  netProfit: number;
  calculatedAt: string;
}

// ============================================================
// РАСПРЕДЕЛЕНИЕ НАКЛАДНЫХ (OVERHEAD ALLOCATION)
// ============================================================

export interface OverheadAllocationRequest {
  periodStart: string;
  periodEnd: string;
  allocationMethodId?: number;
  projectIds?: number[];
  overheadArticleIds?: number[];
}

export interface OverheadAllocationResult {
  periodStart: string;
  periodEnd: string;
  totalOverhead: number;
  allocations: ProjectOverheadAllocation[];
  allocatedAt: string;
}

export interface ProjectOverheadAllocation {
  projectId: number;
  projectName: string;
  allocationBase: number;
  allocationRatio: number; // Доля (0-1)
  allocatedAmount: number;
  articles: OverheadArticleAllocation[];
}

export interface OverheadArticleAllocation {
  articleId: number;
  articleName: string;
  amount: number;
}

// ============================================================
// P&L ОТЧЁТ (PROFIT AND LOSS)
// ============================================================

export interface ProjectPnLReport {
  projectId: number;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  
  // Выручка
  revenue: number;
  vatAmount: number;
  revenueExcludingVat: number;
  
  // Прямые расходы
  directExpenses: number;
  directExpensesBreakdown: {
    salary: number;      // ФОТ
    materials: number;   // Материалы
    services: number;    // Услуги
    other: number;       // Прочие
  };
  
  // Валовая прибыль
  grossProfit: number;
  grossMargin: number;   // %
  
  // Накладные расходы
  overheadExpenses: number;
  overheadAllocated: number;
  
  // Операционная прибыль
  operatingProfit: number;
  operatingMargin: number; // %
  
  // Налоги
  taxes: number;
  taxesBreakdown: {
    vat: number;
    profitTax: number;
    usn: number;
    insurance: number;
    ndfl: number;
  };
  
  // Чистая прибыль
  netProfit: number;
  netMargin: number;     // %
  
  // Рентабельность
  profitability: number; // %
  
  // WIP (незавершённое производство)
  wipAmount: number;
  
  calculatedAt: string;
}

export interface ProjectPnLFilters {
  projectId?: number;
  periodStart?: string;
  periodEnd?: string;
  includeWip?: boolean;
  groupBy?: "month" | "quarter" | "year";
}

// ============================================================
// АНАЛИТИКА (ANALYTICS)
// ============================================================

export interface ProjectFinanceAnalytics {
  projectId: number;
  projectName: string;
  
  // Бюджет
  budgetTotal: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUsagePercent: number;
  
  // Доходы
  revenuePlanned: number;
  revenueActual: number;
  revenueOverdue: number;
  revenueCollectionRate: number; // %
  
  // Расходы
  expensesPlanned: number;
  expensesActual: number;
  expensesVariance: number; // Отклонение
  
  // Прибыль
  profitPlanned: number;
  profitActual: number;
  profitVariance: number;
  
  // Рентабельность
  profitabilityPlanned: number; // %
  profitabilityActual: number;  // %
  
  // Налоги
  taxesAccrued: number;
  taxesPaid: number;
  taxesOutstanding: number;
  
  // График платежей
  paymentsPlanned: number;
  paymentsPaid: number;
  paymentsOverdue: number;
  
  calculatedAt: string;
}

export interface PortfolioAnalytics {
  totalProjects: number;
  activeProjects: number;
  
  // Бюджет портфеля
  totalBudget: number;
  totalBudgetUsed: number;
  budgetUsagePercent: number;
  
  // Доходы
  totalRevenuePlanned: number;
  totalRevenueActual: number;
  
  // Расходы
  totalExpensesPlanned: number;
  totalExpensesActual: number;
  
  // Прибыль
  totalProfitPlanned: number;
  totalProfitActual: number;
  
  // Средняя рентабельность
  avgProfitability: number; // %
  
  // Просрочки
  overduePaymentsCount: number;
  overduePaymentsAmount: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  
  // Тренды
  profitabilityTrend: "up" | "down" | "stable";
  budgetVarianceTrend: "improving" | "worsening" | "stable";
  
  calculatedAt: string;
}
