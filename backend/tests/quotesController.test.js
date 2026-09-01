const test = require('node:test');
const assert = require('node:assert');
const quotesController = require('../modules/quotes/controllers/quotesController');

// Mock next function
const next = (err) => { throw err; };

test('quotesController', async (t) => {
  await t.test('createQuote inserts quote with status_id and tags', async () => {
    const queries = [];
    // Mock the DB module methods
    const originalDb = require('../db');
    const mockDb = {
      query: async (sql, params) => {
        queries.push({ sql, params });
        if (sql.includes('INSERT INTO quotes')) {
          return { rows: [{ id: 'quote-1' }] };
        }
        return { rows: [] };
      }
    };
    // Replace the real query method temporarily
    const oldQuery = originalDb.query;
    originalDb.query = mockDb.query;

    const req = {
      body: {
        number: 'Q-001',
        statusId: 'sent',
        tags: ['urgent', 'vip']
      }
    };
    
    let resStatus = 200;
    let resJson = null;
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: (data) => { resJson = data; }
    };

    try {
      await quotesController.createQuote(req, res, next);
      
      assert.strictEqual(resStatus, 201);
      assert.strictEqual(resJson.id, 'quote-1');
      
      // Check if statusId was passed to INSERT INTO quotes
      const quoteInsert = queries.find(q => q.sql.includes('INSERT INTO quotes'));
      assert.ok(quoteInsert);
      assert.ok(quoteInsert.params.includes('sent'));
      
      // Check if tags were inserted
      const tagInserts = queries.filter(q => q.sql.includes('INSERT INTO quote_tags'));
      assert.strictEqual(tagInserts.length, 2);
      assert.strictEqual(tagInserts[0].params[1], 'urgent');
      assert.strictEqual(tagInserts[1].params[1], 'vip');
      
    } finally {
      originalDb.query = oldQuery;
    }
  });
  
  await t.test('updateQuote updates status_id and tags', async () => {
    const queries = [];
    const originalDb = require('../db');
    const oldQuery = originalDb.query;
    
    originalDb.query = async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('SELECT status_id')) {
        return { rows: [{ status: 'draft' }] };
      }
      if (sql.includes('UPDATE quotes')) {
        return { rows: [{ id: 'quote-1' }] };
      }
      return { rows: [] };
    };

    const req = {
      params: { id: 'quote-1' },
      body: {
        number: 'Q-001',
        statusId: 'accepted',
        tags: ['completed']
      }
    };
    
    let resJson = null;
    const res = { json: (data) => { resJson = data; }, status: () => res };

    try {
      await quotesController.updateQuote(req, res, next);
      
      assert.strictEqual(resJson.id, 'quote-1');
      
      const quoteUpdate = queries.find(q => q.sql.includes('UPDATE quotes'));
      assert.ok(quoteUpdate);
      assert.ok(quoteUpdate.params.includes('accepted'));
      
      const tagDelete = queries.find(q => q.sql.includes('DELETE FROM quote_tags'));
      assert.ok(tagDelete);
      
      const tagInsert = queries.find(q => q.sql.includes('INSERT INTO quote_tags'));
      assert.ok(tagInsert);
      assert.strictEqual(tagInsert.params[1], 'completed');
      
    } finally {
      originalDb.query = oldQuery;
    }
  });
  
  await t.test('bulkUpdateQuotes updates status_id', async () => {
    const queries = [];
    const originalDb = require('../db');
    const oldQuery = originalDb.query;
    
    originalDb.query = async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('UPDATE quotes SET status_id')) {
        return { rows: [{ id: 'quote-1' }, { id: 'quote-2' }] };
      }
      return { rows: [] };
    };

    const req = {
      body: {
        ids: ['quote-1', 'quote-2'],
        patch: { statusId: 'rejected' }
      }
    };
    
    let resJson = null;
    const res = { json: (data) => { resJson = data; }, status: () => res };

    try {
      await quotesController.bulkUpdateQuotes(req, res, next);
      
      assert.strictEqual(resJson.updated, 2);
      
      const quoteUpdate = queries.find(q => q.sql.includes('UPDATE quotes SET status_id'));
      assert.ok(quoteUpdate);
      assert.strictEqual(quoteUpdate.params[0], 'rejected');
      
    } finally {
      originalDb.query = oldQuery;
    }
  });
});
