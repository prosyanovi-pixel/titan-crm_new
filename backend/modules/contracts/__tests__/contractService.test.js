const contractService = require('../services/contractService');
const contractReadModel = require('../services/contractReadModel');
const contractPersistence = require('../services/contractPersistence');
const contractMutations = require('../services/contractMutations');
const contractTemplates = require('../services/contractTemplates');

jest.mock('../../../db');
jest.mock('../../../utils/logger');
jest.mock('../services/contractReadModel');
jest.mock('../services/contractPersistence');
jest.mock('../services/contractMutations');
jest.mock('../services/contractTemplates');

describe('Contract Service Facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should delegate to contractReadModel', async () => {
      contractReadModel.getAll.mockResolvedValueOnce([]);
      
      const result = await contractService.getAll(1, { page: 1 });
      
      expect(contractReadModel.getAll).toHaveBeenCalledWith(expect.objectContaining({
        options: { page: 1 }
      }));
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should delegate to contractReadModel', async () => {
      contractReadModel.getById.mockResolvedValueOnce({ id: 1 });
      
      const result = await contractService.getById(1);
      
      expect(contractReadModel.getById).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 1
      }));
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('create', () => {
    it('should delegate to contractPersistence', async () => {
      contractPersistence.create.mockResolvedValueOnce({ id: 1 });
      
      const result = await contractService.create(1, { name: 'Test' });
      
      expect(contractPersistence.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        data: { name: 'Test' }
      }));
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should delegate to contractPersistence', async () => {
      contractPersistence.update.mockResolvedValueOnce({ id: 1 });
      
      const result = await contractService.update(1, 2, { name: 'Test' });
      
      expect(contractPersistence.update).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 1,
        userId: 2,
        data: { name: 'Test' }
      }));
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('delete', () => {
    it('should delegate to contractMutations', async () => {
      contractMutations.deleteContract.mockResolvedValueOnce(true);
      
      const result = await contractService.delete(1, 2);
      
      expect(contractMutations.deleteContract).toHaveBeenCalledWith(expect.objectContaining({
        contractId: 1,
        userId: 2
      }));
      expect(result).toBe(true);
    });
  });

  describe('Templates', () => {
    it('should delegate getTemplates', async () => {
      contractTemplates.getTemplates.mockResolvedValueOnce([]);
      await contractService.getTemplates({ page: 1 });
      expect(contractTemplates.getTemplates).toHaveBeenCalledWith(expect.objectContaining({ options: { page: 1 } }));
    });
  });
});
