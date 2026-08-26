jest.mock('../../../db');
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn().mockResolvedValue(),
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock data')),
    writeFile: jest.fn().mockResolvedValue(),
  },
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('DB_USER=test\nDB_HOST=test\nDB_NAME=test\nDB_PASSWORD=test\nDB_PORT=5432'),
}));
jest.mock('html-to-docx', () => jest.fn().mockResolvedValue(Buffer.from('docx data')));
jest.mock('../services/data-providers/DataProviderFactory');
jest.mock('pizzip');
jest.mock('docxtemplater');

const templateController = require('../controllers/templateController');
const db = require('../../../db');
const fs = require('fs');
const DataProviderFactory = require('../services/data-providers/DataProviderFactory');
const HTMLtoDOCX = require('html-to-docx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

describe('templateController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      file: null,
      headers: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      download: jest.fn(),
      setHeader: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return a list of templates', async () => {
      const mockTemplates = [{ id: 1, name: 'Template 1' }];
      db.query.mockResolvedValueOnce({ rows: mockTemplates });

      await templateController.list(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][0]).toContain('SELECT t.*');
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
    });

    it('should handle filters', async () => {
      req.query = { moduleId: 'contracts', isActive: 'true' };
      const mockTemplates = [{ id: 1, name: 'Template 1' }];
      db.query.mockResolvedValueOnce({ rows: mockTemplates });

      await templateController.list(req, res);

      expect(db.query.mock.calls[0][1]).toEqual(['contracts', true]);
    });
  });

  describe('create', () => {
    it('should create a template with htmlContent', async () => {
      req.body = { name: 'Test', moduleId: 'mail', isHtml: 'true', htmlContent: '<h1>Hello</h1>' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await templateController.create(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('should create a template with a file upload', async () => {
      req.body = { name: 'Test', moduleId: 'contracts' };
      req.file = { filename: 'test.docx', path: '/tmp/test.docx' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

      await templateController.create(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][1]).toContain('test.docx');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 2 });
    });
  });

  describe('update', () => {
    it('should update a template html content', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated', htmlContent: '<p>Updated</p>' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await templateController.update(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return 404 if template not found', async () => {
      req.params = { id: '99' };
      req.body = { name: 'Updated' };
      db.query.mockResolvedValueOnce({ rows: [] });

      await templateController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Template not found' });
    });
  });

  describe('remove', () => {
    it('should delete a template and its file', async () => {
      req.params = { id: '1' };
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      await templateController.remove(req, res);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Template deleted successfully' });
    });
  });


});
