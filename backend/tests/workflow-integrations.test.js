const test = require('node:test');
const assert = require('node:assert');
const registry = require('../modules/workflow/engine/workflowRegistry');

test('Workflow Integrations - Registry loading', async (t) => {
  await registry.loadActions();

  await t.test('Telegram Action is registered', () => {
    const action = registry.getAction('telegram', 'send_message');
    assert.ok(action, 'Telegram send_message action should exist');
    assert.strictEqual(action.module, 'telegram');
    assert.ok(action.inputSchema.properties.chat_id, 'Should require chat_id');
    assert.ok(action.inputSchema.properties.message, 'Should require message');
  });

  await t.test('Documents PDF Action is registered', () => {
    const action = registry.getAction('documents', 'generate_pdf');
    assert.ok(action, 'Documents generate_pdf action should exist');
    assert.strictEqual(action.module, 'documents');
    assert.ok(action.inputSchema.properties.template_json, 'Should require template_json');
  });

  await t.test('Core Engine Actions are registered', () => {
    const delayAction = registry.getAction('core', 'delay');
    assert.ok(delayAction, 'core.delay action should exist');
    
    const approvalAction = registry.getAction('core', 'human_approval');
    assert.ok(approvalAction, 'core.human_approval action should exist');
  });
});
