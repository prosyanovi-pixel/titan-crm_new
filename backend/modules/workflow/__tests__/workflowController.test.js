const workflowController = require('../workflowController');
const db = require('../../../db');

jest.mock('../../../db');

describe('Workflow Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('getWorkflows', () => {
    it('should return workflows', async () => {
      const mockResult = [{ id: 1, name: 'Workflow' }];
      db.query.mockResolvedValueOnce({ rows: mockResult });

      await workflowController.getWorkflows(req, res, next);

      expect(res.json).toHaveBeenCalledWith([{
        id: 1,
        name: 'Workflow',
        steps: [],
        trigger_config: {},
        trigger_type: undefined
      }]);
    });
  });

  describe('getWorkflowById', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 1;
      db.query.mockResolvedValueOnce({ rows: [] });

      await workflowController.getWorkflowById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Workflow not found' });
    });

    it('should return workflow', async () => {
      req.params.id = 1;
      const mockWorkflow = { id: 1, name: 'Workflow' };
      db.query.mockResolvedValueOnce({ rows: [mockWorkflow] });
      db.query.mockResolvedValueOnce({ rows: [] }); // steps

      await workflowController.getWorkflowById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        ...mockWorkflow,
        steps: []
      });
    });
  });
});
