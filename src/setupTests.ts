import '@testing-library/jest-dom';
import { chrome } from 'jest-chrome';

Object.assign(global, { chrome: chrome, browser: chrome });

Object.assign(global, { ANALYTICS_ENABLED: false, EXTENSION_VERSION: 'test' });
