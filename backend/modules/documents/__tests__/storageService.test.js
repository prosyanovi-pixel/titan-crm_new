const storage = require('../../../services/storage');
const logger = require('../../../utils/logger');
const {
  deleteFile,
  saveFile,
  fileExists,
  getFilePath,
  getFileStream,
} = require('../services/storageService');

jest.mock('../../../services/storage', () => ({
  delete: jest.fn(),
  save: jest.fn(),
  exists: jest.fn(),
  getLocalPath: jest.fn(),
  get: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  error: jest.fn(),
}));

describe('Document Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteFile', () => {
    it('should return false if no filename provided', async () => {
      const result = await deleteFile();
      expect(result).toBe(false);
    });

    it('should delete file via central storage and return true', async () => {
      storage.delete.mockResolvedValueOnce();
      const result = await deleteFile('test.pdf');
      
      expect(storage.delete).toHaveBeenCalledWith('documents/test.pdf');
      expect(result).toBe(true);
    });

    it('should catch error and return false', async () => {
      storage.delete.mockRejectedValueOnce(new Error('Deletion failed'));
      const result = await deleteFile('test.pdf');
      
      expect(logger.error).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('saveFile', () => {
    it('should delegate to storage.save', async () => {
      storage.save.mockResolvedValueOnce('path');
      await saveFile('test.pdf', Buffer.from('data'));
      
      expect(storage.save).toHaveBeenCalledWith('documents/test.pdf', expect.any(Buffer));
    });
  });

  describe('fileExists', () => {
    it('should return false if no filename provided', async () => {
      const result = await fileExists();
      expect(result).toBe(false);
    });

    it('should delegate to storage.exists', async () => {
      storage.exists.mockResolvedValueOnce(true);
      const result = await fileExists('test.pdf');
      
      expect(storage.exists).toHaveBeenCalledWith('documents/test.pdf');
      expect(result).toBe(true);
    });
  });

  describe('getFilePath', () => {
    it('should delegate to storage.getLocalPath', async () => {
      storage.getLocalPath.mockResolvedValueOnce('/local/path');
      const result = await getFilePath('test.pdf');
      
      expect(storage.getLocalPath).toHaveBeenCalledWith('documents/test.pdf');
      expect(result).toBe('/local/path');
    });
  });

  describe('getFileStream', () => {
    it('should delegate to storage.get', async () => {
      storage.get.mockResolvedValueOnce('stream');
      const result = await getFileStream('test.pdf');
      
      expect(storage.get).toHaveBeenCalledWith('documents/test.pdf');
      expect(result).toBe('stream');
    });
  });
});
