/**
 * Jest setup file - runs before each test file.
 *
 * This file configures the testing environment with:
 * - Extended matchers from @testing-library/jest-dom
 * - Mock implementations for browser APIs not available in jsdom
 */

// Extend Jest matchers with DOM-specific assertions
require('@testing-library/jest-dom');

// Mock localStorage for tests that need it
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock TextDecoder/TextEncoder if not available
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

// Mock ReadableStream if not available
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = require('stream/web').ReadableStream;
}

// Silence console warnings during tests (optional - comment out for debugging)
// console.warn = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
