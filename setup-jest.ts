import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Note: BrowserDynamicTestingModule and platformBrowserDynamicTesting are deprecated
// in Angular 20+, but are still required for Jest/TestBed initialization.
// Alternative modern approaches are not yet fully compatible with jest-preset-angular.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
