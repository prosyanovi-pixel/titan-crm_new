/**
 * Общие преобразования и даты для finance settings
 */

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

function transformTaxRegime(regime) {
  if (!regime) return regime;
  return {
    ...regime,
    isActive: Boolean(regime.isActive || regime.is_active),
    hasVat: Boolean(regime.hasVat || regime.has_vat),
    hasProfitTax: Boolean(regime.hasProfitTax || regime.has_profit_tax),
    hasUsnTax: Boolean(regime.hasUsnTax || regime.has_usn_tax),
    hasInsurance: Boolean(regime.hasInsurance || regime.has_insurance),
    hasNdfl: Boolean(regime.hasNdfl || regime.has_ndfl),
    defaultVatRate: parseFloat(regime.defaultVatRate || regime.default_vat_rate) || 0,
    defaultProfitTaxRate: parseFloat(regime.defaultProfitTaxRate || regime.default_profit_tax_rate) || 0,
    defaultUsnRate: parseFloat(regime.defaultUsnRate || regime.default_usn_rate) || 0,
    defaultInsuranceRate: parseFloat(regime.defaultInsuranceRate || regime.default_insurance_rate) || 0,
    defaultNdflRate: parseFloat(regime.defaultNdflRate || regime.default_ndfl_rate) || 0,
    appliesToLegalForms: Array.isArray(regime.appliesToLegalForms) ? regime.appliesToLegalForms : (regime.applies_to_legal_forms || []),
    validFrom: regime.validFrom || regime.valid_from || '2024-01-01',
    validTo: regime.validTo || regime.valid_to || '2099-12-31',
    requiresNds: Boolean(regime.requiresNds || regime.requires_nds || false),
    maxIncomeLimit: parseFloat(regime.maxIncomeLimit || regime.max_income_limit) || null,
    maxEmployeesLimit: parseInt(regime.maxEmployeesLimit || regime.max_employees_limit, 10) || null,
    requiresOnlineCashier: Boolean(regime.requiresOnlineCashier || regime.requires_online_cashier || false),
  };
}

function transformTaxRate(rate) {
  if (!rate) return rate;
  return {
    ...rate,
    taxRegimeId: rate.taxRegimeId || rate.tax_regime_id,
    taxType: rate.taxType || rate.tax_type,
    isFixed: Boolean(rate.isFixed || rate.is_fixed),
    fixedAmount: parseFloat(rate.fixedAmount || rate.fixed_amount) || 0,
    minBase: parseFloat(rate.minBase || rate.min_base) || 0,
    maxBase: parseFloat(rate.maxBase || rate.max_base) || 0,
    isActive: Boolean(rate.isActive || rate.is_active),
    rate: parseFloat(rate.rate) || 0,
    effectiveFrom: rate.effectiveFrom || rate.effective_from,
    effectiveTo: rate.effectiveTo || rate.effective_to,
    rateValue: parseFloat(rate.rateValue || rate.rate_value) || 0,
    appliesFrom: rate.appliesFrom || rate.applies_from || rate.effectiveFrom || rate.effective_from,
    isDefault: Boolean(rate.isDefault || rate.is_default || false),
    legalForms: Array.isArray(rate.legalForms) ? rate.legalForms : (rate.legal_forms || []),
  };
}

function transformAllocationMethod(method) {
  if (!method) return method;
  return {
    ...method,
    allocationBase: method.allocation_base,
    isActive: method.is_active,
  };
}

function transformOverheadArticle(article) {
  if (!article) return article;
  return {
    ...article,
    parentId: article.parent_id,
    articleType: article.article_type,
    allocationMethodId: article.allocation_method_id,
    isDirect: article.is_direct,
    isActive: article.is_active,
    defaultAmount: article.default_amount,
  };
}

function transformDefaultsSettings(settings) {
  if (!settings) return settings;
  return {
    ...settings,
    defaultTaxRegimeId: settings.defaultTaxRegimeId || settings.default_tax_regime_id,
    defaultAllocationMethodId: settings.defaultAllocationMethodId || settings.default_allocation_method_id,
    defaultCurrency: settings.defaultCurrency || settings.default_currency,
    defaultPaymentTermsDays: settings.defaultPaymentTermsDays || settings.default_payment_terms_days,
    autoCalculateVat: Boolean(settings.autoCalculateVat || settings.auto_calculate_vat),
    autoCalculateTaxes: Boolean(settings.autoCalculateTaxes || settings.auto_calculate_taxes),
    autoAllocateOverhead: Boolean(settings.autoAllocateOverhead || settings.auto_allocate_overhead),
    overheadAllocationFrequency: settings.overheadAllocationFrequency || settings.overhead_allocation_frequency,
    minProfitabilityThreshold: parseFloat(settings.minProfitabilityThreshold || settings.min_profitability_threshold) || 0,
    maxBudgetVariance: parseFloat(settings.maxBudgetVariance || settings.max_budget_variance) || 0,
    enableBudgetAlerts: Boolean(settings.enableBudgetAlerts || settings.enable_budget_alerts),
    enableOverdueAlerts: Boolean(settings.enableOverdueAlerts || settings.enable_overdue_alerts),
  };
}

module.exports = {
  parseDate,
  transformTaxRegime,
  transformTaxRate,
  transformAllocationMethod,
  transformOverheadArticle,
  transformDefaultsSettings,
};
