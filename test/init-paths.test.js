import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

/**
 * These tests exercise the DOMContentLoaded ("loading") initialization
 * path of connectedCallback. They need a real parser running scripts,
 * so they build their own JSDOM instances with runScripts: 'dangerously'
 * and inject the library source inline (transformed from ESM to a
 * classic script that assigns to window.DataroomElement).
 */
const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const classicSrc = src.replace(
  /export\s+default\s+class\s+DataroomElement/,
  'class DataroomElement',
) + '\nwindow.DataroomElement = DataroomElement;\n';

function buildPage(bodyHtml, headScript = '') {
  return new JSDOM(
    `<!DOCTYPE html><html><head>
      <script>${classicSrc}</script>
      <script>${headScript}</script>
    </head><body>${bodyHtml}</body></html>`,
    { runScripts: 'dangerously', url: 'https://localhost/' },
  );
}

function waitFor(dom, eventName) {
  return new Promise((resolve) => {
    dom.window.document.addEventListener(eventName, resolve, { once: true });
  });
}

test('element defined during parsing initializes via DOMContentLoaded path, exactly once', async () => {
  const dom = buildPage(
    `<parser-el></parser-el>`,
    `
    class ParserEl extends window.DataroomElement {
      async initialize() {
        window.__initCount = (window.__initCount || 0) + 1;
        this.create('p', { content: 'ready' });
      }
    }
    customElements.define('parser-el', ParserEl);
    `,
  );

  assert.equal(dom.window.document.readyState, 'loading');
  await waitFor(dom, 'DOMContentLoaded');
  // preInit is async; give it a turn.
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(dom.window.__initCount, 1);
  assert.equal(dom.window.document.querySelectorAll('parser-el p').length, 1);
});

test('element removed before DOMContentLoaded never initializes', async () => {
  const dom = buildPage(
    `<removed-el></removed-el>
     <script>document.querySelector('removed-el').remove();</script>`,
    `
    class RemovedEl extends window.DataroomElement {
      async initialize() {
        window.__removedInit = (window.__removedInit || 0) + 1;
      }
    }
    customElements.define('removed-el', RemovedEl);
    `,
  );

  await waitFor(dom, 'DOMContentLoaded');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(dom.window.__removedInit || 0, 0, 'detached element must not initialize after DOMContentLoaded');
});

test('element re-parented before DOMContentLoaded still initializes only once', async () => {
  const dom = buildPage(
    `<div id="a"><mover-el></mover-el></div><div id="b"></div>
     <script>
       // Reparent while still loading: triggers disconnect + reconnect.
       const el = document.querySelector('mover-el');
       document.getElementById('b').appendChild(el);
     </script>`,
    `
    class MoverEl extends window.DataroomElement {
      async initialize() {
        window.__moverInit = (window.__moverInit || 0) + 1;
        this.create('span', { content: 'moved' });
      }
    }
    customElements.define('mover-el', MoverEl);
    `,
  );

  await waitFor(dom, 'DOMContentLoaded');
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(dom.window.__moverInit, 1);
  assert.equal(dom.window.document.querySelectorAll('mover-el span').length, 1);
});

test('multiple distinct custom elements on one page each initialize once', async () => {
  const dom = buildPage(
    `<multi-a></multi-a><multi-b></multi-b><multi-a></multi-a>`,
    `
    class MultiA extends window.DataroomElement {
      async initialize() { window.__a = (window.__a || 0) + 1; }
    }
    class MultiB extends window.DataroomElement {
      async initialize() { window.__b = (window.__b || 0) + 1; }
    }
    customElements.define('multi-a', MultiA);
    customElements.define('multi-b', MultiB);
    `,
  );

  await waitFor(dom, 'DOMContentLoaded');
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(dom.window.__a, 2);
  assert.equal(dom.window.__b, 1);
});
