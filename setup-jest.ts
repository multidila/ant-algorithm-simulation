import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ngMocks } from 'ng-mocks';

// Initialize Angular test environment with teardown behaviour
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
	teardown: { destroyAfterEach: true },
});

// Automatically create Jest spies for ng-mocks utilities
ngMocks.autoSpy('jest');

// Silence console.warn in test output
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Global mocks for browser-specific APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));
