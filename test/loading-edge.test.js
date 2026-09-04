import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, loadDataroomElement, tick } from './helpers/dom.js';

installDom();
const DataroomElement = await loadDataroomElement();

let counter = 0;
function uniqueName(prefix) {
  return `${prefix}-${counter++}`;
}

/**
 * jsdom never runs connectedCallback with document.readyState === 'loading'
 * for parser-created or script-appended elements (custom element reactions
 * flush after parsing), so these tests mock document.readyState to
 * deterministically exercise the DOMContentLoaded deferral branch.
 */
function mockReadyState(initial) {
  let value = initial;
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    get: () => value,
  });
  return {
    set(v) {
      value = v;
    },
    fireDomContentLoaded() {
      document.dispatchEvent(new window.Event('DOMContentLoaded'));
    },
    restore() {
      delete document.readyState;
    },
  };
}

function makeComponent(name) {
  const instances = [];
  class TestComponent extends DataroomElement {
    constructor() {
      super();
      this.initCount = 0;
      this.disconnectCount = 0;
      instances.push(this);
    }
    async initialize() {
      this.initCount++;
      this.create('span', { content: 'ready' });
    }
    async disconnect() {
      this.disconnectCount++;
    }
  }
  customElements.define(name, TestComponent);
  return { instances };
}

test('connectedCallback while loading defers initialization until DOMContentLoaded', async () => {
  const name = uniqueName('ls-defer');
  const { instances } = makeComponent(name);
  const rs = mockReadyState('loading');

  try {
    const el = document.createElement(name);
    document.body.appendChild(el);
    await tick();

    assert.equal(instances[0].initCount, 0, 'must not initialize while the document is loading');
    assert.equal(el.childElementCount, 0);

    rs.set('interactive');
    rs.fireDomContentLoaded();
    await tick();

    assert.equal(instances[0].initCount, 1, 'must initialize exactly once on DOMContentLoaded');
    assert.equal(el.querySelectorAll('span').length, 1);
  } finally {
    rs.restore();
  }
});

test('element removed while loading never initializes and removes cleanly', async () => {
  const name = uniqueName('ls-removed');
  const { instances } = makeComponent(name);
  const rs = mockReadyState('loading');

  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.message));

  try {
    const el = document.createElement(name);
    document.body.appendChild(el);

    el.remove();
    await tick();
    assert.equal(instances[0].disconnectCount, 0, 'disconnect hook must not run when initialize never ran');

    rs.set('interactive');
    rs.fireDomContentLoaded();
    await tick();

    assert.equal(instances[0].initCount, 0, 'detached element must never initialize');
    assert.equal(instances[0].disconnectCount, 0);
    assert.deepEqual(errors, [], 'removal must not report errors from lifecycle callbacks');
  } finally {
    rs.restore();
  }
});

test('element re-parented while loading initializes exactly once', async () => {
  const name = uniqueName('ls-mover');
  const { instances } = makeComponent(name);
  const rs = mockReadyState('loading');

  try {
    const hostA = document.createElement('div');
    const hostB = document.createElement('div');
    document.body.append(hostA, hostB);

    const el = document.createElement(name);
    hostA.appendChild(el);
    hostB.appendChild(el); // disconnect + reconnect, still loading

    rs.set('interactive');
    rs.fireDomContentLoaded();
    await tick();

    assert.equal(instances[0].initCount, 1);
    assert.equal(el.querySelectorAll('span').length, 1);
  } finally {
    rs.restore();
  }
});

test('after the document has loaded, new elements initialize immediately without DOMContentLoaded', async () => {
  const name = uniqueName('ls-complete');
  const { instances } = makeComponent(name);

  // readyState is genuinely 'complete' in this document.
  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();

  assert.equal(instances[0].initCount, 1);
});
