const db = require('../../../db');

class SearchService {
  async search(query) {
    if (!query || typeof query !== 'string') {
      return { contractors: [], projects: [], tasks: [] };
    }

    const searchTerm = `%${query}%`;
    const searchNumber = isNaN(Number(query)) ? null : Number(query);

    const contractorsQuery = `
      SELECT id, name, type, inn
      FROM contractors
      WHERE name ILIKE $1 OR inn ILIKE $1
      ORDER BY id DESC
      LIMIT 10
    `;

    const projectsQuery = `
      SELECT id, name, status
      FROM projects
      WHERE name ILIKE $1 OR id = $2
      ORDER BY id DESC
      LIMIT 10
    `;

    const tasksQuery = `
      SELECT id, title as name, status, project as project_id
      FROM tasks
      WHERE title ILIKE $1 OR id = $2
      ORDER BY id DESC
      LIMIT 10
    `;

    const documentsQuery = `
      SELECT id, name
      FROM documents
      WHERE name ILIKE $1
      ORDER BY date DESC
      LIMIT 10
    `;

    const legalCasesQuery = `
      SELECT id, title as name, case_number
      FROM legal_cases
      WHERE title ILIKE $1 OR case_number ILIKE $1
      ORDER BY id DESC
      LIMIT 10
    `;

    const contractsQuery = `
      SELECT id, title as name, contract_number
      FROM contracts
      WHERE title ILIKE $1 OR contract_number ILIKE $1
      ORDER BY id DESC
      LIMIT 10
    `;

    const productsQuery = `
      SELECT id, name, sku
      FROM products
      WHERE name ILIKE $1 OR sku ILIKE $1
      ORDER BY id DESC
      LIMIT 10
    `;

    const mailQuery = `
      SELECT id, subject as name, from_address
      FROM mail_messages
      WHERE subject ILIKE $1 OR from_address ILIKE $1
      ORDER BY received_date DESC
      LIMIT 10
    `;

    try {
      // Execute main queries
      const [contractorsRes, projectsRes, tasksRes] = await Promise.all([
        db.query(contractorsQuery, [searchTerm]),
        db.query(projectsQuery, [searchTerm, searchNumber]),
        db.query(tasksQuery, [searchTerm, searchNumber])
      ]);

      // Execute secondary queries with catch to avoid failing the whole search if a table is missing
      const [documentsRes, legalCasesRes, contractsRes, productsRes, mailRes] = await Promise.all([
        db.query(documentsQuery, [searchTerm]).catch(() => ({ rows: [] })),
        db.query(legalCasesQuery, [searchTerm]).catch(() => ({ rows: [] })),
        db.query(contractsQuery, [searchTerm]).catch(() => ({ rows: [] })),
        db.query(productsQuery, [searchTerm]).catch(() => ({ rows: [] })),
        db.query(mailQuery, [searchTerm]).catch(() => ({ rows: [] }))
      ]);

      return {
        contractors: contractorsRes.rows.map(row => ({ ...row, entityType: 'contractor' })),
        projects: projectsRes.rows.map(row => ({ ...row, entityType: 'project' })),
        tasks: tasksRes.rows.map(row => ({ ...row, entityType: 'task' })),
        documents: documentsRes.rows.map(row => ({ ...row, entityType: 'document' })),
        legalCases: legalCasesRes.rows.map(row => ({ ...row, entityType: 'legal_case' })),
        contracts: contractsRes.rows.map(row => ({ ...row, entityType: 'contract' })),
        products: productsRes.rows.map(row => ({ ...row, entityType: 'product' })),
        mail: mailRes.rows.map(row => ({ ...row, entityType: 'mail' }))
      };
    } catch (error) {
      console.error('[SearchService] Error executing search queries:', error);
      throw new Error('Database search failed');
    }
  }
}

module.exports = new SearchService();
