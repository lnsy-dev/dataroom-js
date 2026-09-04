import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, loadDataroomElement, tick } from './helpers/dom.js';

installDom();
const DataroomElement = await loadDataroomElement();

let counter = 0;
function uniqueName(prefix) {
  return `${prefix}-${counter++}`;
}

async function mount(Class, attrs = {}) {
  const name = uniqueName('api');
  customElements.define(name, Class);
  const el = document.createElement(name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  await tick();
  return el;
}

test('create() appends to the component by default and sets attributes', async () => {
  class C extends DataroomElement {
    async initialize() {
      this.create('div', { class: 'box', 'data-x': '1', id: 'target' });
    }
  }
  const el = await mount(C);
  const div = el.querySelector('div.box');
  assert.ok(div);
  assert.equal(div.getAttribute('data-x'), '1');
  assert.equal(div.id, 'target');
});

test('create() appends to an explicit target element', async () => {
  class C extends DataroomElement {
    async initialize() {
      const outer = this.create('div', { class: 'outer' });
      this.create('span', { content: 'inner' }, outer);
    }
  }
  const el = await mount(C);
  assert.equal(el.querySelector('.outer > span').textContent, 'inner');
});

test('create() content key sets innerHTML', async () => {
  class C extends DataroomElement {
    async initialize() {
      this.create('div', { content: '<b>bold</b> text' });
    }
  }
  const el = await mount(C);
  assert.equal(el.querySelector('div b').textContent, 'bold');
});

test('event()/on() pass detail payloads', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);
  const detail = await new Promise((resolve) => {
    el.on('my-event', resolve);
    el.event('my-event', { value: 42 });
  });
  assert.deepEqual(detail, { value: 42 });
});

test('once() fires exactly one time', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);
  let count = 0;
  el.once('single', () => count++);
  el.event('single');
  el.event('single');
  el.event('single');
  assert.equal(count, 1);
});

test('setAttrs() sets multiple attributes and updates this.attrs', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);
  await el.setAttrs({ 'data-a': '1', 'data-b': '2' });
  await tick();

  assert.equal(el.getAttribute('data-a'), '1');
  assert.equal(el.getAttribute('data-b'), '2');
  assert.equal(el.attrs['data-a'], '1');
  assert.equal(el.attrs['data-b'], '2');
});

test('setAttrs() does not throw when the subclass defines no render() method', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);
  await assert.doesNotReject(() => el.setAttrs({ 'data-z': '9' }));
});

test('setAttrs() calls render() when the subclass defines one', async () => {
  class C extends DataroomElement {
    constructor() {
      super();
      this.renders = 0;
    }
    async initialize() {}
    render() {
      this.renders++;
    }
  }
  const el = await mount(C);
  await el.setAttrs({ 'data-z': '9' });
  assert.equal(el.renders, 1);
});

test('log() emits status-update events and respects the verbose flag', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C, { id: 'my-id' });

  const updates = [];
  el.on('status-update', (m) => updates.push(m));
  el.log('hello');

  assert.deepEqual(updates, ['hello']);
});

test('verbose="true" forwards internal log messages to console.log', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const name = uniqueName('api-verbose');
  customElements.define(name, C);

  const calls = [];
  const originalLog = console.log;
  console.log = (...args) => calls.push(args);

  const el = document.createElement(name);
  const updates = [];
  try {
    el.setAttribute('id', 'verbose-el');
    el.setAttribute('verbose', 'true');
    el.on('status-update', (m) => updates.push(m));
    document.body.appendChild(el);
    await tick();
    el.create('div', { class: 'verbose-child' });
    await el.setAttrs({ 'data-x': '1' });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
    try {
      await el.getJSON('/verbose-config.json');
    } finally {
      globalThis.fetch = originalFetch;
    }

    el.log('custom-check');
    el.remove();
    await tick();
  } finally {
    console.log = originalLog;
  }

  const messages = calls.map((args) => args[2]);
  assert.ok(messages.includes('observing attribute changes'));
  assert.ok(messages.includes('Creating a new Element of div'));
  assert.ok(messages.includes('Fetching JSON from: /verbose-config.json'));
  assert.ok(messages.includes('setting attrs:'));
  assert.ok(messages.includes('disconnecting...'));

  // Verbose mode must still emit status-update events.
  assert.ok(updates.includes('custom-check'));

  const manual = calls.find((args) => args[2] === 'custom-check');
  assert.deepEqual(manual, ['verbose-el', 'says:', 'custom-check']);
});

test('elements without the verbose attribute do not write to console.log', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const calls = [];
  const originalLog = console.log;
  console.log = (...args) => calls.push(args);
  try {
    el.log('quiet');
    await el.setAttrs({ 'data-q': '1' });
  } finally {
    console.log = originalLog;
  }
  assert.equal(calls.length, 0);
});

test('call() POSTs JSON and returns the parsed response', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const originalFetch = globalThis.fetch;
  let seenRequest;
  globalThis.fetch = async (url, options) => {
    seenRequest = { url, options };
    return {
      ok: true,
      json: async () => ({ result: 'ok' }),
    };
  };
  try {
    const res = await el.call('/api/thing', { a: 1 });
    assert.deepEqual(res, { result: 'ok' });
    assert.equal(seenRequest.options.method, 'post');
    assert.equal(seenRequest.options.headers['Content-Type'], 'application/json');
    assert.equal(JSON.parse(seenRequest.options.body).a, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('call() attaches a bearer token when security-scheme is localstorage', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C, { 'security-scheme': 'localstorage' });
  localStorage.setItem('bearer-token', 'tok123');

  const originalFetch = globalThis.fetch;
  let headers;
  globalThis.fetch = async (url, options) => {
    headers = options.headers;
    return { ok: true, json: async () => ({}) };
  };
  try {
    await el.call('/api/secure');
    assert.equal(headers['Authorization'], 'Bearer tok123');
  } finally {
    globalThis.fetch = originalFetch;
    localStorage.removeItem('bearer-token');
  }
});

test('call() sends no Authorization header without a security-scheme', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const originalFetch = globalThis.fetch;
  let headers;
  globalThis.fetch = async (url, options) => {
    headers = options.headers;
    return { ok: true, json: async () => ({}) };
  };
  try {
    await el.call('/api/open');
    assert.equal(headers['Authorization'], undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('call() does not arm an abort timer when no call-timeout is set', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const originalFetch = globalThis.fetch;
  let signal;
  globalThis.fetch = async (url, options) => {
    signal = options.signal;
    return { ok: true, json: async () => ({}) };
  };
  try {
    await el.call('/api/thing');
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(signal.aborted, false, 'request must not be aborted when no timeout is configured');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('call() throws on HTTP errors', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  try {
    await assert.rejects(() => el.call('/api/broken'), /HTTP error! status: 500/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('call() converts aborts into "Request timed out" errors', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C, { 'call-timeout': '10' });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, options) =>
    new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
  try {
    await assert.rejects(() => el.call('/api/slow'), /Request timed out/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getJSON() fetches and parses JSON', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ hello: 'world' }),
  });
  try {
    const data = await el.getJSON('/config.json');
    assert.deepEqual(data, { hello: 'world' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getJSON() throws descriptive errors for HTTP and network failures', async () => {
  class C extends DataroomElement {
    async initialize() {}
  }
  const el = await mount(C);

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 404, statusText: 'Not Found' });
    await assert.rejects(() => el.getJSON('/missing.json'), /HTTP error! status: 404/);

    globalThis.fetch = async () => {
      throw new Error('socket hangup');
    };
    await assert.rejects(() => el.getJSON('/down.json'), /Network error/);

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => {
        throw new Error('bad json');
      },
    });
    await assert.rejects(() => el.getJSON('/bad.json'), /Failed to parse JSON/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
