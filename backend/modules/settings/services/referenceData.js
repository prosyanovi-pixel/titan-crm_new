const db = require('../../../db');

const MODULE_TABLE = {
  contractors: 'contractor_status',
  projects: 'project_status',
  tasks: 'task_status',
  lawyers: 'lawyer_status',
  cases: 'case_status',
  finance: 'finance_invoice_status',
  calendar: 'calendar_status',
  reports: 'report_status',
  marketing: 'marketing_status',
};

function toStatus(row, module) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color || '#6B7280',
    order: row.displayorder,
    module: module || row.module || undefined,
    variant: row.variant || 'solid',
    size: row.size || 'md',
    shape: row.shape || 'rounded',
    icon: row.icon || undefined,
    isGlass: !!row.isGlass,
    isGradient: !!row.isGradient,
    secondaryColor: row.secondaryColor || undefined,
    isAnimated: !!row.isAnimated,
  };
}

function toTag(row) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color || '#3B82F6',
    module: row.module || undefined,
    category: row.variant || undefined,
    variant: row.variant || 'solid',
    size: row.size || 'md',
    shape: row.shape || 'rounded',
    icon: row.icon || undefined,
    isGlass: !!row.isGlass,
    isGradient: !!row.isGradient,
    secondaryColor: row.secondaryColor || undefined,
    isAnimated: !!row.isAnimated,
  };
}

function toPriority(row) {
  const defaultColors = { High: '#EF4444', Medium: '#F59E0B', Low: '#3B82F6' };
  const levelMap = { High: 3, Medium: 2, Low: 1 };

  return {
    id: String(row.id),
    name: row.name,
    color: row.color || defaultColors[row.id] || '#6B7280',
    level: levelMap[row.id] ?? row.level ?? 1,
    order: row.displayorder,
    module: row.module || undefined,
    variant: row.variant || 'solid',
    size: row.size || 'md',
    shape: row.shape || 'rounded',
    icon: row.icon || undefined,
    isGlass: !!row.isGlass,
    isGradient: !!row.isGradient,
    secondaryColor: row.secondaryColor || undefined,
    isAnimated: !!row.isAnimated,
  };
}

function toProjectStage(row) {
  return {
    id: String(row.id),
    name: row.name,
    displayorder: row.displayorder,
  };
}

function toRelationshipType(row) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color || '#3B82F6',
    module: row.module || 'contractors',
    order: row.displayorder,
    showAsTab: row.show_as_tab ?? row.showAsTab ?? undefined,
    isActive: row.is_active ?? row.isActive ?? undefined,
  };
}

function toContractorType(row) {
  return {
    id: String(row.id),
    name: row.name,
  };
}

async function fetchStatuses(module) {
  if (module) {
    const table = MODULE_TABLE[module];
    if (!table) return [];

    try {
      const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY displayorder ASC, id ASC`);
      return rows.map((row) => toStatus(row, module));
    } catch {
      return [];
    }
  }

  const all = [];
  for (const [moduleName, table] of Object.entries(MODULE_TABLE)) {
    try {
      const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY displayorder ASC, id ASC`);
      rows.forEach((row) => all.push(toStatus(row, moduleName)));
    } catch {
      continue;
    }
  }
  return all;
}

async function fetchTags(module) {
  let query = 'SELECT * FROM defined_tags';
  const params = [];

  if (module) {
    query += ' WHERE module = $1';
    params.push(module);
  }

  query += ' ORDER BY displayorder ASC, id ASC';
  const { rows } = await db.query(query, params);
  return rows.map(toTag);
}

async function fetchPriorities(module) {
  let queryText = 'SELECT * FROM priority';
  const params = [];

  if (module) {
    queryText += ' WHERE module = $1';
    params.push(module);
  }

  queryText += ' ORDER BY displayorder ASC';
  const { rows } = await db.query(queryText, params);
  return rows.map(toPriority);
}

async function fetchRelationshipTypes() {
  const { rows } = await db.query('SELECT * FROM relationship_type ORDER BY displayorder, id');
  return rows.map(toRelationshipType);
}

async function fetchContractorTypes() {
  const { rows } = await db.query('SELECT * FROM contractor_type ORDER BY id');
  return rows.map(toContractorType);
}

async function fetchProjectStages() {
  const { rows } = await db.query('SELECT * FROM project_stage ORDER BY displayorder ASC, id ASC');
  return rows.map(toProjectStage);
}

async function fetchTaxRegimes() {
  const { rows } = await db.query('SELECT id, code, name FROM finance_tax_regimes WHERE is_active = TRUE ORDER BY id');
  return rows.map((row) => ({
    id: Number(row.id),
    code: row.code,
    name: row.name,
  }));
}

async function fetchMarketingTypes() {
  try {
    const { rows } = await db.query('SELECT * FROM marketing_type ORDER BY displayorder');
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      color: row.color || '#3B82F6',
      order: row.displayorder,
      variant: row.variant || 'solid',
      size: row.size || 'md',
      shape: row.shape || 'rounded',
      icon: row.icon || undefined,
      isGlass: !!row.isGlass,
      isGradient: !!row.isGradient,
      secondaryColor: row.secondaryColor || undefined,
      isAnimated: !!row.isAnimated,
    }));
  } catch {
    return [];
  }
}

async function getAllReferenceData() {
  const [statuses, tags, priorities, projectStages, taxRegimes] = await Promise.all([
    fetchStatuses(),
    fetchTags(),
    fetchPriorities(),
    fetchProjectStages(),
    fetchTaxRegimes(),
  ]);

  const [relationshipTypes, contractorTypes, marketingTypes] = await Promise.all([
    fetchRelationshipTypes(),
    fetchContractorTypes(),
    fetchMarketingTypes(),
  ]);

  // marketing statuses are included in statuses via MODULE_TABLE mapping
  const marketingStatuses = statuses.filter((s) => s.module === 'marketing');

  return {
    statuses,
    tags,
    priorities,
    projectStages,
    relationshipTypes,
    contractorTypes,
    taxRegimes,
    marketingStatuses,
    marketingTypes,
  };
}

module.exports = {
  MODULE_TABLE,
  toStatus,
  toTag,
  toPriority,
  fetchStatuses,
  fetchTags,
  fetchPriorities,
  fetchProjectStages,
  fetchTaxRegimes,
  fetchRelationshipTypes,
  fetchContractorTypes,
  getAllReferenceData,
};
