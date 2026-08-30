const {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouseController');
const db = require('../../../db');

jest.mock('../../../db');

describe('Warehouse Controllers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getWarehouses', () => {
    it('should return warehouses with tags', async () => {
      const mockResult = [{ id: 1, name: 'Main', tags: ['hq'] }];
      db.query.mockResolvedValueOnce({ rows: mockResult });

      await getWarehouses(req, res);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT w.*'));
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('createWarehouse', () => {
    it('should return 400 if name is missing', async () => {
      await createWarehouse(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Name is required' });
    });

    it('should create warehouse with tags', async () => {
      req.body = { name: 'Main', tags: ['hq'] };
      const created = { id: 1, name: 'Main' };
      
      db.query.mockResolvedValueOnce(); // BEGIN
      db.query.mockResolvedValueOnce({ rows: [created] }); // INSERT warehouse
      db.query.mockResolvedValueOnce(); // INSERT tag
      db.query.mockResolvedValueOnce(); // COMMIT

      await createWarehouse(req, res);

      expect(db.query).toHaveBeenCalledWith('BEGIN');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Main', tags: ['hq'] });
    });
  });

  describe('updateWarehouse', () => {
    it('should update warehouse', async () => {
      req.params.id = 1;
      req.body = { name: 'Main updated', tags: ['new'] };
      const updated = { id: 1, name: 'Main updated' };
      
      db.query.mockResolvedValueOnce(); // BEGIN
      db.query.mockResolvedValueOnce({ rows: [updated] }); // UPDATE warehouse
      db.query.mockResolvedValueOnce(); // DELETE tags
      db.query.mockResolvedValueOnce(); // INSERT tag
      db.query.mockResolvedValueOnce(); // COMMIT

      await updateWarehouse(req, res);

      expect(res.json).toHaveBeenCalledWith({ ...updated, tags: ['new'] });
    });

    it('should return 404 if not found', async () => {
      req.params.id = 1;
      req.body = { name: 'Main updated' };
      
      db.query.mockResolvedValueOnce(); // BEGIN
      db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE warehouse -> []
      db.query.mockResolvedValueOnce(); // ROLLBACK

      await updateWarehouse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete warehouse', async () => {
      req.params.id = 1;
      db.query
        .mockResolvedValueOnce({ rows: [] }) // balances
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // delete

      await deleteWarehouse(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Warehouse deleted' });
    });

    it('should return 404 if not found', async () => {
      req.params.id = 1;
      db.query
        .mockResolvedValueOnce({ rows: [] }) // balances
        .mockResolvedValueOnce({ rows: [] }); // delete

      await deleteWarehouse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
