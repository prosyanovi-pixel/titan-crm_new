const fs = require('fs');
let code = fs.readFileSync('backend/services/contractService.js', 'utf8');

code = code.replace(
  `    let query = \`
      SELECT c.*, ctr.name as contractor_name 
      FROM contracts c
      LEFT JOIN contractors ctr ON c.contractor_id = ctr.id
      WHERE 1=1
    \`;`,
  `    let query = \`
      SELECT c.*, ctr.name as contractor_name,
      COALESCE(array_agg(ct.tag_id) FILTER (WHERE ct.tag_id IS NOT NULL), ARRAY[]::varchar[]) as tags
      FROM contracts c
      LEFT JOIN contractors ctr ON c.contractor_id = ctr.id
      LEFT JOIN contract_tags ct ON c.id = ct.contract_id
      WHERE 1=1
    \`;`
);

code = code.replace(
  `    // Add sorting and pagination
    query += \` ORDER BY c.\${sortBy} \${sortOrder} LIMIT \$\${paramIndex} OFFSET \$\${paramIndex + 1}\`;`,
  `    // Group by
    query += \` GROUP BY c.id, ctr.name\`;

    // Add sorting and pagination
    query += \` ORDER BY c.\${sortBy} \${sortOrder} LIMIT \$\${paramIndex} OFFSET \$\${paramIndex + 1}\`;`
);

code = code.replace(
  `    const cases = await db.query(
      'SELECT cc.id, lc.id as case_id, lc.title as name, cc.created_at FROM contract_cases cc JOIN legal_cases lc ON cc.case_id = lc.id WHERE cc.contract_id = $1',
      [contractId]
    );

    return {
      ...contract,
      versions: versions.rows,
      approvals: approvals.rows,
      files: files.rows,
      cases: cases.rows
    };`,
  `    const cases = await db.query(
      'SELECT cc.id, lc.id as case_id, lc.title as name, cc.created_at FROM contract_cases cc JOIN legal_cases lc ON cc.case_id = lc.id WHERE cc.contract_id = $1',
      [contractId]
    );

    // Get tags
    const tags = await db.query(
      'SELECT tag_id FROM contract_tags WHERE contract_id = $1',
      [contractId]
    );

    return {
      ...contract,
      versions: versions.rows,
      approvals: approvals.rows,
      files: files.rows,
      cases: cases.rows,
      tags: tags.rows.map(t => t.tag_id)
    };`
);

code = code.replace(
  `    // Create initial version if created from template
    if (templateId) {`,
  `    // Save tags
    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      const tagQueries = data.tags.map(tagId =>
        db.query('INSERT INTO contract_tags (contract_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [contract.id, tagId])
      );
      await Promise.all(tagQueries);
    }

    // Create initial version if created from template
    if (templateId) {`
);

code = code.replace(
  `    const result = await db.query(
      \`UPDATE contracts
       SET name = COALESCE($1, name),`,
  `    // Update tags
    if (data.tags && Array.isArray(data.tags)) {
      await db.query('DELETE FROM contract_tags WHERE contract_id = $1', [contractId]);
      if (data.tags.length > 0) {
        const tagQueries = data.tags.map(tagId =>
          db.query('INSERT INTO contract_tags (contract_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [contractId, tagId])
        );
        await Promise.all(tagQueries);
      }
    }

    const result = await db.query(
      \`UPDATE contracts
       SET name = COALESCE($1, name),`
);

fs.writeFileSync('backend/services/contractService.js', code);
console.log('patched');
