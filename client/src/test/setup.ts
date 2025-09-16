import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';
import React from 'react';

// Make React available globally for JSX
global.React = React;

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});