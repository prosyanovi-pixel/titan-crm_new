const request = require('supertest');
const express = require('express');
const router = require('../controllers/cases');
const {
  ensureLegalCaseSupportTables,
  extractCasePayload
} = require('../utils/helpers');
const { getAllCases, getCaseById, createCase, updateCase, deleteCase } = require('../services/cases');
const { markAllCaseUpdatesAsViewed, getUnviewedUpdates, deleteUpdate, deleteAllCaseUpdates } = require('../services/updates');
const { validateCaseData, validateCaseFinancials } = require('../validators/validators');

jest.mock('../../../utils/logger');
jest.mock('../utils/helpers');
jest.mock('../services/cases');
jest.mock('../services/updates');
jest.mock('../validators/validators');
jest.mock('../services/syncService');

const app = express();
app.use(express.json());
app.use('/cases', router);

describe('Cases Controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureLegalCaseSupportTables.mockResolvedValue();
  });

  describe('GET /cases', () => {
    it('should return all cases', async () => {
      const mockCases = [{ id: 1, title: 'Case 1' }];
      getAllCases.mockResolvedValueOnce(mockCases);

      const res = await request(app).get('/cases');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCases);
    });
  });

  describe('GET /cases/:id', () => {
    it('should return 404 if not found', async () => {
      getCaseById.mockResolvedValueOnce(null);

      const res = await request(app).get('/cases/1');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: 'Case not found'
      });
    });

    it('should return case with unviewed updates', async () => {
      const mockCase = { id: 1, title: 'Case 1' };
      const updates = [{ id: 1 }];
      
      getCaseById.mockResolvedValueOnce(mockCase);
      getUnviewedUpdates.mockResolvedValueOnce(updates);

      const res = await request(app).get('/cases/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ...mockCase,
        unviewedUpdates: updates,
        hasUnviewedUpdates: true
      });
    });
  });

  describe('POST /cases', () => {
    it('should return validation error if data is invalid', async () => {
      extractCasePayload.mockReturnValueOnce({});
      validateCaseData.mockReturnValueOnce({ valid: false, errors: ['Error'] });

      const res = await request(app).post('/cases').send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Error'
      });
    });

    it('should create case', async () => {
      extractCasePayload.mockReturnValueOnce({ title: 'New Case' });
      validateCaseData.mockReturnValueOnce({ valid: true, data: { title: 'New Case' } });
      validateCaseFinancials.mockReturnValueOnce({});
      
      const createdCase = { id: 'case-1', title: 'New Case' };
      createCase.mockResolvedValueOnce(createdCase);

      const res = await request(app).post('/cases').send({});

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdCase);
    });
  });

  describe('PUT /cases/:id', () => {
    it('should return 404 if not found', async () => {
      getCaseById.mockResolvedValueOnce(null);

      const res = await request(app).put('/cases/1').send({});

      expect(res.status).toBe(404);
    });

    it('should update case', async () => {
      getCaseById.mockResolvedValueOnce({ id: 1 });
      extractCasePayload.mockReturnValueOnce({ title: 'Updated Case' });
      validateCaseData.mockReturnValueOnce({ valid: true, data: { title: 'Updated Case' } });
      validateCaseFinancials.mockReturnValueOnce({});
      
      const updatedCase = { id: 1, title: 'Updated Case' };
      updateCase.mockResolvedValueOnce(updatedCase);

      const res = await request(app).put('/cases/1').send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedCase);
    });
  });

  describe('DELETE /cases/:id', () => {
    it('should delete case', async () => {
      getCaseById.mockResolvedValueOnce({ id: 1 });
      deleteCase.mockResolvedValueOnce(true);

      const res = await request(app).delete('/cases/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Case deleted'
      });
    });
  });
});
