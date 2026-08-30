const workflow = require('../workflow');
const db = require('../../../db');

jest.mock('../../../db');

describe('Tasks Workflow Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create_task', () => {
    it('should throw error if title is missing', async () => {
      const config = {};
      await expect(workflow.actions.create_task.handler(config)).rejects.toThrow('[tasks.create_task] "title" обязателен');
    });

    it('should create a task and return it', async () => {
      const config = { title: 'Test task', assignee: 'user1' };
      const createdTask = { id: 'task-1', title: 'Test task' };
      
      db.query.mockResolvedValueOnce({ rows: [createdTask] });

      const result = await workflow.actions.create_task.handler(config);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tasks'),
        expect.arrayContaining(['Test task', 'user1', 'Medium', 'To Do'])
      );
      expect(result).toEqual({ task: createdTask, taskId: 'task-1' });
    });
  });

  describe('update_task_status', () => {
    it('should throw error if task_id is missing', async () => {
      const config = { status: 'Done' };
      await expect(workflow.actions.update_task_status.handler(config)).rejects.toThrow('[tasks.update_task_status] "task_id" обязателен');
    });

    it('should throw error if task not found', async () => {
      const config = { task_id: 'task-1', status: 'Done' };
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(workflow.actions.update_task_status.handler(config)).rejects.toThrow('Task task-1 not found');
    });

    it('should update task status', async () => {
      const config = { task_id: 'task-1', status: 'Done' };
      const updatedTask = { id: 'task-1', status: 'Done' };
      db.query.mockResolvedValueOnce({ rows: [updatedTask] });

      const result = await workflow.actions.update_task_status.handler(config);

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
        ['Done', 'task-1']
      );
      expect(result).toEqual({ updated: true, task: updatedTask });
    });
  });

  describe('find_tasks', () => {
    it('should find tasks with keyword and status', async () => {
      const config = { keyword: 'Test', status: 'Done', limit: 10 };
      const tasks = [{ id: 'task-1' }, { id: 'task-2' }];
      db.query.mockResolvedValueOnce({ rows: tasks });

      const result = await workflow.actions.find_tasks.handler(config);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE title ILIKE $1 AND status = $2 LIMIT $3',
        ['%Test%', 'Done', 10]
      );
      expect(result).toEqual({ tasks, count: 2 });
    });

    it('should find tasks with only keyword', async () => {
      const config = { keyword: 'Test' };
      const tasks = [{ id: 'task-1' }];
      db.query.mockResolvedValueOnce({ rows: tasks });

      const result = await workflow.actions.find_tasks.handler(config);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE title ILIKE $1 LIMIT $2',
        ['%Test%', 5] // default limit
      );
      expect(result).toEqual({ tasks, count: 1 });
    });
  });
});
