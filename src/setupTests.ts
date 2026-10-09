/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';

Object.assign(global, { ANALYTICS_ENABLED: false, EXTENSION_VERSION: 'test' });
