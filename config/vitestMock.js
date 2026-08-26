/**
 * Jest shim for vitest imports.
 * When tests import from 'vitest', Jest redirects here to provide equivalent globals.
 */
const { describe, it, test, expect, beforeAll, afterAll, beforeEach, afterEach } = global;

const vi = {
  fn: jest.fn.bind(jest),
  spyOn: jest.spyOn.bind(jest),
  mock: jest.mock.bind(jest),
  clearAllMocks: jest.clearAllMocks.bind(jest),
  resetAllMocks: jest.resetAllMocks.bind(jest),
  restoreAllMocks: jest.restoreAllMocks.bind(jest),
  useFakeTimers: jest.useFakeTimers.bind(jest),
  useRealTimers: jest.useRealTimers.bind(jest),
  runAllTimers: jest.runAllTimers.bind(jest),
  runAllTimersAsync: jest.runAllTimersAsync ? jest.runAllTimersAsync.bind(jest) : () => Promise.resolve(),
  advanceTimersByTime: jest.advanceTimersByTime.bind(jest),
  mocked: (fn) => fn,
};

module.exports = {
  describe,
  it,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
};
