const fs = require('fs');
const path = require('path');

class WorkflowRegistry {
  constructor() {
    this.actions = new Map(); // module.action -> actionConfig
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Initializes the registry by scanning all modules in the backend/modules folder
   * and looking for a workflow.js file that exports actions.
   */
  async loadActions() {
    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    // Return immediately if already loaded
    if (this.isLoaded) {
      return;
    }

    // Create promise for current load operation
    this.loadingPromise = (async () => {
      this.actions.clear();
      const modulesDir = path.resolve(__dirname, '../../');
      const modules = fs.readdirSync(modulesDir).filter(f => fs.statSync(path.join(modulesDir, f)).isDirectory());

      for (const moduleName of modules) {
        if (moduleName === 'workflow') continue; // Skip self
        const workflowFilePath = path.join(modulesDir, moduleName, 'workflow.js');
        if (fs.existsSync(workflowFilePath)) {
          try {
            const moduleWorkflow = require(workflowFilePath);
            if (!moduleWorkflow || !moduleWorkflow.actions) continue;

            const actionsObj = moduleWorkflow.actions;

            // Support both object format {actionName: {label, handler, inputSchema}}
            // and legacy array format [{name, module, handler}]
            if (Array.isArray(actionsObj)) {
              actionsObj.forEach(action => {
                const actionKey = `${moduleName}.${action.name}`;
                this.actions.set(actionKey, { ...action, module: moduleName });
              });
              console.log(`[WorkflowRegistry] Loaded ${actionsObj.length} actions from module: ${moduleName}`);
            } else if (typeof actionsObj === 'object') {
              let count = 0;
              for (const [actionName, actionDef] of Object.entries(actionsObj)) {
                const actionKey = `${moduleName}.${actionName}`;
                this.actions.set(actionKey, {
                  name: actionName,
                  module: moduleName,
                  label: actionDef.label || actionName,
                  inputSchema: actionDef.inputSchema || {},
                  outputSchema: actionDef.outputSchema || {},
                  handler: actionDef.handler,
                  isReadOnly: actionDef.isReadOnly || false,
                });
                count++;
              }
              console.log(`[WorkflowRegistry] Loaded ${count} actions from module: ${moduleName}`);
            }
          } catch (error) {
            // Log workflow loading errors in-memory (logger may not be available during initialization)
            console.error(`[WorkflowRegistry] Error loading workflow.js for module ${moduleName}:`, error.message);
          }
        }
      }

      // Built-in Workflow Engine Actions
      this.actions.set('core.human_approval', {
        name: 'human_approval',
        module: 'core',
        label: 'Ожидание утверждения (Human-in-the-Loop)',
        inputSchema: {
          properties: {
            message: { type: 'string', label: 'Сообщение для утверждения', description: 'Что именно нужно утвердить?' },
            approver_role: { type: 'string', label: 'Роль утверждающего', default: 'admin' }
          }
        },
        outputSchema: {
          properties: {
            approved: { type: 'boolean', label: 'Утверждено' },
            approver_id: { type: 'string', label: 'ID утвердившего' },
            comment: { type: 'string', label: 'Комментарий' }
          }
        },
        handler: async (config, context, logger) => {
          return { status: 'waiting' };
        },
        isReadOnly: false
      });

      this.actions.set('core.delay', {
        name: 'delay',
        module: 'core',
        label: 'Задержка / Ожидание',
        inputSchema: {
          properties: {
            delay_minutes: { type: 'number', label: 'Задержка (в минутах)', default: 60 }
          }
        },
        outputSchema: {},
        handler: async (config) => {
           return { slept: config.delay_minutes };
        }
      });

      this.isLoaded = true;
      this.loadingPromise = null;
    })();

    await this.loadingPromise;
  }

  /**
   * Returns all registered actions (grouped by module or flat list)
   */
  getAllActions() {
    return Array.from(this.actions.values());
  }

  /**
   * Retrieves a specific action by module and name
   */
  getAction(module, name) {
    return this.actions.get(`${module}.${name}`);
  }
}

// Export as singleton
module.exports = new WorkflowRegistry();
