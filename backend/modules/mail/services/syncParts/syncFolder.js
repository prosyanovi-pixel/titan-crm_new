const db = require('../../../../db');
const logger = require('../../../../utils/logger');

module.exports = async function syncFolder(instance, imap, account, folder, fetchTimeout) {
  const result = {
    emailsSynced: 0,
    emailsUpdated: 0,
    attachmentsDownloaded: 0
  };

  if (!folder || typeof folder !== 'object') {
    logger.error(`[MailSync] Invalid folder object: ${folder}`);
    throw new Error('Invalid folder object');
  }

  const folderName = String(folder.name || '').trim();
  let folderPath = String(folder.path || '').trim();
  
  if (!folderName || !folderPath) {
    logger.error(`[MailSync] Folder has empty name or path: name="${folderName}", path="${folderPath}"`);
    throw new Error('Folder name and path are required');
  }

  logger.info(`[MailSync] === syncFolder() START: folderName="${folderName}", folderPath="${folderPath}" ===`);

  return new Promise((resolve, reject) => {
    if (typeof folderPath !== 'string') {
      logger.error(`[MailSync] CRITICAL: folderPath is not string! Type: ${typeof folderPath}, Value: ${folderPath}`);
      return reject(new Error(`Invalid folderPath type: expected string, got ${typeof folderPath}`));
    }

    logger.debug(`[MailSync] Step 1: Opening box: "${folderPath}" (type=${typeof folderPath})`);

    imap.openBox(folderPath, false, async (err, box) => {
      if (err) {
        logger.error(`[MailSync] ERROR opening box ${folderPath}: ${err.message}`);
        return reject(err);
      }

      logger.info(`[MailSync] Step 2: Box opened successfully: ${folderName}, messages.total=${box.messages.total}`);

      try {
        const deletedCount = 0;

        logger.info(`[MailSync] Step 3: Getting sync state for ${folderName}`);
        const syncState = await instance.getSyncState(account.id, folderName);
        logger.info(`[MailSync] Step 3 complete: Sync state = ${syncState ? `last_uid=${syncState.last_uid}` : 'none'}`);
        
        let uidRange;
        if (syncState && syncState.last_uid) {
          const lastUidNum = parseInt(syncState.last_uid, 10);
          if (!isNaN(lastUidNum) && lastUidNum > 0) {
            uidRange = `${lastUidNum + 1}:*`;
            logger.info(`[MailSync] Step 4: Incremental sync: uidRange=${uidRange} (last_uid=${lastUidNum})`);
          } else {
            const totalMessages = box.messages.total;
            const startUid = Math.max(1, totalMessages - instance.maxMessagesPerSync + 1);
            uidRange = `${startUid}:*`;
            logger.info(`[MailSync] Step 4: Full sync (invalid last_uid): totalMessages=${totalMessages}, uidRange=${uidRange}`);
          }
        } else {
          const totalMessages = box.messages.total;
          const startUid = Math.max(1, totalMessages - instance.maxMessagesPerSync + 1);
          uidRange = `${startUid}:*`;
          logger.info(`[MailSync] Step 4: Full sync (no last_uid): totalMessages=${totalMessages}, uidRange=${uidRange}`);
        }

        logger.info(`[MailSync] Step 5: Searching for messages with UID range: ${uidRange}`);

        imap.search([['UID', uidRange]], (err, uids) => {
          if (err) {
            logger.error(`[MailSync] ERROR in search for ${folderName}: ${err.message}`);
            return reject(err);
          }

          logger.info(`[MailSync] Step 6: Search complete - ${uids ? uids.length : 0} UIDs found`);

          if (!uids || uids.length === 0) {
            logger.info(`[MailSync] No new messages in ${folderName}, resolving`);
            return resolve(result);
          }

          if (uids.length > instance.maxMessagesPerSync) {
            const originalCount = uids.length;
            uids = uids.slice(-instance.maxMessagesPerSync);
            logger.info(`[MailSync] Step 7: Limiting folder ${folderName} from ${originalCount} to ${uids.length} messages`);
          }

          logger.info(`[MailSync] Step 8: Processing ${uids.length} messages in ${folderName}`);

          const fetchPromise = instance.fetchMessages(imap, uids, account, folder, syncState);
          const timeout = fetchTimeout || instance.baseFetchMessagesTimeout;

          logger.info(`[MailSync] Step 9: Starting fetchMessages with timeout=${timeout}ms`);
          
          instance.withTimeout(
            fetchPromise,
            timeout,
            `Fetch messages timeout: ${folderName}`
          )
            .then(async (fetchResult) => {
              logger.info(`[MailSync] Step 10: fetchMessages completed, result: ${JSON.stringify(fetchResult)}`);

              result.emailsSynced = fetchResult.emailsSynced;
              result.emailsUpdated = fetchResult.emailsUpdated;
              result.attachmentsDownloaded = fetchResult.attachmentsDownloaded;

              const maxUid = Math.max(...uids);
              logger.info(`[MailSync] Step 11: Updating sync state with maxUid=${maxUid}`);

              await instance.updateSyncState(account.id, folderName, {
                uid_validity: box.uidvalidity,
                last_uid: maxUid,
                last_sync: new Date(),
                sync_status: 'completed'
              });

              logger.info(`[MailSync] === syncFolder() COMPLETE for ${folderName}: synced=${result.emailsSynced} ===`);
              resolve(result);
            })
            .catch((error) => {
              logger.error(`[MailSync] ERROR in syncFolder() for ${folderName}: ${error.message}`);
              logger.error(`[MailSync] Stack trace:`, error.stack);
              reject(error);
            });
        });
      } catch (error) {
        logger.error(`[MailSync] EXCEPTION in syncFolder(): ${error.message}`);
        logger.error(`[MailSync] Stack:`, error.stack);
        reject(error);
      }
    });
  });
};
