const db = require('../db');

async function update() {
  try {
    const { rows } = await db.query(
      "SELECT value FROM module_settings WHERE module_id = $1 AND setting_key = $2",
      ['contractors', 'bulk_edit_fields']
    );
    
    if (rows.length === 0) {
      console.log('Settings not found');
      process.exit(0);
    }
    
    const config = rows[0].value;
    config.fields = config.fields.map(f => {
      if (f.id === 'legal_form' || f.id === 'legalForm') {
        return {
          ...f,
          id: 'groupId',
          label: 'Группа (вкладка)',
          dataSource: 'legalFormGroups',
          columnName: 'group_id'
        };
      }
      return f;
    });
    
    await db.query(
      "UPDATE module_settings SET value = $1 WHERE module_id = $2 AND setting_key = $3",
      [config, 'contractors', 'bulk_edit_fields']
    );
    
    console.log('✅ Bulk edit settings updated for contractors');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating bulk edit settings:', err);
    process.exit(1);
  }
}

update();
