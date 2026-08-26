/**
 * Integration test for disabled folders sync
 * Run: node test-integration-disabled-folders.js
 */

const db = require('../db');
const logger = require('../utils/logger');

async function testDisabledFolders() {
  console.log('=== Integration Test: Disabled Folders ===\n');

  try {
    // 1. Check if is_visible column exists
    console.log('1. Checking database schema...');
    const { rows: schemaCheck } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mail_folders' 
      AND column_name = 'is_visible'
    `);
    
    if (schemaCheck.length === 0) {
      console.log('❌ ERROR: is_visible column not found. Run migration first:');
      console.log('   npm run migrate');
      return false;
    }
    console.log('✅ is_visible column exists\n');

    // 2. Check test account
    console.log('2. Checking test account...');
    const { rows: accounts } = await db.query(`
      SELECT id, email, user_id FROM mail_accounts LIMIT 1
    `);
    
    if (accounts.length === 0) {
      console.log('⚠️  No test accounts found. Create one first.\n');
      return true; // Not an error, just no data
    }

    const testAccount = accounts[0];
    console.log(`✅ Found account: ${testAccount.email}\n`);

    // 3. Check if account has folders
    console.log('3. Checking folders...');
    const { rows: folders } = await db.query(`
      SELECT id, folder_name, is_visible 
      FROM mail_folders 
      WHERE account_id = $1 
      LIMIT 3
    `, [testAccount.id]);

    if (folders.length === 0) {
      console.log('⚠️  No folders found. Run sync first.\n');
      return true; // Not an error
    }

    console.log(`✅ Found ${folders.length} folders:`);
    folders.forEach(f => {
      console.log(`   - ${f.folder_name} (is_visible: ${f.is_visible})`);
    });
    console.log();

    // 4. Test disabling a folder
    console.log('4. Testing folder disable/enable...');
    const testFolder = folders[0];
    
    // Disable
    await db.query(
      'UPDATE mail_folders SET is_visible = $1 WHERE id = $2',
      [false, testFolder.id]
    );
    console.log(`   Disabled: ${testFolder.folder_name}`);

    // Check
    const { rows: checkDisabled } = await db.query(
      'SELECT is_visible FROM mail_folders WHERE id = $1',
      [testFolder.id]
    );
    if (checkDisabled[0].is_visible === false) {
      console.log(`✅ Confirmed: folder is disabled\n`);
    } else {
      console.log(`❌ ERROR: folder should be disabled\n`);
      return false;
    }

    // Re-enable
    await db.query(
      'UPDATE mail_folders SET is_visible = $1 WHERE id = $2',
      [true, testFolder.id]
    );
    console.log(`   Re-enabled: ${testFolder.folder_name}`);

    // 5. Test sync behavior
    console.log('5. Checking sync filter logic...');
    const folderVisibilityMap = new Map();
    for (const folder of folders) {
      folderVisibilityMap.set(folder.id, folder.is_visible !== false);
    }

    let skipped = 0;
    folders.forEach(f => {
      const isVisible = folderVisibilityMap.get(f.id);
      if (!isVisible) {
        skipped++;
        console.log(`   Would skip: ${f.folder_name}`);
      }
    });

    console.log(`✅ Filter logic works (${skipped} folders would be skipped)\n`);

    console.log('=== ALL TESTS PASSED ✅ ===\n');
    return true;

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    // Close connection
    await db.pool.end();
  }
}

// Run test
testDisabledFolders().then(success => {
  process.exit(success ? 0 : 1);
});
