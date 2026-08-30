const {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  generatePdf
} = require('../controllers/quotesController');
const db = require('../../../db');
const { generatePdfBuffer } = require('../../../utils/pdfGenerator');

jest.mock('../../../db');
jest.mock('../../../utils/pdfGenerator');

describe('Quotes Controllers', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  describe('getQuotes', () => {
    it('should return all quotes', async () => {
      const mockRows = [{ id: 1, number: 'Q-001' }];
      db.query.mockResolvedValueOnce({ rows: mockRows });

      await getQuotes(req, res, next);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT q.*'));
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });
  });

  describe('getQuoteById', () => {
    it('should return 404 if quote not found', async () => {
      req.params.id = 1;
      db.query.mockResolvedValueOnce({ rows: [] });

      await getQuoteById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quote not found' });
    });

    it('should return quote with items', async () => {
      req.params.id = 1;
      const quote = { id: 1, number: 'Q-001' };
      const items = [{ id: 1, name: 'Item 1' }];

      db.query
        .mockResolvedValueOnce({ rows: [quote] })
        .mockResolvedValueOnce({ rows: items });

      await getQuoteById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ ...quote, items });
    });
  });

  describe('createQuote', () => {
    it('should return 400 if number is missing', async () => {
      await createQuote(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Quote number is required' });
    });

    it('should create quote and items', async () => {
      req.body = {
        number: 'Q-001',
        status: 'draft',
        items: [{ name: 'Item 1', quantity: 2 }]
      };

      db.query.mockResolvedValueOnce(); // BEGIN
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, number: 'Q-001' }] }); // INSERT quote
      db.query.mockResolvedValueOnce(); // INSERT item
      db.query.mockResolvedValueOnce(); // COMMIT

      await createQuote(req, res, next);

      expect(db.query).toHaveBeenCalledWith('BEGIN');
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO quote_items'), expect.any(Array));
      expect(db.query).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, number: 'Q-001' });
    });
  });

  describe('updateQuote', () => {
    it('should return 400 if number is missing', async () => {
      await updateQuote(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if quote not found', async () => {
      req.params.id = 1;
      req.body = { number: 'Q-001' };

      db.query.mockResolvedValueOnce(); // BEGIN
      db.query.mockResolvedValueOnce({ rows: [] }); // current quote
      db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE (not found)
      db.query.mockResolvedValueOnce(); // ROLLBACK

      await updateQuote(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteQuote', () => {
    it('should delete quote successfully', async () => {
      req.params.id = 1;
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await deleteQuote(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Quote deleted successfully' });
    });
  });

  describe('generatePdf', () => {
    it('should generate pdf and send', async () => {
      req.params.id = 1;
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, number: 'Q-001' }] })
        .mockResolvedValueOnce({ rows: [] }); // items

      generatePdfBuffer.mockResolvedValueOnce(Buffer.from('pdf'));

      await generatePdf(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });
});
