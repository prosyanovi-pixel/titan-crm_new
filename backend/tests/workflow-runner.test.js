const test = require('node:test');
const assert = require('node:assert');
const WorkflowRunner = require('../modules/workflow/engine/workflowRunner');

test('WorkflowRunner - evaluateCondition', async (t) => {
  const runner = new WorkflowRunner();
  const context = {
    step1: { count: 5, status: 'active', name: 'Titan' },
    trigger: { amount: 100 }
  };

  await t.test('equals operator', () => {
    assert.strictEqual(runner.evaluateCondition({ field: 'step1.count', operator: 'equals', value: 5 }, context), true);
    assert.strictEqual(runner.evaluateCondition({ field: 'step1.count', operator: 'equals', value: 6 }, context), false);
  });

  await t.test('gt/lt operators', () => {
    assert.strictEqual(runner.evaluateCondition({ field: 'trigger.amount', operator: 'gt', value: 50 }, context), true);
    assert.strictEqual(runner.evaluateCondition({ field: 'trigger.amount', operator: 'lt', value: 50 }, context), false);
  });

  await t.test('exists operator', () => {
    assert.strictEqual(runner.evaluateCondition({ field: 'step1.name', operator: 'exists' }, context), true);
    assert.strictEqual(runner.evaluateCondition({ field: 'step1.missing', operator: 'exists' }, context), false);
  });

  await t.test('contains operator', () => {
    assert.strictEqual(runner.evaluateCondition({ field: 'step1.name', operator: 'contains', value: 'it' }, context), true);
    assert.strictEqual(runner.evaluateCondition({ field: 'step1.name', operator: 'contains', value: 'abc' }, context), false);
  });
});

test('WorkflowRunner - resolvePath', (t) => {
  const runner = new WorkflowRunner();
  const obj = { a: { b: { c: 42 } }, items: [{ id: 1 }, { id: 2 }] };

  assert.strictEqual(runner.resolvePath('a.b.c', obj), 42);
  assert.strictEqual(runner.resolvePath('items.1.id', obj), 2);
  assert.strictEqual(runner.resolvePath('missing.path', obj), undefined);
});

test('WorkflowRunner - parseContextVariables', (t) => {
  const runner = new WorkflowRunner();
  const context = { step1: { id: 'wf_123' }, user: 'admin' };
  const config = {
    message: 'Task created for {{step1.id}}',
    assignedTo: '{{user}}',
    nested: { val: '{{missing}}' }
  };

  const parsed = runner.parseContextVariables(config, context);
  assert.strictEqual(parsed.message, 'Task created for wf_123');
  assert.strictEqual(parsed.assignedTo, 'admin');
  assert.strictEqual(parsed.nested.val, '{{missing}}'); // Should remain if missing
});
