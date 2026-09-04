import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, loadDataroomElement, tick } from './helpers/dom.js';

installDom();
const DataroomElement = await loadDataroomElement();

let counter = 0;
function uniqueName(prefix) {
  return `${prefix}-${counter++}`;
}

test('parent component creating a child custom element initializes the child', async () => {
  const childName = uniqueName('nest-child');
  const parentName = uniqueName('nest-parent');
  let childInits = 0;

  class ChildElement extends DataroomElement {
    async initialize() {
      childInits++;
      this.create('span', { content: 'child content' });
    }
  }
  customElements.define(childName, ChildElement);

  class ParentElement extends DataroomElement {
    async initialize() {
      this.create(childName, { 'data-role': 'nested' });
    }
  }
  customElements.define(parentName, ParentElement);

  const parent = document.createElement(parentName);
  document.body.appendChild(parent);
  await tick();

  const child = parent.querySelector(childName);
  assert.ok(child, 'child element should exist inside parent');
  assert.equal(childInits, 1);
  assert.equal(child.querySelector('span').textContent, 'child content');
});

test('removing the parent disconnects nested children', async () => {
  const childName = uniqueName('nest-rm-child');
  const parentName = uniqueName('nest-rm-parent');
  let childDisconnects = 0;

  class ChildElement extends DataroomElement {
    async initialize() {
      this.create('span', { content: 'x' });
    }
    async disconnect() {
      childDisconnects++;
    }
  }
  customElements.define(childName, ChildElement);

  class ParentElement extends DataroomElement {
    async initialize() {
      const wrapper = this.create('div', { class: 'wrapper' });
      this.create(childName, {}, wrapper);
    }
  }
  customElements.define(parentName, ParentElement);

  const parent = document.createElement(parentName);
  document.body.appendChild(parent);
  await tick();

  parent.remove();
  await tick();
  assert.equal(childDisconnects, 1);
});

test('deeply nested submodules (3 levels) all initialize exactly once', async () => {
  const grandchildName = uniqueName('nest-gc');
  const childName = uniqueName('nest-c');
  const parentName = uniqueName('nest-p');
  const inits = { parent: 0, child: 0, grandchild: 0 };

  class Grandchild extends DataroomElement {
    async initialize() {
      inits.grandchild++;
    }
  }
  class Child extends DataroomElement {
    async initialize() {
      inits.child++;
      this.create(grandchildName, {});
    }
  }
  class Parent extends DataroomElement {
    async initialize() {
      inits.parent++;
      this.create(childName, {});
    }
  }
  customElements.define(grandchildName, Grandchild);
  customElements.define(childName, Child);
  customElements.define(parentName, Parent);

  const parent = document.createElement(parentName);
  document.body.appendChild(parent);
  await tick();
  await tick();

  assert.deepEqual(inits, { parent: 1, child: 1, grandchild: 1 });

  // Move the whole subtree: nothing should re-initialize or duplicate.
  const newHost = document.createElement('section');
  document.body.appendChild(newHost);
  newHost.appendChild(parent);
  await tick();

  assert.deepEqual(inits, { parent: 1, child: 1, grandchild: 1 });
});

test('children added dynamically after parent initialization still initialize', async () => {
  const childName = uniqueName('nest-dyn-child');
  const parentName = uniqueName('nest-dyn-parent');
  let childInits = 0;

  class Child extends DataroomElement {
    async initialize() {
      childInits++;
    }
  }
  customElements.define(childName, Child);

  class Parent extends DataroomElement {
    async initialize() {
      this.create('p', { content: 'parent ready' });
    }
    addChild() {
      return this.create(childName, {});
    }
  }
  customElements.define(parentName, Parent);

  const parent = document.createElement(parentName);
  document.body.appendChild(parent);
  await tick();
  assert.equal(childInits, 0);

  parent.addChild();
  await tick();
  assert.equal(childInits, 1);
});

test('multiple sibling instances are independent', async () => {
  const name = uniqueName('nest-siblings');
  const inits = [];
  class Item extends DataroomElement {
    async initialize() {
      inits.push(this.getAttribute('data-id'));
    }
  }
  customElements.define(name, Item);

  const list = document.createElement('div');
  document.body.appendChild(list);
  for (const id of ['a', 'b', 'c']) {
  const el = document.createElement(name);
    el.setAttribute('data-id', id);
    list.appendChild(el);
  }
  await tick();

  assert.deepEqual(inits.sort(), ['a', 'b', 'c']);
});

test('child custom element declared in static markup inside a parent initializes on upgrade', async () => {
  const childName = uniqueName('nest-static-child');
  const parentName = uniqueName('nest-static-parent');

  // Markup exists before either class is defined.
  document.body.insertAdjacentHTML(
    'beforeend',
    `<${parentName}><div class="slot"><${childName}></${childName}></div></${parentName}>`,
  );

  let childInits = 0;
  let parentInits = 0;

  class Child extends DataroomElement {
    async initialize() {
      childInits++;
    }
  }
  class Parent extends DataroomElement {
    async initialize() {
      parentInits++;
      // Parent must not clobber pre-existing light-DOM children.
      assert.ok(this.querySelector(childName), 'static child should be present');
    }
  }
  customElements.define(childName, Child);
  customElements.define(parentName, Parent);
  await tick();

  assert.equal(parentInits, 1);
  assert.equal(childInits, 1);
});

test('parent can listen to events emitted by a nested child', async () => {
  const childName = uniqueName('nest-ev-child');
  const parentName = uniqueName('nest-ev-parent');

  class Child extends DataroomElement {
    async initialize() {}
    ping() {
      this.event('child-ping', { ok: true });
    }
  }
  customElements.define(childName, Child);

  class Parent extends DataroomElement {
    async initialize() {
      this.create(childName, {});
    }
  }
  customElements.define(parentName, Parent);

  const parent = document.createElement(parentName);
  document.body.appendChild(parent);
  await tick();

  const child = parent.querySelector(childName);
  const detail = await new Promise((resolve) => {
    child.on('child-ping', resolve);
    child.ping();
  });
  assert.deepEqual(detail, { ok: true });
});
