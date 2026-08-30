const {
  getAll,
  getById,
  create,
  update,
  remove,
  bulkDelete,
  bulkUpdate,
} = require('../controllers');
const db = require('../../../db');
const { getModuleSettings } = require('../../../utils/moduleSettingsLoader');
const { logAction } = require('../../../utils/auditLogger');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError, sendPaginated } = require('../../../utils/responseHelpers');

jest.mock('../../../db');
jest.mock('../../../utils/moduleSettingsLoader');
jest.mock('../../../utils/auditLogger');
jest.mock('../../../utils/responseHelpers');
jest.mock('../../../utils/errorHandler', () => ({
  asyncHandler: (fn) => fn
}));

describe('Marketing Controllers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      headers: { 'x-user-id': '1', 'user-agent': 'test-agent' },
      ip: '127.0.0.1'
    };
    res = {};
    getModuleSettings.mockResolvedValue({ display: { itemsPerPage: 20 } });
  });

  describe('getAll', () => {
    it('should return paginated campaigns', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // count
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Campaign 1' }] }); // items
      
      await getAll(req, res);
      
      expect(sendPaginated).toHaveBeenCalledWith(res, [{ id: 1, name: 'Campaign 1' }], {
        page: 1,
        limit: 20,
        total: 1
      });
    });

    it('should apply filters and sorting', async () => {
      req.query = { search: 'test', status: 'active', type: 'email', sortField: 'name', sortOrder: 'desc' };
      
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // count
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Campaign 1' }] }); // items
      
      await getAll(req, res);
      
      // Check count query
      expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE mc.deleted_at IS NULL AND (mc.name ILIKE $1 OR mc.description ILIKE $1 OR mc.target_audience ILIKE $1) AND mc.status = $2 AND mc.type = $3'), ['%test%', 'active', 'email']);
      
      // Check main query
      expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY mc.name DESC'), ['%test%', 'active', 'email', 20, 0]);
    });
  });

  describe('getById', () => {
    it('should return 404 if campaign not found', async () => {
      req.params = { id: 1 };
      db.query.mockResolvedValueOnce({ rows: [] });
      
      await getById(req, res);
      
      expect(sendNotFound).toHaveBeenCalledWith(res, 'Campaign not found');
    });

    it('should return campaign with payments', async () => {
      req.params = { id: 1 };
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Campaign 1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, amount: 100 }] });
      
      await getById(req, res);
      
      expect(sendSuccess).toHaveBeenCalledWith(res, {
        id: 1,
        name: 'Campaign 1',
        payments: [{ id: 1, amount: 100 }]
      });
    });
  });

  describe('create', () => {
    it('should return validation error if name is missing', async () => {
      req.body = { type: 'email' };
      await create(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'Name is required');
    });

    it('should return validation error if type is missing', async () => {
      req.body = { name: 'Test' };
      await create(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'Type is required');
    });

    it('should create campaign and log action', async () => {
      req.body = { name: 'Test', type: 'email' };
      const createdCampaign = { id: 1, name: 'Test', type: 'email' };
      db.query.mockResolvedValueOnce({ rows: [createdCampaign] });
      
      await create(req, res);
      
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO marketing_campaigns'), expect.any(Array));
      expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'CREATE',
        entityType: 'marketing_campaign',
        newData: createdCampaign
      }));
      expect(sendCreated).toHaveBeenCalledWith(res, createdCampaign);
    });
  });

  describe('update', () => {
    it('should return 404 if campaign not found', async () => {
      req.params = { id: 1 };
      req.body = { name: 'Test', type: 'email' };
      db.query.mockResolvedValueOnce({ rows: [] });
      
      await update(req, res);
      
      expect(sendNotFound).toHaveBeenCalledWith(res, 'Campaign not found');
    });

    it('should update campaign and log action', async () => {
      req.params = { id: 1 };
      req.body = { name: 'Test', type: 'email' };
      const oldCampaign = { id: 1, name: 'Old' };
      const updatedCampaign = { id: 1, name: 'Test' };
      
      db.query
        .mockResolvedValueOnce({ rows: [oldCampaign] }) // select old
        .mockResolvedValueOnce({ rows: [updatedCampaign] }); // update
      
      await update(req, res);
      
      expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE',
        entityType: 'marketing_campaign',
        oldData: oldCampaign,
        newData: updatedCampaign
      }));
      expect(sendSuccess).toHaveBeenCalledWith(res, updatedCampaign);
    });
  });

  describe('remove', () => {
    it('should return 404 if campaign not found', async () => {
      req.params = { id: 1 };
      db.query.mockResolvedValueOnce({ rows: [] });
      
      await remove(req, res);
      
      expect(sendNotFound).toHaveBeenCalledWith(res, 'Campaign not found');
    });

    it('should delete campaign and log action', async () => {
      req.params = { id: 1 };
      const oldCampaign = { id: 1, name: 'Test' };
      
      db.query
        .mockResolvedValueOnce({ rows: [oldCampaign] }) // select old
        .mockResolvedValueOnce({}); // soft delete
      
      await remove(req, res);
      
      expect(db.query).toHaveBeenNthCalledWith(2, 'UPDATE marketing_campaigns SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [1]);
      expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'DELETE',
        entityType: 'marketing_campaign',
        oldData: oldCampaign
      }));
      expect(sendDeleted).toHaveBeenCalledWith(res);
    });
  });

  describe('bulkDelete', () => {
    it('should return 0 if no ids provided', async () => {
      req.body = { ids: [] };
      await bulkDelete(req, res);
      expect(sendSuccess).toHaveBeenCalledWith(res, { deletedCount: 0 });
    });

    it('should bulk delete campaigns', async () => {
      req.body = { ids: [1, 2] };
      db.query.mockResolvedValueOnce({ rowCount: 2 });
      
      await bulkDelete(req, res);
      
      expect(db.query).toHaveBeenCalledWith('UPDATE marketing_campaigns SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::int[]) RETURNING id', [[1, 2]]);
      expect(sendSuccess).toHaveBeenCalledWith(res, { deletedCount: 2 });
    });
  });

  describe('bulkUpdate', () => {
    it('should return empty if no ids provided', async () => {
      req.body = { ids: [] };
      await bulkUpdate(req, res);
      expect(sendSuccess).toHaveBeenCalledWith(res, []);
    });

    it('should return validation error for invalid field', async () => {
      req.body = { ids: [1], field: 'invalid', value: 'test' };
      await bulkUpdate(req, res);
      expect(sendValidationError).toHaveBeenCalledWith(res, 'Invalid field for bulk update');
    });

    it('should bulk update campaigns', async () => {
      req.body = { ids: [1], field: 'status', value: 'active' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'active', budget: '100.00', actual_cost: '50.00' }] });
      
      await bulkUpdate(req, res);
      
      expect(db.query).toHaveBeenCalledWith('UPDATE marketing_campaigns SET status = $1 WHERE id = ANY($2::int[]) RETURNING *', ['active', [1]]);
      expect(sendSuccess).toHaveBeenCalledWith(res, [{
        id: 1,
        status: 'active',
        budget: 100,
        actualCost: 50,
        name: undefined,
        description: undefined,
        type: undefined,
        startDate: undefined,
        endDate: undefined,
        targetAudience: undefined,
        createdAt: undefined,
        updatedAt: undefined
      }]);
    });
  });
});
