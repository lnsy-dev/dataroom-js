import { JSDOM } from 'jsdom';

/**
 * Installs a fresh jsdom environment onto globalThis so that
 * src/index.js (which extends HTMLElement and touches document at
 * class-definition / connection time) can be imported in Node.
 *
 * Each test file runs in its own process under `node --test`, so a
 * per-file global DOM is safe. Call `installDom()` BEFORE importing
 * src/index.js.
 */
export function installDom(html = '<!DOCTYPE html><html><body></body></html>') {
  const dom = new JSDOM(html, { url: 'https://localhost/' });
  const { window } = dom;

  const globals = [
    'window',
    'document',
    'HTMLElement',
    'HTMLHeadElement',
    'HTMLBodyElement',
    'CustomEvent',
    'MutationObserver',
    'Node',
    'customElements',
    'localStorage',
    'AbortController',
  ];

  for (const key of globals) {
    if (window[key] !== undefined) {
      try {
        globalThis[key] = window[key];
      } catch {
        Object.defineProperty(globalThis, key, {
          value: window[key],
          configurable: true,
          writable: true,
        });
      }
    }
  }

  // jsdom does not implement innerText; DataroomElement reads it in
  // preInit. Polyfill it as textContent so content capture is testable.
  if (!('innerText' in window.HTMLElement.prototype)) {
    Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      },
      configurable: true,
    });
  }

  return dom;
}

/** Flush pending microtasks + MutationObserver deliveries. */
export function tick(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Loads DataroomElement with the current globals. Imported dynamically
 * so callers can install the DOM first.
 */
export async function loadDataroomElement() {
  const mod = await import('../../src/index.js');
  return mod.default;
}
