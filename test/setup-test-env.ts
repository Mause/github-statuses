import "@testing-library/jest-dom";
import { act } from "@testing-library/react";
import { JSDOM } from "jsdom";
import {
  configMocks,
  mockIntersectionObserver,
  mockResizeObserver,
} from "jsdom-testing-mocks";

// Workaround: For some reason FormData is not set to jsdom's by default
const jsdom = new JSDOM(`<!doctype html>`);
const { FormData } = jsdom.window;
window.FormData = FormData;
global.FormData = FormData;

function supports(conditionText: string): boolean;
function supports(property: string, value: string): boolean;
function supports(conditionText: string): boolean {
  return false;
}

global.CSS = { supports } as typeof CSS;
global.matchMedia ??= (() => ({
  addEventListener: () => {},
  removeEventListener: () => {},
})) as unknown as typeof window.matchMedia;

configMocks({ act, beforeAll, beforeEach, afterEach, afterAll });
mockIntersectionObserver();
mockResizeObserver();
