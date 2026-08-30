const request = require('supertest');
const express = require('express');
const router = require('../routes');
const db = require('../../../db');

jest.mock('../../../db');
jest.mock('../../../utils/logger');

describe('Notifications Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/notifications', router);
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return 401 if user ID is missing', async () => {
      const res = await request(app).get('/notifications');
      expect(res.status).toBe(401);
    });

    it('should return notifications', async () => {
      const mockResult = [{ id: 1, content: 'Test' }];
      db.query.mockResolvedValueOnce({ rows: mockResult });

      const res = await request(app)
        .get('/notifications')
        .set('x-user-id', '1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockResult);
    });
  });

  describe('PATCH /:id/read', () => {
    it('should return 401 if user ID is missing', async () => {
      const res = await request(app).patch('/notifications/1/read');
      expect(res.status).toBe(401);
    });

    it('should mark notification as read', async () => {
      db.query.mockResolvedValueOnce();

      const res = await request(app)
        .patch('/notifications/1/read')
        .set('x-user-id', '1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  describe('PATCH /read-all', () => {
    it('should return 401 if user ID is missing', async () => {
      const res = await request(app).patch('/notifications/read-all');
      expect(res.status).toBe(401);
    });

    it('should mark all notifications as read', async () => {
      db.query.mockResolvedValueOnce();

      const res = await request(app)
        .patch('/notifications/read-all')
        .set('x-user-id', '1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  describe('DELETE /:id', () => {
    it('should return 401 if user ID is missing', async () => {
      const res = await request(app).delete('/notifications/1');
      expect(res.status).toBe(401);
    });

    it('should delete notification', async () => {
      db.query.mockResolvedValueOnce();

      const res = await request(app)
        .delete('/notifications/1')
        .set('x-user-id', '1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });
});
