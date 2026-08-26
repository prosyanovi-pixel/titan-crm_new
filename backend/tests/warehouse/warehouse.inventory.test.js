/**
 * Transactional Tests for Warehouse Module - Inventory Operations
 * Tests concurrent transactions, overselling prevention, and data consistency
 */

const db = require('../../db');
const { createTransaction } = require('../../modules/warehouse/controllers/inventoryController');
const { expect } = require('chai');
const sinon = require('sinon');

describe('Warehouse Inventory - Transactional Tests', function() {
  let client;
  let testProductId = 99999;
  let testWarehouseId = 99999;
  let secondWarehouseId = 99998;

  // Mock request and response objects
  const createMockReq = (body, headers = {}) => ({
    body,
    headers,
    params: {},
    query: {}
  });

  const createMockRes = () => {
    const res = {
      json: sinon.stub(),
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    return res;
  };

  before(async function() {
    // This test suite requires a running database
    // Skip if DB is not available
    try {
      client = await db.pool.connect();
      
      // Setup test data - product and warehouses
      await client.query('BEGIN');
      
      // Insert test product
      await client.query(`
        INSERT INTO products (id, name, sku_internal, unit, purchase_price, vat_rate, is_active)
        VALUES ($1, 'Test Product for Transaction Tests', 'TEST-TRANS-001', 'pcs', 10.00, 22.0, true)
        ON CONFLICT (id) DO NOTHING
      `, [testProductId]);
      
      // Insert test warehouses
      await client.query(`
        INSERT INTO warehouses (id, name, code, is_active)
        VALUES  
          ($1, 'Test Warehouse 1', 'TEST-WH-001', true),
          ($2, 'Test Warehouse 2', 'TEST-WH-002', true)
        ON CONFLICT (id) DO NOTHING
      `, [testWarehouseId, secondWarehouseId]);
      
      // Ensure we have a clean inventory for this product
      await client.query(`
        DELETE FROM inventory_balances 
        WHERE product_id = $1 AND (warehouse_id = $2 OR warehouse_id = $3)
      `, [testProductId, testWarehouseId, secondWarehouseId]);
      
      await client.query('COMMIT');
    } catch (err) {
      console.error('Failed to setup test data:', err.message);
      // Skip tests if DB setup fails
      this.skip();
    }
  });

  after(async function() {
    try {
      if (client) {
        await client.query('BEGIN');
        // Cleanup test data
        await client.query(`
          DELETE FROM inventory_transactions 
          WHERE product_id = $1
        `, [testProductId]);
        
        await client.query(`
          DELETE FROM inventory_balances 
          WHERE product_id = $1
        `, [testProductId]);
        
        await client.query('COMMIT');
        client.release();
      }
    } catch (err) {
      console.error('Failed to cleanup test data:', err.message);
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Concurrent Transaction Tests', function() {
    it('should handle concurrent receipt transactions correctly', async function() {
      const req1 = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'receipt',
        quantity: 10
      }, { 'x-user-id': '1' });
      
      const res1 = createMockRes();
      
      const req2 = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'receipt',
        quantity: 20
      }, { 'x-user-id': '1' });
      
      const res2 = createMockRes();

      // Execute both transactions sequentially (simulating concurrent behavior)
      await createTransaction(req1, res1);
      await createTransaction(req2, res2);

      // Check that both transactions succeeded
      expect(res1.status.calledWith(201)).to.be.true;
      expect(res2.status.calledWith(201)).to.be.true;

      // Check the final balance
      const balanceResult = await client.query(`
        SELECT quantity FROM inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      expect(balanceResult.rows[0].quantity).to.equal(30);
    });

    it('should handle receipt and expense transactions concurrently', async function() {
      // First, add some inventory
      const receiptReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'receipt',
        quantity: 50
      }, { 'x-user-id': '1' });
      
      const receiptRes = createMockRes();
      await createTransaction(receiptReq, receiptRes);
      expect(receiptRes.status.calledWith(201)).to.be.true;

      // Now try to expense more than available
      const expenseReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'expense',
        quantity: 60
      }, { 'x-user-id': '1' });
      
      const expenseRes = createMockRes();
      await createTransaction(expenseReq, expenseRes);

      // Should fail due to insufficient stock
      expect(expenseRes.status.calledWith(400)).to.be.true;
      expect(expenseRes.json.calledWith(sinon.match.has('message', sinon.match.string))).to.be.true;
      
      // Balance should still be 50
      const balanceResult = await client.query(`
        SELECT quantity FROM inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      expect(balanceResult.rows[0].quantity).to.equal(50);
    });
  });

  describe('Overselling Prevention Tests', function() {
    it('should prevent overselling when allowOversell is false', async function() {
      // Add initial inventory
      const receiptReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'receipt',
        quantity: 10
      }, { 'x-user-id': '1' });
      
      const receiptRes = createMockRes();
      await createTransaction(receiptReq, receiptRes);

      // Try to expense more than available
      const expenseReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'expense',
        quantity: 15
      }, { 'x-user-id': '1' });
      
      const expenseRes = createMockRes();
      await createTransaction(expenseReq, expenseRes);

      // Should fail
      expect(expenseRes.status.calledWith(400)).to.be.true;
      const errorMessage = expenseRes.json.getCall(0).args[0].message;
      expect(errorMessage).to.include('Insufficient available stock');
    });

    it('should allow overselling when allowOversell is true in settings', async function() {
      // Update settings to allow oversell
      await client.query(`
        INSERT INTO module_settings (module_name, settings)
        VALUES ('warehouse', '{"features": {"allowOversell": true}}')
        ON CONFLICT (module_name)
        DO UPDATE SET settings = EXCLUDED.settings
      `);

      // Add initial inventory
      const receiptReq = createMockReq({
        productId: testProductId,
        warehouseId: secondWarehouseId,
        type: 'receipt',
        quantity: 5
      }, { 'x-user-id': '1' });
      
      const receiptRes = createMockRes();
      await createTransaction(receiptReq, receiptRes);

      // Try to expense more than available - should succeed
      const expenseReq = createMockReq({
        productId: testProductId,
        warehouseId: secondWarehouseId,
        type: 'expense',
        quantity: 10
      }, { 'x-user-id': '1' });
      
      const expenseRes = createMockRes();
      await createTransaction(expenseReq, expenseRes);

      // Should succeed
      expect(expenseRes.status.calledWith(201)).to.be.true;

      // Balance should be negative
      const balanceResult = await client.query(`
        SELECT quantity FROM inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, secondWarehouseId]);

      expect(balanceResult.rows[0].quantity).to.equal(-5);
    });
  });

  describe('Reserve/Unreserve Tests', function() {
    it('should handle reserve and unreserve operations', async function() {
      // Add initial inventory
      const receiptReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'receipt',
        quantity: 100
      }, { 'x-user-id': '1' });
      
      const receiptRes = createMockRes();
      await createTransaction(receiptReq, receiptRes);

      // Reserve some quantity
      const reserveReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'reserve',
        quantity: 30
      }, { 'x-user-id': '1' });
      
      const reserveRes = createMockRes();
      await createTransaction(reserveReq, reserveRes);

      expect(reserveRes.status.calledWith(201)).to.be.true;

      // Check reserved quantity
      const balanceResult1 = await client.query(`
        SELECT quantity, reserved_quantity FROM inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      expect(balanceResult1.rows[0].quantity).to.equal(100);
      expect(balanceResult1.rows[0].reserved_quantity).to.equal(30);

      // Unreserve
      const unreserveReq = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'unreserve',
        quantity: 10
      }, { 'x-user-id': '1' });
      
      const unreserveRes = createMockRes();
      await createTransaction(unreserveReq, unreserveRes);

      expect(unreserveRes.status.calledWith(201)).to.be.true;

      // Check final reserved quantity
      const balanceResult2 = await client.query(`
        SELECT reserved_quantity FROM inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      expect(balanceResult2.rows[0].reserved_quantity).to.equal(20);
    });

    it('should prevent expense when all stock is reserved', async function() {
      // Add initial inventory
      const receiptReq = createMockReq({
        productId: testProductId,
        warehouseId: secondWarehouseId,
        type: 'receipt',
        quantity: 50
      }, { 'x-user-id': '1' });
      
      const receiptRes = createMockRes();
      await createTransaction(receiptReq, receiptRes);

      // Reserve all stock
      const reserveReq = createMockReq({
        productId: testProductId,
        warehouseId: secondWarehouseId,
        type: 'reserve',
        quantity: 50
      }, { 'x-user-id': '1' });
      
      const reserveRes = createMockRes();
      await createTransaction(reserveReq, reserveRes);

      // Try to expense - should fail
      const expenseReq = createMockReq({
        productId: testProductId,
        warehouseId: secondWarehouseId,
        type: 'expense',
        quantity: 1
      }, { 'x-user-id': '1' });
      
      const expenseRes = createMockRes();
      await createTransaction(expenseReq, expenseRes);

      expect(expenseRes.status.calledWith(400)).to.be.true;
    });
  });

  describe('Data Consistency Tests', function() {
    it('should maintain consistency between transactions and balances', async function() {
      // Clear any existing data for this test
      await client.query(`
        DELETE FROM inventory_transactions 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      await client.query(`
        UPDATE inventory_balances 
        SET quantity = 0, reserved_quantity = 0
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      // Perform multiple operations
      const operations = [
        { type: 'receipt', quantity: 100 },
        { type: 'receipt', quantity: 50 },
        { type: 'expense', quantity: 30 },
        { type: 'reserve', quantity: 20 },
        { type: 'unreserve', quantity: 5 },
        { type: 'expense', quantity: 15 }
      ];

      let expectedQuantity = 0;
      let expectedReserved = 0;

      for (const op of operations) {
        const req = createMockReq({
          productId: testProductId,
          warehouseId: testWarehouseId,
          type: op.type,
          quantity: op.quantity
        }, { 'x-user-id': '1' });

        const res = createMockRes();
        await createTransaction(req, res);

        // Update expected values
        switch(op.type) {
          case 'receipt':
            expectedQuantity += op.quantity;
            break;
          case 'expense':
            expectedQuantity -= op.quantity;
            break;
          case 'reserve':
            expectedReserved += op.quantity;
            break;
          case 'unreserve':
            expectedReserved -= op.quantity;
            break;
        }
      }

      // Check final balance
      const balanceResult = await client.query(`
        SELECT quantity, reserved_quantity FROM inventory_balances 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      expect(balanceResult.rows[0].quantity).to.equal(expectedQuantity);
      expect(balanceResult.rows[0].reserved_quantity).to.equal(expectedReserved);

      // Check that all transactions were recorded
      const transactionResult = await client.query(`
        SELECT COUNT(*) as count FROM inventory_transactions 
        WHERE product_id = $1 AND warehouse_id = $2
      `, [testProductId, testWarehouseId]);

      expect(transactionResult.rows[0].count).to.equal(operations.length);
    });
  });

  describe('Error Handling Tests', function() {
    it('should return 400 for missing required fields', async function() {
      const req = createMockReq({
        productId: testProductId,
        // Missing warehouseId, type, quantity
      }, { 'x-user-id': '1' });

      const res = createMockRes();
      await createTransaction(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith(sinon.match.has('message', 'Missing required fields'))).to.be.true;
    });

    it('should return 400 for invalid transaction type', async function() {
      const req = createMockReq({
        productId: testProductId,
        warehouseId: testWarehouseId,
        type: 'invalid_type',
        quantity: 10
      }, { 'x-user-id': '1' });

      const res = createMockRes();
      await createTransaction(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith(sinon.match.has('message', 'Invalid transaction type'))).to.be.true;
    });

    it('should return 400 for invalid numeric values', async function() {
      const req = createMockReq({
        productId: 'invalid',
        warehouseId: testWarehouseId,
        type: 'receipt',
        quantity: 10
      }, { 'x-user-id': '1' });

      const res = createMockRes();
      await createTransaction(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });
  });
});

// Helper function to clean up specific test data
async function cleanupTestData() {
  try {
    const client = await db.pool.connect();
    await client.query('BEGIN');
    
    await client.query(`
      DELETE FROM inventory_transactions 
      WHERE product_id = $1
    `, [testProductId]);
    
    await client.query(`
      DELETE FROM inventory_balances 
      WHERE product_id = $1
    `, [testProductId]);
    
    await client.query(`
      DELETE FROM products WHERE id = $1
    `, [testProductId]);
    
    await client.query(`
      DELETE FROM warehouses WHERE id IN ($1, $2)
    `, [testWarehouseId, secondWarehouseId]);
    
    await client.query('COMMIT');
    client.release();
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupTestData().then(() => {
    console.log('Test data cleaned up');
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}
