const {
  getCategories,
  createCategory,
  updateCategory
} = require('../controllers/productsController');
const db = require('../../../db');

jest.mock('../../../db');

describe('Products Controllers (Categories)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getCategories', () => {
    it('should return nested tree of categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Parent', parent_id: null },
        { id: 2, name: 'Child', parent_id: 1 }
      ];
      db.query.mockResolvedValueOnce({ rows: mockCategories });

      await getCategories(req, res);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM product_categories'));
      expect(res.json).toHaveBeenCalledWith([
        {
          id: 1,
          name: 'Parent',
          parent_id: null,
          children: [
            { id: 2, name: 'Child', parent_id: 1, children: [] }
          ]
        }
      ]);
    });
  });

  describe('createCategory', () => {
    it('should return 400 if name missing', async () => {
      req.body = {};
      await createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name is required' });
    });

    it('should create a category', async () => {
      req.body = { name: 'New Cat' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'New Cat' }] });

      await createCategory(req, res);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO product_categories'), expect.any(Array));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'New Cat' });
    });
  });

  describe('updateCategory', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 1;
      req.body = { name: 'Updated' };
      db.query.mockResolvedValueOnce({ rows: [] });

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should update a category', async () => {
      req.params.id = 1;
      req.body = { name: 'Updated' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated' }] });

      await updateCategory(req, res);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE product_categories'), expect.any(Array));
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
    });
  });
});
