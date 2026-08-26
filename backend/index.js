
const express = require('express');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, 'env') });
const { initializeRuntimeServices } = require('./utils/startupServices');
const { validateStartupPrerequisites } = require('./utils/startupPreflight');
const { configureApplication } = require('./utils/appComposition');

const app = express();
const server = http.createServer(app);
let PORT;

const { initializeModules } = require('./utils/moduleSettingsLoader');

(async () => {
  try {
    PORT = await validateStartupPrerequisites();
    
    // Configure application (async now)
    await configureApplication(app);
  } catch (error) {
    console.error('❌ Backend startup error:', error);
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Initialize module settings
    try {
      await initializeModules();
    } catch (error) {
      console.warn('Warning: Module settings initialization failed:', error.message);
    }

    await initializeRuntimeServices(server);
  });
})();
