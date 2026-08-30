const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers');
const db = require('../../../db');
const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const { addCaseEvent } = require('../../legal_cases/services/cases');

jest.mock('../../../db');
jest.mock('../../../utils/responseHelpers');
jest.mock('../../legal_cases/services/cases');
jest.mock('../../../utils/errorHandler', () => ({
  asyncHandler: (fn) => fn
}));

describe('Calendar Controllers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getAllEvents', () => {
    it('should return all events', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // checkTableExists
        .mockResolvedValueOnce({ rows: [{ id: 1, date: '2025-01-01', client: 2, project_id: 3 }] }) // getAll
        .mockResolvedValueOnce({ rows: [] }); // load notifications

      await getAllEvents(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, [
        expect.objectContaining({ id: 1, startDate: '2025-01-01', contractorId: 2, projectId: 3, notifications: [] })
      ]);
    });
  });

  describe('getEventById', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 1;
      db.query
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] })
        .mockResolvedValueOnce({ rows: [] }); // not found

      await getEventById(req, res);

      expect(sendNotFound).toHaveBeenCalledWith(res, 'Event not found');
    });

    it('should return event', async () => {
      req.params.id = 1;
      db.query
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 10 }] }); // notifications

      await getEventById(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, expect.objectContaining({ id: 1, notifications: [{ id: 10 }] }));
    });
  });

  describe('createEvent', () => {
    it('should return validation error if required fields missing', async () => {
      await createEvent(req, res);
      expect(sendValidationError).toHaveBeenCalled();
    });

    it('should create event', async () => {
      req.body = {
        title: 'Meeting',
        startDate: '2025-01-01'
      };

      db.query
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // checkTableExists
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Meeting' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [{ id: 1, date: '2025-01-01' }] }) // loadEventById
        .mockResolvedValueOnce({ rows: [] }); // loadEventNotifications

      await createEvent(req, res);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO calendar_events'), expect.any(Array));
      expect(sendCreated).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 1;
      req.body = { title: 'New', date: '2025-01-01' };

      db.query
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // checkTableExists
        .mockResolvedValueOnce({ rows: [] }); // currentEvent

      await updateEvent(req, res);

      expect(sendNotFound).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 1;
      db.query
        .mockResolvedValueOnce({ rows: [{ 1: 1 }] }) // checkTableExists
        .mockResolvedValueOnce({ rows: [] }); // delete

      await deleteEvent(req, res);

      expect(sendNotFound).toHaveBeenCalled();
    });
  });
});
