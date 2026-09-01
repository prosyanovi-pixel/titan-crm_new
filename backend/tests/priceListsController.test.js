const test = require('node:test');
const assert = require('node:assert');
const priceListsController = require('../modules/price_lists/controllers/priceListsController');

const next = (err) => { throw err; };

test('priceListsController', async (t) => {
  await t.test('createPriceList inserts price_list with status_id and tags', async () => {
    const queries = [];
    const originalDb = require('../db');
    const oldQuery = originalDb.query;
    
    originalDb.query = async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('INSERT INTO price_lists')) {
        return { rows: [{ id: 'pl-1' }] };
      }
      return { rows: [] };
    };

    const req = {
      body: {
        name: 'Standard PL',
        statusId: 'active',
        tags: ['default', 'retail']
      }
    };
    
    let resStatus = 200;
    let resJson = null;
    const res = {
      status: (code) => { resStatus = code; return res; },
      json: (data) => { resJson = data; }
    };

    try {
      await priceListsController.createPriceList(req, res, next);
      
      assert.strictEqual(resStatus, 201);
      assert.strictEqual(resJson.id, 'pl-1');
      
      const plInsert = queries.find(q => q.sql.includes('INSERT INTO price_lists'));
      assert.ok(plInsert);
      assert.ok(plInsert.params.includes('active'));
      
      const tagInserts = queries.filter(q => q.sql.includes('INSERT INTO price_list_tags'));
      assert.strictEqual(tagInserts.length, 2);
      assert.strictEqual(tagInserts[0].params[1], 'default');
      assert.strictEqual(tagInserts[1].params[1], 'retail');
      
    } finally {
      originalDb.query = oldQuery;
    }
  });
  
  await t.test('updatePriceList updates status_id and tags', async () => {
    const queries = [];
    const originalDb = require('../db');
    const oldQuery = originalDb.query;
    
    originalDb.query = async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('UPDATE price_lists')) {
        return { rows: [{ id: 'pl-1' }] };
      }
      return { rows: [] };
    };

    const req = {
      params: { id: 'pl-1' },
      body: {
        name: 'Updated PL',
        statusId: 'archived',
        tags: ['old']
      }
    };
    
    let resJson = null;
    const res = { json: (data) => { resJson = data; }, status: () => res };

    try {
      await priceListsController.updatePriceList(req, res, next);
      
      assert.strictEqual(resJson.id, 'pl-1');
      
      const plUpdate = queries.find(q => q.sql.includes('UPDATE price_lists'));
      assert.ok(plUpdate);
      assert.ok(plUpdate.params.includes('archived'));
      
      const tagDelete = queries.find(q => q.sql.includes('DELETE FROM price_list_tags'));
      assert.ok(tagDelete);
      
      const tagInsert = queries.find(q => q.sql.includes('INSERT INTO price_list_tags'));
      assert.ok(tagInsert);
      assert.strictEqual(tagInsert.params[1], 'old');
      
    } finally {
      originalDb.query = oldQuery;
    }
  });
  
  await t.test('bulkUpdatePriceLists updates status_id', async () => {
    const queries = [];
    const originalDb = require('../db');
    const oldQuery = originalDb.query;
    
    originalDb.query = async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('UPDATE price_lists SET')) {
        return { rows: [{ id: 'pl-1' }] };
      }
      return { rows: [] };
    };

    const req = {
      body: {
        ids: ['pl-1'],
        patch: { statusId: 'active' }
      }
    };
    
    let resJson = null;
    const res = { json: (data) => { resJson = data; }, status: () => res };

    try {
      await priceListsController.bulkUpdatePriceLists(req, res, next);
      
      assert.strictEqual(resJson.updated, 1);
      
      const plUpdate = queries.find(q => q.sql.includes('UPDATE price_lists SET'));
      assert.ok(plUpdate);
      assert.strictEqual(plUpdate.params[2], 'active');
      
    } finally {
      originalDb.query = oldQuery;
    }
  });
});
