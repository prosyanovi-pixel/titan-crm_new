
const db = require('../db');
const helpers = require('../modules/mail/utils/helpers');

async function cleanup() {
  console.log('--- STARTING FOLDER CLEANUP ---');

  try {
    // 1. Get all accounts
    const { rows: accounts } = await db.query('SELECT id, email, user_id FROM mail_accounts');
    console.log(`Found ${accounts.length} accounts.`);

    for (const account of accounts) {
      console.log(`\nProcessing account: ${account.email} (${account.id})`);
      
      await db.query('BEGIN');

      // 2. Get all folders for this account
      const { rows: folders } = await db.query(
        'SELECT id, folder_name, folder_type, imap_folder_path FROM mail_folders WHERE account_id = $1',
        [account.id]
      );

      // Group folders by their canonical type
      const groups = new Map();
      for (const folder of folders) {
        const type = helpers.toCanonicalFolderType(folder.folderType || folder.folder_type, folder.folderName || folder.folder_name);
        if (!type) {
          console.log(`  - Skipping custom folder: ${folder.folderName || folder.folder_name}`);
          continue;
        }
        if (!groups.has(type)) groups.set(type, []);
        groups.get(type).push(folder);
      }

      for (const [type, folderGroup] of groups.entries()) {
        if (folderGroup.length <= 1) {
          console.log(`  - Type "${type}" has no duplicates.`);
          continue;
        }

        console.log(`  - Type "${type}" has ${folderGroup.length} folders. Cleaning up...`);

        // Prefer folder with an IMAP path, or use the first one
        const preferred = folderGroup.find(f => (f.imapFolderPath || f.imap_folder_path) && !(f.imapFolderPath || f.imap_folder_path).includes('[Gmail]')) 
                        || folderGroup.find(f => (f.imapFolderPath || f.imap_folder_path))
                        || folderGroup[0];
        
        const duplicates = folderGroup.filter(f => f.id !== preferred.id);

        for (const duplicate of duplicates) {
          console.log(`    - Merging "${duplicate.folderName || duplicate.folder_name}" (ID: ${duplicate.id}) into "${preferred.folderName || preferred.folder_name}" (ID: ${preferred.id})`);
          
          // Move emails
          const movedMails = await db.query(
            'UPDATE mail SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE folder_id = $2',
            [preferred.id, duplicate.id]
          );
          
          // Update filters
          const updatedFilters = await db.query(
            'UPDATE mail_filters SET target_folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE target_folder_id = $2',
            [preferred.id, duplicate.id]
          );

          // Delete duplicate folder
          await db.query('DELETE FROM mail_folders WHERE id = $1', [duplicate.id]);
          
          console.log(`      (Moved ${movedMails.rowCount} emails, updated ${updatedFilters.rowCount} filters)`);
        }
      }

      await db.query('COMMIT');
      console.log(`Finished account: ${account.email}`);
    }

    console.log('\n--- CLEANUP COMPLETE ---');
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

cleanup();
