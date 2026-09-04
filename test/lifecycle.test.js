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
 * A typical downstream component: builds children in initialize(),
 * tracks init/disconnect counts.
 */
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
      const list = this.create('ul', { class: 'items' });
      this.create('li', { content: 'one' }, list);
      this.create('li', { content: 'two' }, list);
    }

    async disconnect() {
      this.disconnectCount++;
    }
  }
  customElements.define(name, TestComponent);
  return { TestComponent, instances };
}

test('initialize() runs once when element is appended to a connected document', async () => {
  const name = uniqueName('lc-basic');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();

  assert.equal(instances[0].initCount, 1);
  assert.equal(el.querySelectorAll('li').length, 2);
  assert.ok(el.classList.contains('dataroom-element'));
});

test('disconnect() runs when element is removed from the page', async () => {
  const name = uniqueName('lc-remove');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();
  el.remove();
  await tick();

  assert.equal(instances[0].disconnectCount, 1);
});

test('re-adding an element to the page does not re-run initialize() or duplicate children', async () => {
  const name = uniqueName('lc-readd');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();
  assert.equal(el.querySelectorAll('li').length, 2);

  el.remove();
  await tick();
  document.body.appendChild(el);
  await tick();

  assert.equal(instances[0].initCount, 1, 'initialize must run exactly once per element');
  assert.equal(el.querySelectorAll('ul.items').length, 1, 'children must not be duplicated after re-adding');
  assert.equal(el.querySelectorAll('li').length, 2);
});

test('moving an element between parents does not duplicate children', async () => {
  const name = uniqueName('lc-move');
  const { instances } = makeComponent(name);

  const parentA = document.createElement('div');
  const parentB = document.createElement('div');
  document.body.append(parentA, parentB);

  const el = document.createElement(name);
  parentA.appendChild(el);
  await tick();

  parentB.appendChild(el); // moves: disconnectedCallback + connectedCallback
  await tick();

  assert.equal(instances[0].initCount, 1);
  assert.equal(el.querySelectorAll('li').length, 2);
});

test('this.content captures the original light-DOM content, not rendered output', async () => {
  const name = uniqueName('lc-content');
  let captured;
  class ContentComponent extends DataroomElement {
    async initialize() {
      captured = this.content;
      this.innerHTML = '';
      this.create('p', { content: 'rendered output' });
    }
  }
  customElements.define(name, ContentComponent);

  const el = document.createElement(name);
  el.textContent = 'original content';
  document.body.appendChild(el);
  await tick();

  assert.equal(captured, 'original content');

  // After removal + re-add, content must still be the ORIGINAL content,
  // not the rendered "rendered output" text.
  el.remove();
  await tick();
  document.body.appendChild(el);
  await tick();
  assert.equal(el.content, 'original content');
});

test('attrs snapshot is available in initialize()', async () => {
  const name = uniqueName('lc-attrs');
  let seen;
  class AttrComponent extends DataroomElement {
    async initialize() {
      seen = { ...this.attrs };
    }
  }
  customElements.define(name, AttrComponent);

  const el = document.createElement(name);
  el.setAttribute('data-id', '42');
  el.setAttribute('data-name', 'test');
  document.body.appendChild(el);
  await tick();

  assert.equal(seen['data-id'], '42');
  assert.equal(seen['data-name'], 'test');
});

test('element created via innerHTML in a connected container initializes', async () => {
  const name = uniqueName('lc-innerhtml');
  const { instances } = makeComponent(name);

  const container = document.createElement('div');
  document.body.appendChild(container);
  container.innerHTML = `<${name}></${name}>`;
  await tick();

  assert.equal(instances.length, 1);
  assert.equal(instances[0].initCount, 1);
});

test('element that already exists in initial page markup initializes on definition (upgrade)', async () => {
  const name = uniqueName('lc-upgrade');
  // Put unresolved markup on the page first, define the class after.
  document.body.insertAdjacentHTML('beforeend', `<${name}></${name}>`);

  const { instances } = makeComponent(name);
  await tick();

  assert.equal(instances.length, 1);
  assert.equal(instances[0].initCount, 1);
  assert.equal(document.querySelector(name).querySelectorAll('li').length, 2);
});

test('attribute observer is disconnected when element leaves the page', async () => {
  const name = uniqueName('lc-observer');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();

  const events = [];
  el.on('NODE-CHANGED', (d) => events.push(d));

  el.remove();
  await tick();

  // Mutating a detached element must not leak observer callbacks.
  el.setAttribute('data-x', '1');
  await tick();
  assert.equal(events.length, 0, 'observer should not fire after disconnect');
});

test('reconnect cycles do not stack MutationObservers (no duplicate NODE-CHANGED)', async () => {
  const name = uniqueName('lc-observer-stack');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();

  for (let i = 0; i < 3; i++) {
    el.remove();
    await tick();
    document.body.appendChild(el);
    await tick();
  }

  const events = [];
  el.on('NODE-CHANGED', (d) => events.push(d));
  el.setAttribute('data-y', 'hello');
  await tick();

  assert.equal(events.length, 1, `expected exactly 1 NODE-CHANGED, got ${events.length}`);
  assert.equal(events[0].attribute, 'data-y');
  assert.equal(events[0].newValue, 'hello');
});

test('NODE-CHANGED reports attribute, oldValue and newValue', async () => {
  const name = uniqueName('lc-node-changed');
  makeComponent(name);

  const el = document.createElement(name);
  el.setAttribute('data-count', '1');
  document.body.appendChild(el);
  await tick();

  const detail = await new Promise((resolve) => {
    el.once('NODE-CHANGED', resolve);
    el.setAttribute('data-count', '2');
  });

  assert.equal(detail.attribute, 'data-count');
  assert.equal(detail.oldValue, '1');
  assert.equal(detail.newValue, '2');
  assert.equal(el.attrs['data-count'], '2');
});

test('preInit() is idempotent and safe to call on detached elements', async () => {
  const name = uniqueName('lc-preinit');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  document.body.appendChild(el);
  await tick();
  assert.equal(instances[0].initCount, 1);

  // Direct re-invocation must not re-initialize or duplicate children.
  await el.preInit();
  assert.equal(instances[0].initCount, 1);
  assert.equal(el.querySelectorAll('li').length, 2);

  // Detached elements must never initialize via preInit.
  const el2 = document.createElement(name);
  await el2.preInit();
  assert.equal(instances[1].initCount, 0);
  assert.equal(el2.childElementCount, 0);
});

test('disconnect hook can clean up without errors across multiple removals', async () => {
  const name = uniqueName('lc-cleanup');
  const { instances } = makeComponent(name);

  const el = document.createElement(name);
  for (let i = 0; i < 3; i++) {
    document.body.appendChild(el);
    await tick();
    el.remove();
    await tick();
  }

  assert.equal(instances[0].disconnectCount, 3);
  assert.equal(instances[0].initCount, 1);
});
