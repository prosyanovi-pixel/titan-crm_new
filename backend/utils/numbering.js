const db = require('../db');

const DEFAULT_TEMPLATES = {
  tasks: 'TSK-{n}',
  projects: 'PRJ-{n}',
  contractors: 'CTR-{n}',
  documents: 'DOC-{n}',
  lawyers: 'LAW-{n}',
  cases: 'CASE-{n}/{yy}',
  calendar: 'EVT-{n}',
  mail: 'MAIL-{n}',
  contracts: 'CNT-{n}/{yyyy}',
  finance_invoices: 'INV-{yyyy}-{n}',
};

const getDefaultTemplate = (moduleId) => {
  return DEFAULT_TEMPLATES[moduleId] || `${String(moduleId || 'MOD').toUpperCase()}-{n}`;
};

const normalizeTemplate = (template, fallbackTemplate) => {
  const base = String(template || fallbackTemplate || '').trim() || fallbackTemplate;

  if (/\{n\d*\}/.test(base)) {
    return base;
  }

  return `${base}-{n}`;
};

const padNumber = (num, width) => {
  return String(num).padStart(width, '0');
};

const formatByTemplate = (template, nextNumber) => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return template
    .replace(/\{yyyy\}/g, yyyy)
    .replace(/\{yy\}/g, yy)
    .replace(/\{mm\}/g, mm)
    .replace(/\{dd\}/g, dd)
    .replace(/\{n(\d*)\}/g, (_, widthRaw) => {
      const width = widthRaw ? Number(widthRaw) : 0;
      return width > 0 ? padNumber(nextNumber, width) : String(nextNumber);
    });
};

const parseSetting = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

async function generateNextNumber(moduleId) {
  const key = `numbering_${moduleId}`;
  const defaultTemplate = getDefaultTemplate(moduleId);
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT setting_key, value FROM system_settings WHERE setting_key = $1 FOR UPDATE',
      [key]
    );

    const currentValue = parseSetting(existing.rows[0]?.value) || {};
    const next = Number.isFinite(Number(currentValue.next)) && Number(currentValue.next) > 0
      ? Number(currentValue.next)
      : 1;
    const template = normalizeTemplate(currentValue.template, defaultTemplate);
    const identifier = formatByTemplate(template, next);

    const nextState = {
      template,
      next: next + 1,
    };

    await client.query(
      `INSERT INTO system_settings (setting_key, value, updated_at)
       VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(nextState)]
    );

    await client.query('COMMIT');
    return identifier;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  generateNextNumber,
  getDefaultTemplate,
  formatByTemplate,
};
