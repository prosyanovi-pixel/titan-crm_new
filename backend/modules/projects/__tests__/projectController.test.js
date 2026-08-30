const {
  getAll,
  getSalesPipeline,
  getStats,
  getById,
  create,
  update,
  remove,
  bulkUpdate,
  bulkDelete,
  complete,
  archive,
} = require('../controllers');
const projectService = require('../services/projectService');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

jest.mock('../services/projectService');
jest.mock('../../../utils/responseHelpers');

describe('Project Controllers', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Mock console.error to keep logs clean during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  describe('getAll', () => {
    it('should return all projects successfully', async () => {
      const mockProjects = [{ id: 1, name: 'Project 1' }];
      projectService.getAllProjects.mockResolvedValueOnce(mockProjects);

      await getAll(req, res);

      expect(projectService.getAllProjects).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(res, mockProjects);
    });

    it('should return empty array on error', async () => {
      projectService.getAllProjects.mockRejectedValueOnce(new Error('DB Error'));

      await getAll(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, []);
    });
  });

  describe('getSalesPipeline', () => {
    it('should return sales pipeline', async () => {
      const mockPipeline = { stages: [] };
      projectService.getSalesPipeline.mockResolvedValueOnce(mockPipeline);

      await getSalesPipeline(req, res);

      expect(projectService.getSalesPipeline).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(res, mockPipeline);
    });

    it('should return empty array on error', async () => {
      projectService.getSalesPipeline.mockRejectedValueOnce(new Error('DB Error'));

      await getSalesPipeline(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, []);
    });
  });

  describe('getStats', () => {
    it('should return project stats', async () => {
      const mockStats = { total: 10 };
      projectService.getProjectStats.mockResolvedValueOnce(mockStats);

      await getStats(req, res);

      expect(projectService.getProjectStats).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(res, mockStats);
    });
  });

  describe('getById', () => {
    it('should return a single project', async () => {
      req.params.id = '1';
      const mockProject = { id: 1, name: 'Test' };
      projectService.getProjectById.mockResolvedValueOnce(mockProject);

      await getById(req, res);

      expect(projectService.getProjectById).toHaveBeenCalledWith('1');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockProject);
    });

    it('should return not found if project missing', async () => {
      req.params.id = '1';
      projectService.getProjectById.mockResolvedValueOnce(null);

      await getById(req, res);

      expect(sendNotFound).toHaveBeenCalledWith(res, 'Project not found');
    });
  });

  describe('create', () => {
    it('should create project successfully', async () => {
      req.body = { name: 'New Project' };
      const mockCreated = { id: 2, name: 'New Project' };
      projectService.createProject.mockResolvedValueOnce(mockCreated);

      await create(req, res);

      expect(projectService.createProject).toHaveBeenCalledWith(req.body);
      expect(sendCreated).toHaveBeenCalledWith(res, mockCreated);
    });

    it('should return validation error on failure', async () => {
      req.body = {};
      projectService.createProject.mockRejectedValueOnce(new Error('Invalid data'));

      await create(req, res);

      expect(sendValidationError).toHaveBeenCalledWith(res, 'Invalid data');
    });
  });

  describe('update', () => {
    it('should update project successfully', async () => {
      req.params.id = '1';
      req.body = { name: 'Updated' };
      const mockUpdated = { id: 1, name: 'Updated' };
      projectService.updateProject.mockResolvedValueOnce(mockUpdated);

      await update(req, res);

      expect(projectService.updateProject).toHaveBeenCalledWith('1', req.body);
      expect(sendSuccess).toHaveBeenCalledWith(res, mockUpdated);
    });

    it('should return not found if project does not exist', async () => {
      req.params.id = '1';
      projectService.updateProject.mockResolvedValueOnce(null);

      await update(req, res);

      expect(sendNotFound).toHaveBeenCalledWith(res, 'Project not found');
    });
  });

  describe('remove', () => {
    it('should delete project successfully', async () => {
      req.params.id = '1';
      projectService.deleteProject.mockResolvedValueOnce(true);

      await remove(req, res);

      expect(projectService.deleteProject).toHaveBeenCalledWith('1');
      expect(sendDeleted).toHaveBeenCalledWith(res);
    });

    it('should return not found if project does not exist', async () => {
      req.params.id = '1';
      projectService.deleteProject.mockResolvedValueOnce(false);

      await remove(req, res);

      expect(sendNotFound).toHaveBeenCalledWith(res, 'Project not found');
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update projects', async () => {
      req.body = { ids: [1, 2], field: 'status', value: 'active' };
      const mockResult = [{ id: 1 }, { id: 2 }];
      projectService.bulkUpdateProjects.mockResolvedValueOnce(mockResult);

      await bulkUpdate(req, res);

      expect(projectService.bulkUpdateProjects).toHaveBeenCalledWith([1, 2], 'status', 'active');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockResult);
    });
  });
  
  describe('archive', () => {
    it('should archive project', async () => {
      req.params.id = '1';
      projectService.archiveProject.mockResolvedValueOnce({ id: 1, status: 'archived' });
      await archive(req, res);
      expect(sendSuccess).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('should complete project', async () => {
      req.params.id = '1';
      projectService.completeProject.mockResolvedValueOnce({ id: 1, status: 'completed' });
      await complete(req, res);
      expect(sendSuccess).toHaveBeenCalled();
    });
  });
});
