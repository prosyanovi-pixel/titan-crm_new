/**
 * Unit Tests for Products Controller
 * Tests individual controller functions in isolation
 */

const sinon = require('sinon');
const { expect } = require('chai');
const db = require('../../db');
const productsController = require('../../modules/products/controllers/productsController');

describe('Products Controller - Unit Tests', function() {
  let dbStub;
  let queryStub;

  beforeEach(function() {
    // Create stub for db.query
    queryStub = sinon.stub();
    dbStub = sinon.stub(db, 'query').callsFake(queryStub);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('getCategories', function() {
    it('should return nested category tree', async function() {
      // Mock database response
      const mockCategories = [
        { id: 1, name: 'Electronics', parent_id: null },
        { id: 2, name: 'Computers', parent_id: 1 },
        { id: 3, name: 'Laptops', parent_id: 2 },
        { id: 4, name: 'Clothing', parent_id: null }
      ];

      queryStub.resolves({ rows: mockCategories });

      const req = {};
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.getCategories(req, res);

      // Should return nested tree
      expect(res.json.calledOnce).to.be.true;
      const result = res.json.getCall(0).args[0];
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(2); // Two root categories
      
      // Find Electronics category
      const electronics = result.find(c => c.id === 1);
      expect(electronics).to.exist;
      expect(electronics.children).to.be.an('array');
      expect(electronics.children.length).to.equal(1);
      
      // Find Computers as child of Electronics
      const computers = electronics.children.find(c => c.id === 2);
      expect(computers).to.exist;
      expect(computers.children).to.be.an('array');
      expect(computers.children.length).to.equal(1);
      
      // Find Laptops as child of Computers
      const laptops = computers.children.find(c => c.id === 3);
      expect(laptops).to.exist;
      expect(laptops.id).to.equal(3);
    });

    it('should handle database errors', async function() {
      queryStub.rejects(new Error('Database error'));

      const req = {};
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.getCategories(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('createCategory', function() {
    it('should create a new category with required fields', async function() {
      const mockCategory = { id: 1, name: 'New Category', parent_id: null, description: null, images: '[]', translations: '{}' };
      queryStub.resolves({ rows: [mockCategory] });

      const req = {
        body: {
          name: 'New Category'
        }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.createCategory(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(mockCategory)).to.be.true;
      
      // Check that db.query was called with correct parameters
      expect(queryStub.calledOnce).to.be.true;
      const queryCall = queryStub.getCall(0);
      expect(queryCall.args[0]).to.include('INSERT INTO product_categories');
      expect(queryCall.args[1][0]).to.equal('New Category');
    });

    it('should return 400 if name is not provided', async function() {
      const req = {
        body: {}
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.createCategory(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Name is required' })).to.be.true;
      expect(queryStub.notCalled).to.be.true;
    });

    it('should handle database errors on create', async function() {
      queryStub.rejects(new Error('Database error'));

      const req = {
        body: { name: 'New Category' }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.createCategory(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Internal server error' })).to.be.true;
    });
  });

  describe('updateCategory', function() {
    it('should update existing category', async function() {
      const mockCategory = { id: 1, name: 'Updated Category', parent_id: null, description: 'Updated', images: '[]', translations: '{}' };
      queryStub.resolves({ rows: [mockCategory] });

      const req = {
        params: { id: 1 },
        body: {
          name: 'Updated Category',
          description: 'Updated'
        }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.updateCategory(req, res);

      expect(res.json.calledWith(mockCategory)).to.be.true;
      expect(queryStub.calledOnce).to.be.true;
    });

    it('should return 404 if category not found', async function() {
      queryStub.resolves({ rows: [] });

      const req = {
        params: { id: 999 },
        body: { name: 'Updated Category' }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.updateCategory(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Category not found' })).to.be.true;
    });

    it('should handle database errors on update', async function() {
      queryStub.rejects(new Error('Database error'));

      const req = {
        params: { id: 1 },
        body: { name: 'Updated Category' }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.updateCategory(req, res);

      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('deleteCategory', function() {
    it('should delete existing category', async function() {
      const mockCategory = { id: 1, name: 'Category to delete' };
      queryStub.resolves({ rows: [mockCategory] });

      const req = {
        params: { id: 1 }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.deleteCategory(req, res);

      expect(res.json.calledWith({ message: 'Category deleted' })).to.be.true;
      expect(queryStub.calledOnce).to.be.true;
    });

    it('should return 404 if category not found', async function() {
      queryStub.resolves({ rows: [] });

      const req = {
        params: { id: 999 }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.deleteCategory(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Category not found' })).to.be.true;
    });
  });

  describe('getProducts', function() {
    it('should return filtered and paginated products', async function() {
      const mockProducts = [
        { id: 1, name: 'Product 1', sku_internal: 'SKU001' },
        { id: 2, name: 'Product 2', sku_internal: 'SKU002' }
      ];
      queryStub.resolves({ rows: mockProducts });

      const req = {
        query: {
          page: 1,
          limit: 10,
          search: 'Product'
        }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.getProducts(req, res);

      expect(res.json.calledOnce).to.be.true;
      expect(queryStub.calledOnce).to.be.true;
      
      // Check that the query includes search and pagination
      const queryCall = queryStub.getCall(0);
      expect(queryCall.args[0]).to.include('WHERE');
      expect(queryCall.args[0]).to.include('ILIKE');
      expect(queryCall.args[0]).to.include('LIMIT');
      expect(queryCall.args[0]).to.include('OFFSET');
    });

    it('should handle database errors on get', async function() {
      queryStub.rejects(new Error('Database error'));

      const req = { query: {} };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.getProducts(req, res);

      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('getProductById', function() {
    it('should return product by ID', async function() {
      const mockProduct = { id: 1, name: 'Test Product' };
      queryStub.resolves({ rows: [mockProduct] });

      const req = {
        params: { id: 1 }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.getProductById(req, res);

      expect(res.json.calledWith(mockProduct)).to.be.true;
    });

    it('should return 404 if product not found', async function() {
      queryStub.resolves({ rows: [] });

      const req = {
        params: { id: 999 }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.getProductById(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Product not found' })).to.be.true;
    });
  });

  describe('createProduct', function() {
    it('should create new product with required fields', async function() {
      const mockProduct = { id: 1, name: 'New Product', sku_internal: 'SKU001' };
      queryStub.resolves({ rows: [mockProduct] });

      const req = {
        body: {
          name: 'New Product',
          skuInternal: 'SKU001'
        }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.createProduct(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(mockProduct)).to.be.true;
    });

    it('should return 400 if required fields are missing', async function() {
      const req = {
        body: {} // Missing required fields
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.createProduct(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(queryStub.notCalled).to.be.true;
    });
  });

  describe('updateProduct', function() {
    it('should update existing product', async function() {
      const mockProduct = { id: 1, name: 'Updated Product' };
      queryStub.resolves({ rows: [mockProduct] });

      const req = {
        params: { id: 1 },
        body: {
          name: 'Updated Product'
        }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.updateProduct(req, res);

      expect(res.json.calledWith(mockProduct)).to.be.true;
    });

    it('should return 404 if product not found', async function() {
      queryStub.resolves({ rows: [] });

      const req = {
        params: { id: 999 },
        body: { name: 'Updated Product' }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.updateProduct(req, res);

      expect(res.status.calledWith(404)).to.be.true;
    });
  });

  describe('deleteProduct', function() {
    it('should delete existing product', async function() {
      const mockProduct = { id: 1, name: 'Product to delete' };
      queryStub.resolves({ rows: [mockProduct] });

      const req = {
        params: { id: 1 }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.deleteProduct(req, res);

      expect(res.json.calledWith({ message: 'Product deleted' })).to.be.true;
    });

    it('should return 404 if product not found', async function() {
      queryStub.resolves({ rows: [] });

      const req = {
        params: { id: 999 }
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      await productsController.deleteProduct(req, res);

      expect(res.status.calledWith(404)).to.be.true;
    });
  });

  describe('exportProducts', function() {
    it('should export products as CSV', async function() {
      const mockProducts = [
        { id: 1, name: 'Product 1', sku_internal: 'SKU001' },
        { id: 2, name: 'Product 2', sku_internal: 'SKU002' }
      ];
      queryStub.resolves({ rows: mockProducts });

      const req = {
        query: {}
      };
      const res = {
        setHeader: sinon.stub(),
        attachment: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis()
      };

      await productsController.exportProducts(req, res);

      expect(res.setHeader.called).to.be.true;
      expect(res.attachment.called).to.be.true;
      expect(res.send.called).to.be.true;
    });
  });
});
