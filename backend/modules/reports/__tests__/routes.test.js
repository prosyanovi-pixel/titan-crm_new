const request = require('supertest');
const express = require('express');
jest.mock('../../../middleware/checkPermission', () => {
  return jest.fn().mockImplementation(() => (req, res, next) => next());
});
jest.mock('../services/previewService');

const router = require('../routes');
const checkPermission = require('../../../middleware/checkPermission');
const { getReportPreview } = require('../services/previewService');

// Mock subrouters
jest.mock('../controllers/finance', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'finance' }));
  return router;
});
jest.mock('../controllers/projects', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'projects' }));
  return router;
});
jest.mock('../controllers/contractors', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'contractors' }));
  return router;
});
jest.mock('../controllers/lawyers', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'lawyers' }));
  return router;
});
jest.mock('../controllers/tasks', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'tasks' }));
  return router;
});
jest.mock('../controllers/configs', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'configs' }));
  return router;
});
jest.mock('../controllers/export', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ sub: 'export' }));
  return router;
});

const app = express();
app.use(express.json());
app.use('/reports', router);

describe('Reports Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkPermission.mockImplementation(() => (req, res, next) => next());
  });

  describe('GET /preview', () => {
    it('should return 400 if reportType is missing', async () => {
      const res = await request(app).get('/reports/preview');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'reportType is required' });
    });

    it('should return preview data', async () => {
      const mockData = { data: [] };
      getReportPreview.mockResolvedValueOnce(mockData);

      const res = await request(app).get('/reports/preview?reportType=finance');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockData);
    });
  });

  describe('Subrouters', () => {
    it('should route /finance', async () => {
      const res = await request(app).get('/reports/finance');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'finance' });
    });

    it('should route /projects', async () => {
      const res = await request(app).get('/reports/projects');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'projects' });
    });

    it('should route /contractors', async () => {
      const res = await request(app).get('/reports/contractors');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'contractors' });
    });

    it('should route /lawyers', async () => {
      const res = await request(app).get('/reports/lawyers');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'lawyers' });
    });

    it('should route /tasks', async () => {
      const res = await request(app).get('/reports/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'tasks' });
    });

    it('should route /configs', async () => {
      const res = await request(app).get('/reports/configs');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'configs' });
    });

    it('should route /export', async () => {
      const res = await request(app).get('/reports/export');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: 'export' });
    });
  });
});
