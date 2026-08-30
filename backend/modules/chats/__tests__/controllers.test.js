const controllers = require('../controllers');
const services = require('../services');

jest.mock('../services');

describe('Chats Controllers', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('getChats', () => {
    it('should return chats', async () => {
      const mockResult = { data: [], total: 0 };
      services.getChats.mockResolvedValueOnce(mockResult);

      await controllers.getChats(req, res, next);

      expect(services.getChats).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getChatMessages', () => {
    it('should return messages', async () => {
      req.params.id = 1;
      const mockMessages = [{ id: 1, text: 'Hello' }];
      services.getChatMessages.mockResolvedValueOnce(mockMessages);

      await controllers.getChatMessages(req, res, next);

      expect(services.getChatMessages).toHaveBeenCalledWith(1, req.query);
      expect(res.json).toHaveBeenCalledWith({ data: mockMessages });
    });
  });

  describe('createChat', () => {
    it('should return 400 if name is missing', async () => {
      req.body = { platform: 'telegram' };
      await controllers.createChat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name is required' });
    });

    it('should create chat', async () => {
      req.body = { name: 'Test Chat', platform: 'telegram' };
      const mockChat = { id: 1, name: 'Test Chat' };
      services.createChat.mockResolvedValueOnce(mockChat);

      await controllers.createChat(req, res, next);

      expect(services.createChat).toHaveBeenCalledWith('Test Chat', 'telegram');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ data: mockChat });
    });
  });

  describe('sendMessage', () => {
    it('should send message', async () => {
      req.params.id = 1;
      req.body = { text: 'Hello' };
      req.user = { id: 2 };
      const mockMsg = { id: 1, text: 'Hello' };
      services.sendMessage.mockResolvedValueOnce(mockMsg);

      await controllers.sendMessage(req, res, next);

      expect(services.sendMessage).toHaveBeenCalledWith(1, 'Hello', 2);
      expect(res.json).toHaveBeenCalledWith({ data: mockMsg });
    });
  });

  describe('editMessage', () => {
    it('should return 400 if text is missing', async () => {
      req.body = {};
      await controllers.editMessage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Text is required' });
    });

    it('should edit message', async () => {
      req.params = { id: 1, messageId: 2 };
      req.body = { text: 'Edited' };
      req.user = { id: 2 };
      const mockMsg = { id: 2, text: 'Edited' };
      services.editMessage.mockResolvedValueOnce(mockMsg);

      await controllers.editMessage(req, res, next);

      expect(services.editMessage).toHaveBeenCalledWith(1, 2, 'Edited', 2);
      expect(res.json).toHaveBeenCalledWith({ data: mockMsg });
    });
  });

  describe('deleteChat', () => {
    it('should delete chat', async () => {
      req.params.id = 1;
      services.deleteChat.mockResolvedValueOnce();

      await controllers.deleteChat(req, res, next);

      expect(services.deleteChat).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('clearChatHistory', () => {
    it('should clear chat history', async () => {
      req.params.id = 1;
      services.clearChatHistory.mockResolvedValueOnce();

      await controllers.clearChatHistory(req, res, next);

      expect(services.clearChatHistory).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('markAsRead', () => {
    it('should mark as read', async () => {
      req.params.id = 1;
      services.markAsRead.mockResolvedValueOnce();

      await controllers.markAsRead(req, res, next);

      expect(services.markAsRead).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
