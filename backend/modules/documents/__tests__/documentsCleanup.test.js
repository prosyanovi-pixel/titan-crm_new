const db = require('../../../db');
const storageService = require('../services/storageService');
const { removeDocumentsPermanentlyByIds } = require('../controllers/documentsCleanup');

jest.mock('../../../db', () => ({
  query: jest.fn(),
}));

jest.mock('../services/storageService', () => ({
  deleteFile: jest.fn(),
}));

describe('documentsCleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('removeDocumentsPermanentlyByIds', () => {
    it('should return 0 if no documents found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const count = await removeDocumentsPermanentlyByIds(['doc1']);
      
      expect(count).toBe(0);
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should delete documents and physical files', async () => {
      const mockFiles = [
        { id: '1', type: 'file', stored_filename: 'file1.pdf', name: 'File 1' },
        { id: '2', type: 'folder', name: 'Folder 1' },
        { id: '3', type: 'file', name: 'file2.txt' },
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockFiles }) // Select query
        .mockResolvedValueOnce({ rowCount: 3 }); // Delete query

      const count = await removeDocumentsPermanentlyByIds(['1', '2', '3']);

      expect(count).toBe(3);
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
      
      // Should delete using stored_filename
      expect(storageService.deleteFile).toHaveBeenCalledWith('file1.pdf');
      // Should fallback to id + ext if stored_filename is missing
      expect(storageService.deleteFile).toHaveBeenCalledWith('3.txt');
    });
  });
});
