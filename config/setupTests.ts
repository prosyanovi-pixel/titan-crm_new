import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = ((fn: any, ...args: any[]) => setTimeout(fn, 0, ...args)) as any;
}
