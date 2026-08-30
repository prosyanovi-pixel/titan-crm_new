const request = require('supertest');
const express = require('express');
const routes = require('../routes');
const db = require('../../../db');

jest.mock('../../../db');

describe('Comments Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/comments', routes);
    jest.clearAllMocks();
  });

  describe('GET /:entityType/:entityId', () => {
    it('should return comments', async () => {
      const mockComments = [{ id: 1, content: 'Test comment' }];
      db.query.mockResolvedValueOnce({ rows: mockComments });

      const res = await request(app).get('/comments/project/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockComments);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['project', '1']
      );
    });

    it('should handle errors', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/comments/project/1');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /:entityType/:entityId', () => {
    it('should return 400 if content missing', async () => {
      const res = await request(app)
        .post('/comments/project/1')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Content is required' });
    });

    it('should create comment', async () => {
      const mockComment = { id: 1, content: 'Test' };
      const mockUser = { name: 'User', initials: 'U', avatar: null, role: 'user' };
      
      db.query
        .mockResolvedValueOnce({ rows: [mockComment] })
        .mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app)
        .post('/comments/project/1')
        .send({ content: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        ...mockComment,
        userName: 'User',
        userInitials: 'U',
        userAvatar: null,
        userRole: 'user'
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete comment', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app).delete('/comments/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });
});
