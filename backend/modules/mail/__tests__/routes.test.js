const request = require('supertest');
const express = require('express');

jest.mock('../controllers', () => {
  return {
    getAccounts: jest.fn(),
    getAccount: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    testAccount: jest.fn(),
    testConnectionTemp: jest.fn(),
    syncAccount: jest.fn(),
    clearAccountMails: jest.fn(),
    deleteAccount: jest.fn(),
    getImapFolders: jest.fn(),
    syncFolders: jest.fn(),
    getFolders: jest.fn(),
    getFolderStats: jest.fn(),
    cleanupDuplicateFolders: jest.fn(),
    createFolder: jest.fn(),
    clearFolder: jest.fn(),
    clearFolderLocal: jest.fn(),
    markFolderAllRead: jest.fn(),
    updateFolder: jest.fn(),
    deleteFolder: jest.fn(),
    getFilters: jest.fn(),
    createFilter: jest.fn(),
    updateFilter: jest.fn(),
    deleteFilter: jest.fn(),
    applyFilter: jest.fn(),
    applyAllFilters: jest.fn(),
    getAllMails: jest.fn(),
    getMailById: jest.fn(),
    sendMail: jest.fn(),
    uploadAttachments: jest.fn(),
    getAttachments: jest.fn(),
    downloadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    saveToDocuments: jest.fn(),
    markRead: jest.fn(),
    getMailThread: jest.fn(),
    toggleStar: jest.fn(),
    moveMail: jest.fn(),
    deleteMail: jest.fn(),
    bulkRead: jest.fn(),
    bulkMove: jest.fn(),
    bulkDelete: jest.fn(),
    getSchedulerStatus: jest.fn(),
    getWebsocketStatus: jest.fn(),
    getTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    upload: {
      array: () => (req, res, next) => next()
    }
  };
});

const router = require('../routes');
const c = require('../controllers');

const app = express();
app.use(express.json());
app.use('/mail', router);

describe('Mail Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Object.keys(c).forEach(key => {
      if (typeof c[key] === 'function') {
        c[key].mockImplementation((req, res) => res.status(200).json({ method: key }));
      }
    });
  });

  const methods = [
    { method: 'get', url: '/mail/accounts', handler: 'getAccounts' },
    { method: 'get', url: '/mail/accounts/1', handler: 'getAccount' },
    { method: 'post', url: '/mail/accounts', handler: 'createAccount' },
    { method: 'put', url: '/mail/accounts/1', handler: 'updateAccount' },
    { method: 'post', url: '/mail/accounts/1/test', handler: 'testAccount' },
    { method: 'post', url: '/mail/test-connection', handler: 'testConnectionTemp' },
    { method: 'post', url: '/mail/accounts/1/sync', handler: 'syncAccount' },
    { method: 'delete', url: '/mail/accounts/1/mails', handler: 'clearAccountMails' },
    { method: 'delete', url: '/mail/accounts/1', handler: 'deleteAccount' },
    { method: 'post', url: '/mail/accounts/1/imap-folders', handler: 'getImapFolders' },
    { method: 'post', url: '/mail/accounts/1/sync-folders', handler: 'syncFolders' },
    { method: 'get', url: '/mail/folders/1', handler: 'getFolders' },
    { method: 'get', url: '/mail/folders/1/stats', handler: 'getFolderStats' },
    { method: 'post', url: '/mail/folders/1/cleanup-duplicates', handler: 'cleanupDuplicateFolders' },
    { method: 'post', url: '/mail/folders', handler: 'createFolder' },
    { method: 'post', url: '/mail/folders/1/clear', handler: 'clearFolder' },
    { method: 'post', url: '/mail/folders/1/clear-local', handler: 'clearFolderLocal' },
    { method: 'patch', url: '/mail/folders/1/read-all', handler: 'markFolderAllRead' },
    { method: 'put', url: '/mail/folders/1', handler: 'updateFolder' },
    { method: 'delete', url: '/mail/folders/1', handler: 'deleteFolder' },
    { method: 'get', url: '/mail/filters/1', handler: 'getFilters' },
    { method: 'post', url: '/mail/filters', handler: 'createFilter' },
    { method: 'put', url: '/mail/filters/1', handler: 'updateFilter' },
    { method: 'delete', url: '/mail/filters/1', handler: 'deleteFilter' },
    { method: 'post', url: '/mail/filters/1/apply', handler: 'applyFilter' },
    { method: 'post', url: '/mail/filters/apply-all', handler: 'applyAllFilters' },
    { method: 'get', url: '/mail/', handler: 'getAllMails' },
    { method: 'get', url: '/mail/1', handler: 'getMailById' },
    { method: 'post', url: '/mail/', handler: 'sendMail' },
    { method: 'get', url: '/mail/1/attachments', handler: 'getAttachments' },
    { method: 'get', url: '/mail/attachments/download/1', handler: 'downloadAttachment' },
    { method: 'delete', url: '/mail/attachments/1', handler: 'deleteAttachment' },
    { method: 'post', url: '/mail/attachments/1/save-to-docs', handler: 'saveToDocuments' },
    { method: 'patch', url: '/mail/1/read', handler: 'markRead' },
    { method: 'get', url: '/mail/1/thread', handler: 'getMailThread' },
    { method: 'patch', url: '/mail/1/star', handler: 'toggleStar' },
    { method: 'patch', url: '/mail/1/move', handler: 'moveMail' },
    { method: 'delete', url: '/mail/1', handler: 'deleteMail' },
    { method: 'post', url: '/mail/bulk/read', handler: 'bulkRead' },
    { method: 'post', url: '/mail/bulk/move', handler: 'bulkMove' },
    { method: 'post', url: '/mail/bulk/delete', handler: 'bulkDelete' }
  ];

  methods.forEach(({ method, url, handler }) => {
    it(`should route ${method.toUpperCase()} ${url} to ${handler}`, async () => {
      const res = await request(app)[method](url).set('x-user-id', '1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ method: handler });
    });
  });

  it('should return 401 if x-user-id is missing', async () => {
    const res = await request(app).get('/mail/accounts');
    expect(res.status).toBe(401);
  });
});
