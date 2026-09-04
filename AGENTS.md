# AGENTS.md - DataroomElement Guide for AI Agents

## Table of Contents

1. [Purpose](#purpose)
2. [Installation](#installation)
3. [Quick Reference for AI Agents](#quick-reference-for-ai-agents)
4. [Core Concepts](#core-concepts)
5. [Pattern Library](#pattern-library)
   - [Data-Driven Components](#data-driven-components)
   - [Interactive Widgets](#interactive-widgets)
   - [API Integration Patterns](#api-integration-patterns)
   - [Component Composition](#component-composition)
   - [Advanced Patterns](#advanced-patterns)
6. [Anti-Patterns Summary](#anti-patterns-summary)
7. [Complete Examples](#complete-examples)
8. [Tips for AI Agents](#tips-for-ai-agents)

---

## Purpose

This document is designed specifically for Large Language Models (AI agents) to understand and generate code using the **DataroomElement** framework. DataroomElement is a custom HTML element base class that extends the native Web Components API with convenient helpers for building interactive data visualization and UI components.

**Target Audience**: AI agents generating JavaScript code for web applications.

---

## Installation

### Primary Method: npm

```bash
npm install dataroom-js --save
```

### Import Statement (Always use this in your code)

```javascript
import DataroomElement from 'dataroom-js';
```

### Alternative: CDN (Secondary option)

```javascript
import DataroomElement from 'https://unpkg.com/dataroom-js@0.7.6/src/index.js';
```

**Note for AI Agents**: Always prefer the npm import in generated code unless the user specifically requests CDN usage.

---

## Quick Reference for AI Agents

### What is DataroomElement?

DataroomElement is a base class that extends `HTMLElement` with helper methods for creating elements, managing events, and fetching data without using native DOM APIs directly.

### Available Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `create(type, attributes, target_el)` | `HTMLElement` | Create and append HTML elements |
| `event(name, detail)` | `void` | Emit custom events |
| `on(name, cb)` | `void` | Listen for custom events |
| `once(name, cb)` | `void` | Listen for custom events (one-time) |
| `call(endpoint, body)` | `Promise<object>` | Make POST requests with auth |
| `getJSON(url)` | `Promise<object>` | Fetch and parse JSON files |
| `log(message)` | `void` | Log messages (when verbose=true) |
| `setAttrs(data)` | `Promise<void>` | Set multiple attributes |
| `initialize()` | `Promise<void>` | Lifecycle: component setup (override this) |
| `disconnect()` | `Promise<void>` | Lifecycle: component cleanup (override this) |

### Key Principles (CRITICAL)

✅ **DO**:
- Use `this.create()` to create elements
- Use `this.event()` to emit events
- Use `this.on()` or `this.once()` to listen for events
- Import from `'dataroom-js'` in all code
- Override `initialize()` for setup logic
- Override `disconnect()` for cleanup logic

❌ **DON'T**:
- Never use `document.createElement()` - use `this.create()` instead
- Never use `new CustomEvent()` or `dispatchEvent()` - use `this.event()` instead
- Never use Shadow DOM - DataroomElement doesn't support it
- Never use native `addEventListener()` for custom events - use `this.on()` instead

---

## Core Concepts

### 1. Lifecycle Methods

DataroomElement provides two lifecycle hooks:

#### `initialize()`
Called when the component is connected to the DOM and ready. Override this method to set up your component.

```javascript
import DataroomElement from 'dataroom-js';

class MyComponent extends DataroomElement {
  async initialize() {
    // Your setup code here
    this.log('Component initialized');
  }
}

customElements.define('my-component', MyComponent);
```

#### `disconnect()`
Called when the component is removed from the DOM. Override this for cleanup.

```javascript
import DataroomElement from 'dataroom-js';

class MyComponent extends DataroomElement {
  async disconnect() {
    // Cleanup code here
    this.log('Component disconnected');
  }
}

customElements.define('my-component', MyComponent);
```

### 2. Element Creation Pattern

Use `this.create()` to create and append elements:

```javascript
this.create(type, attributes, target_el)
```

- **type**: HTML tag name (e.g., 'div', 'button', 'ul')
- **attributes**: Object with attribute key-value pairs
  - Use `content` key to set innerHTML
- **target_el**: Optional parent element (defaults to `this`)

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class MyComponent extends DataroomElement {
  async initialize() {
    // Create a div and append to this component
    const container = this.create('div', { class: 'container' });
    
    // Create a paragraph inside the container
    this.create('p', { content: 'Hello World', class: 'text' }, container);
  }
}

customElements.define('my-component', MyComponent);
```

### 3. Event System

DataroomElement provides a custom event system:

#### Emitting Events: `this.event(name, detail)`

```javascript
this.event('user-clicked', { timestamp: Date.now() });
```

#### Listening to Events: `this.on(name, callback)`

```javascript
this.on('user-clicked', (detail) => {
  console.log('Event received:', detail);
});
```

#### One-time Listeners: `this.once(name, callback)`

```javascript
this.once('initialized', (detail) => {
  console.log('This fires only once:', detail);
});
```

**Complete Example**:

```javascript
import DataroomElement from 'dataroom-js';

class EventComponent extends DataroomElement {
  async initialize() {
    // Listen for custom event
    this.on('data-updated', (detail) => {
      this.log(`Data updated: ${detail.value}`);
    });
    
    // Create button that emits event
    const btn = this.create('button', { content: 'Update' });
    btn.addEventListener('click', () => {
      this.event('data-updated', { value: Math.random() });
    });
  }
}

customElements.define('event-component', EventComponent);
```

### 4. Attribute Observation

DataroomElement automatically observes attribute changes and provides:

- **`this.attrs`**: Object containing all current attributes
- **`NODE-CHANGED` event**: Fired when any attribute changes

```javascript
import DataroomElement from 'dataroom-js';

class ObserverComponent extends DataroomElement {
  async initialize() {
    // Access current attributes
    console.log(this.attrs);
    
    // Listen for attribute changes
    this.on('NODE-CHANGED', (detail) => {
      console.log(`${detail.attribute} changed from ${detail.oldValue} to ${detail.newValue}`);
    });
  }
}

customElements.define('observer-component', ObserverComponent);
```

**Usage in HTML**:

```html
<observer-component data-id="123" data-name="Test"></observer-component>
```

---

## Pattern Library

### Data-Driven Components

#### Pattern 1: Dynamic List Rendering

**Use Case**: Render a list of items from an array of data.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class DynamicList extends DataroomElement {
  async initialize() {
    const items = ['Apple', 'Banana', 'Cherry', 'Date'];
    
    const ul = this.create('ul', { class: 'fruit-list' });
    
    items.forEach(item => {
      this.create('li', { content: item }, ul);
    });
  }
}

customElements.define('dynamic-list', DynamicList);
```

**Edge Cases**:

```javascript
import DataroomElement from 'dataroom-js';

class SafeDynamicList extends DataroomElement {
  async initialize() {
    // Handle empty array
    const items = this.attrs['data-items'] ? JSON.parse(this.attrs['data-items']) : [];
    
    if (items.length === 0) {
      this.create('p', { content: 'No items to display', class: 'empty-state' });
      return;
    }
    
    const ul = this.create('ul', { class: 'fruit-list' });
    
    items.forEach(item => {
      // Handle null/undefined values
      const displayText = item ?? 'Unknown';
      this.create('li', { content: displayText }, ul);
    });
  }
}

customElements.define('safe-dynamic-list', SafeDynamicList);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Using document.createElement
const li = document.createElement('li');
li.textContent = item;
ul.appendChild(li);

// ✅ CORRECT: Use this.create()
this.create('li', { content: item }, ul);
```

---

#### Pattern 2: Data Table

**Use Case**: Display tabular data with headers and rows.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class DataTable extends DataroomElement {
  async initialize() {
    const data = [
      { name: 'Alice', age: 30, city: 'New York' },
      { name: 'Bob', age: 25, city: 'San Francisco' },
      { name: 'Charlie', age: 35, city: 'Chicago' }
    ];
    
    const table = this.create('table', { class: 'data-table' });
    
    // Create header
    const thead = this.create('thead', {}, table);
    const headerRow = this.create('tr', {}, thead);
    ['Name', 'Age', 'City'].forEach(header => {
      this.create('th', { content: header }, headerRow);
    });
    
    // Create body
    const tbody = this.create('tbody', {}, table);
    data.forEach(row => {
      const tr = this.create('tr', {}, tbody);
      this.create('td', { content: row.name }, tr);
      this.create('td', { content: row.age }, tr);
      this.create('td', { content: row.city }, tr);
    });
  }
}

customElements.define('data-table', DataTable);
```

**Edge Cases**:

```javascript
import DataroomElement from 'dataroom-js';

class RobustDataTable extends DataroomElement {
  async initialize() {
    const data = this.attrs['data-rows'] ? JSON.parse(this.attrs['data-rows']) : [];
    
    // Handle empty data
    if (!data || data.length === 0) {
      this.create('p', { content: 'No data available', class: 'empty-state' });
      return;
    }
    
    const table = this.create('table', { class: 'data-table' });
    
    // Extract headers from first row
    const headers = Object.keys(data[0]);
    
    const thead = this.create('thead', {}, table);
    const headerRow = this.create('tr', {}, thead);
    headers.forEach(header => {
      this.create('th', { content: header }, headerRow);
    });
    
    const tbody = this.create('tbody', {}, table);
    data.forEach(row => {
      const tr = this.create('tr', {}, tbody);
      headers.forEach(key => {
        // Handle missing values
        const value = row[key] !== undefined && row[key] !== null ? row[key] : '-';
        this.create('td', { content: value }, tr);
      });
    });
  }
}

customElements.define('robust-data-table', RobustDataTable);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Creating elements with native DOM API
const table = document.createElement('table');
const thead = document.createElement('thead');

// ✅ CORRECT: Use this.create()
const table = this.create('table', { class: 'data-table' });
const thead = this.create('thead', {}, table);
```

---

#### Pattern 3: Form Input Handling

**Use Case**: Create forms and capture user input.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class UserForm extends DataroomElement {
  async initialize() {
    const form = this.create('form', { class: 'user-form' });
    
    // Name input
    this.create('label', { content: 'Name:', for: 'name' }, form);
    const nameInput = this.create('input', { 
      type: 'text', 
      id: 'name', 
      name: 'name',
      placeholder: 'Enter your name'
    }, form);
    
    // Email input
    this.create('label', { content: 'Email:', for: 'email' }, form);
    const emailInput = this.create('input', { 
      type: 'email', 
      id: 'email', 
      name: 'email',
      placeholder: 'Enter your email'
    }, form);
    
    // Submit button
    const submitBtn = this.create('button', { 
      type: 'submit', 
      content: 'Submit' 
    }, form);
    
    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        name: nameInput.value,
        email: emailInput.value
      };
      this.event('form-submitted', formData);
    });
  }
}

customElements.define('user-form', UserForm);
```

**Edge Cases**:

```javascript
import DataroomElement from 'dataroom-js';

class ValidatedUserForm extends DataroomElement {
  async initialize() {
    const form = this.create('form', { class: 'user-form' });
    
    this.create('label', { content: 'Name:', for: 'name' }, form);
    const nameInput = this.create('input', { 
      type: 'text', 
      id: 'name', 
      required: 'true'
    }, form);
    
    this.create('label', { content: 'Email:', for: 'email' }, form);
    const emailInput = this.create('input', { 
      type: 'email', 
      id: 'email', 
      required: 'true'
    }, form);
    
    const errorMsg = this.create('p', { 
      class: 'error-message', 
      style: 'color: red; display: none;' 
    }, form);
    
    const submitBtn = this.create('button', { 
      type: 'submit', 
      content: 'Submit' 
    }, form);
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Validation
      if (!nameInput.value.trim()) {
        errorMsg.textContent = 'Name is required';
        errorMsg.style.display = 'block';
        return;
      }
      
      if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
        errorMsg.textContent = 'Valid email is required';
        errorMsg.style.display = 'block';
        return;
      }
      
      errorMsg.style.display = 'none';
      
      const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim()
      };
      
      this.event('form-submitted', formData);
      form.reset();
    });
  }
}

customElements.define('validated-user-form', ValidatedUserForm);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Creating form elements with document.createElement
const input = document.createElement('input');
input.type = 'text';
form.appendChild(input);

// ✅ CORRECT: Use this.create()
const input = this.create('input', { type: 'text' }, form);
```

---

#### Pattern 4: State Management with Attributes

**Use Case**: Use component attributes for reactive state management.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class Counter extends DataroomElement {
  async initialize() {
    // Initialize count from attribute or default to 0
    const initialCount = parseInt(this.attrs['data-count']) || 0;
    
    const display = this.create('p', { 
      content: `Count: ${initialCount}`,
      class: 'count-display'
    });
    
    const incrementBtn = this.create('button', { content: '+' });
    const decrementBtn = this.create('button', { content: '-' });
    
    // Listen for attribute changes
    this.on('NODE-CHANGED', (detail) => {
      if (detail.attribute === 'data-count') {
        display.textContent = `Count: ${detail.newValue}`;
        this.event('count-changed', { count: parseInt(detail.newValue) });
      }
    });
    
    incrementBtn.addEventListener('click', () => {
      const currentCount = parseInt(this.attrs['data-count']) || 0;
      this.setAttribute('data-count', currentCount + 1);
    });
    
    decrementBtn.addEventListener('click', () => {
      const currentCount = parseInt(this.attrs['data-count']) || 0;
      this.setAttribute('data-count', currentCount - 1);
    });
  }
}

customElements.define('counter-component', Counter);
```

**Using setAttrs for Batch Updates**:

```javascript
import DataroomElement from 'dataroom-js';

class UserProfile extends DataroomElement {
  async initialize() {
    const nameDisplay = this.create('p', { 
      content: `Name: ${this.attrs['data-name'] || 'Unknown'}` 
    });
    const emailDisplay = this.create('p', { 
      content: `Email: ${this.attrs['data-email'] || 'Unknown'}` 
    });
    
    const updateBtn = this.create('button', { content: 'Update Profile' });
    
    this.on('NODE-CHANGED', (detail) => {
      if (detail.attribute === 'data-name') {
        nameDisplay.textContent = `Name: ${detail.newValue}`;
      }
      if (detail.attribute === 'data-email') {
        emailDisplay.textContent = `Email: ${detail.newValue}`;
      }
    });
    
    updateBtn.addEventListener('click', async () => {
      // Batch update multiple attributes
      await this.setAttrs({
        'data-name': 'Jane Doe',
        'data-email': 'jane@example.com'
      });
    });
  }
}

customElements.define('user-profile', UserProfile);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Managing state in regular variables without reactivity
let count = 0;
incrementBtn.addEventListener('click', () => {
  count++; // This won't trigger any updates
  display.textContent = `Count: ${count}`;
});

// ✅ CORRECT: Use attributes for reactive state
incrementBtn.addEventListener('click', () => {
  const currentCount = parseInt(this.attrs['data-count']) || 0;
  this.setAttribute('data-count', currentCount + 1);
});
```

---

### Interactive Widgets

#### Pattern 5: Button with Event Handling

**Use Case**: Create interactive buttons that communicate via custom events.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class ActionButton extends DataroomElement {
  async initialize() {
    const btn = this.create('button', { 
      content: this.attrs['data-label'] || 'Click Me',
      class: 'action-button'
    });
    
    btn.addEventListener('click', () => {
      this.event('button-clicked', { 
        label: this.attrs['data-label'],
        timestamp: Date.now()
      });
    });
  }
}

customElements.define('action-button', ActionButton);
```

**Edge Cases**:

```javascript
import DataroomElement from 'dataroom-js';

class ThrottledButton extends DataroomElement {
  async initialize() {
    this.isProcessing = false;
    
    const btn = this.create('button', { 
      content: this.attrs['data-label'] || 'Click Me',
      class: 'action-button'
    });
    
    btn.addEventListener('click', async () => {
      // Prevent rapid clicks
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      btn.disabled = true;
      btn.textContent = 'Processing...';
      
      this.event('button-clicked', { 
        label: this.attrs['data-label'],
        timestamp: Date.now()
      });
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      btn.disabled = false;
      btn.textContent = this.attrs['data-label'] || 'Click Me';
      this.isProcessing = false;
    });
  }
}

customElements.define('throttled-button', ThrottledButton);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Using native CustomEvent
const event = new CustomEvent('button-clicked', { detail: { label: 'test' } });
this.dispatchEvent(event);

// ✅ CORRECT: Use this.event()
this.event('button-clicked', { label: 'test' });
```

---

#### Pattern 6: Modal/Dialog

**Use Case**: Create modal dialogs that can be opened and closed.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class ModalDialog extends DataroomElement {
  async initialize() {
    const overlay = this.create('div', { 
      class: 'modal-overlay',
      style: 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);'
    });
    
    const modal = this.create('div', { 
      class: 'modal-content',
      style: 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px;'
    }, overlay);
    
    this.create('h2', { content: this.attrs['data-title'] || 'Modal' }, modal);
    this.create('p', { content: this.content || 'Modal content' }, modal);
    
    const closeBtn = this.create('button', { content: 'Close' }, modal);
    
    // Listen for open event
    this.on('open-modal', () => {
      overlay.style.display = 'block';
      this.event('modal-opened', {});
    });
    
    // Close handlers
    closeBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      this.event('modal-closed', {});
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        this.event('modal-closed', {});
      }
    });
  }
}

customElements.define('modal-dialog', ModalDialog);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Using native addEventListener for custom events
this.addEventListener('open-modal', (e) => {
  // This works but is inconsistent with DataroomElement patterns
});

// ✅ CORRECT: Use this.on()
this.on('open-modal', (detail) => {
  overlay.style.display = 'block';
});
```

---

#### Pattern 7: Tabs Component

**Use Case**: Create tabbed interface with multiple content panels.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class TabsComponent extends DataroomElement {
  async initialize() {
    const tabs = this.attrs['data-tabs'] ? JSON.parse(this.attrs['data-tabs']) : [];
    
    if (tabs.length === 0) return;
    
    const tabsContainer = this.create('div', { class: 'tabs-container' });
    const tabButtons = this.create('div', { class: 'tab-buttons' }, tabsContainer);
    const tabContent = this.create('div', { class: 'tab-content' }, tabsContainer);
    
    let activeTab = 0;
    
    tabs.forEach((tab, index) => {
      // Create tab button
      const btn = this.create('button', { 
        content: tab.label,
        class: index === 0 ? 'tab-button active' : 'tab-button'
      }, tabButtons);
      
      // Create tab panel
      const panel = this.create('div', { 
        content: tab.content,
        class: 'tab-panel',
        style: index === 0 ? 'display: block;' : 'display: none;'
      }, tabContent);
      
      btn.addEventListener('click', () => {
        // Deactivate all tabs
        Array.from(tabButtons.children).forEach(b => b.classList.remove('active'));
        Array.from(tabContent.children).forEach(p => p.style.display = 'none');
        
        // Activate clicked tab
        btn.classList.add('active');
        panel.style.display = 'block';
        activeTab = index;
        
        this.event('tab-changed', { index, label: tab.label });
      });
    });
  }
}

customElements.define('tabs-component', TabsComponent);
```

**Usage**:

```html
<tabs-component data-tabs='[
  {"label": "Tab 1", "content": "Content 1"},
  {"label": "Tab 2", "content": "Content 2"},
  {"label": "Tab 3", "content": "Content 3"}
]'></tabs-component>
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Creating buttons with document.createElement
const btn = document.createElement('button');
btn.textContent = tab.label;
tabButtons.appendChild(btn);

// ✅ CORRECT: Use this.create()
const btn = this.create('button', { content: tab.label }, tabButtons);
```

---

#### Pattern 8: Dropdown/Select

**Use Case**: Build custom dropdown selectors.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class CustomDropdown extends DataroomElement {
  async initialize() {
    const options = this.attrs['data-options'] ? JSON.parse(this.attrs['data-options']) : [];
    
    const container = this.create('div', { class: 'dropdown-container', style: 'position: relative;' });
    
    const selected = this.create('div', { 
      content: this.attrs['data-placeholder'] || 'Select an option',
      class: 'dropdown-selected',
      style: 'padding: 10px; border: 1px solid #ccc; cursor: pointer;'
    }, container);
    
    const optionsList = this.create('div', { 
      class: 'dropdown-options',
      style: 'display: none; position: absolute; top: 100%; left: 0; right: 0; border: 1px solid #ccc; background: white; z-index: 1000;'
    }, container);
    
    options.forEach(option => {
      const optionEl = this.create('div', { 
        content: option.label || option,
        class: 'dropdown-option',
        style: 'padding: 10px; cursor: pointer;'
      }, optionsList);
      
      optionEl.addEventListener('click', () => {
        selected.textContent = option.label || option;
        optionsList.style.display = 'none';
        this.event('option-selected', { 
          value: option.value || option,
          label: option.label || option
        });
      });
      
      optionEl.addEventListener('mouseenter', () => {
        optionEl.style.background = '#f0f0f0';
      });
      
      optionEl.addEventListener('mouseleave', () => {
        optionEl.style.background = 'white';
      });
    });
    
    selected.addEventListener('click', () => {
      const isVisible = optionsList.style.display === 'block';
      optionsList.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        optionsList.style.display = 'none';
      }
    });
  }
}

customElements.define('custom-dropdown', CustomDropdown);
```

**Usage**:

```html
<custom-dropdown 
  data-placeholder="Choose a fruit"
  data-options='[
    {"label": "Apple", "value": "apple"},
    {"label": "Banana", "value": "banana"},
    {"label": "Cherry", "value": "cherry"}
  ]'>
</custom-dropdown>
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Using Shadow DOM
this.attachShadow({ mode: 'open' });

// ✅ CORRECT: DataroomElement doesn't support Shadow DOM, use regular DOM
const container = this.create('div', { class: 'dropdown-container' });
```

---

### API Integration Patterns

#### Pattern 9: Fetch and Display Data

**Use Case**: Fetch data from an API and display it.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class UserList extends DataroomElement {
  async initialize() {
    const container = this.create('div', { class: 'user-list' });
    
    try {
      const users = await this.call('/api/users');
      
      users.forEach(user => {
        const userCard = this.create('div', { class: 'user-card' }, container);
        this.create('h3', { content: user.name }, userCard);
        this.create('p', { content: user.email }, userCard);
      });
      
      this.event('data-loaded', { count: users.length });
    } catch (error) {
      this.create('p', { 
        content: `Error loading users: ${error.message}`,
        class: 'error'
      }, container);
    }
  }
}

customElements.define('user-list', UserList);
```

---

#### Pattern 10: Loading States

**Use Case**: Manage loading, error, and success states during data fetching.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class DataLoader extends DataroomElement {
  async initialize() {
    const container = this.create('div', { class: 'data-container' });
    const loadingMsg = this.create('p', { content: 'Loading...', class: 'loading' }, container);
    
    try {
      const data = await this.call(this.attrs['data-endpoint'] || '/api/data');
      
      // Remove loading message
      loadingMsg.remove();
      
      // Display success state
      this.create('div', { 
        content: `Loaded ${data.items?.length || 0} items`,
        class: 'success'
      }, container);
      
      // Render data
      data.items?.forEach(item => {
        this.create('div', { content: item.name, class: 'item' }, container);
      });
      
      this.event('load-success', data);
    } catch (error) {
      // Remove loading message
      loadingMsg.remove();
      
      // Display error state
      this.create('div', { 
        content: `Failed to load data: ${error.message}`,
        class: 'error',
        style: 'color: red; padding: 10px; border: 1px solid red;'
      }, container);
      
      // Retry button
      const retryBtn = this.create('button', { content: 'Retry' }, container);
      retryBtn.addEventListener('click', () => {
        container.innerHTML = '';
        this.initialize();
      });
      
      this.event('load-error', { error: error.message });
    }
  }
}

customElements.define('data-loader', DataLoader);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Using native fetch without error handling
const response = await fetch('/api/data');
const data = await response.json();

// ✅ CORRECT: Use this.call() with try/catch
try {
  const data = await this.call('/api/data');
  // Handle success
} catch (error) {
  // Handle error
}
```

---

#### Pattern 11: JSON Configuration

**Use Case**: Load configuration from a JSON file.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class ConfigurableWidget extends DataroomElement {
  async initialize() {
    const configUrl = this.attrs['data-config'] || '/config.json';
    
    try {
      const config = await this.getJSON(configUrl);
      
      this.create('h2', { content: config.title || 'Widget' });
      this.create('p', { content: config.description || '' });
      
      // Apply theme from config
      if (config.theme) {
        this.style.backgroundColor = config.theme.background;
        this.style.color = config.theme.text;
      }
      
      this.event('config-loaded', config);
    } catch (error) {
      this.create('p', { 
        content: `Failed to load configuration: ${error.message}`,
        class: 'error'
      });
    }
  }
}

customElements.define('configurable-widget', ConfigurableWidget);
```

**Edge Cases**:

```javascript
import DataroomElement from 'dataroom-js';

class RobustConfigWidget extends DataroomElement {
  async initialize() {
    const configUrl = this.attrs['data-config'];
    
    // Fallback to default config if no URL provided
    const defaultConfig = {
      title: 'Default Widget',
      description: 'No configuration loaded',
      theme: { background: '#fff', text: '#000' }
    };
    
    let config = defaultConfig;
    
    if (configUrl) {
      try {
        config = await this.getJSON(configUrl);
        this.log('Configuration loaded successfully');
      } catch (error) {
        this.log(`Failed to load config, using defaults: ${error.message}`);
        // Continue with default config
      }
    }
    
    // Merge with defaults to handle missing properties
    config = { ...defaultConfig, ...config };
    
    this.create('h2', { content: config.title });
    this.create('p', { content: config.description });
    
    if (config.theme) {
      this.style.backgroundColor = config.theme.background;
      this.style.color = config.theme.text;
    }
  }
}

customElements.define('robust-config-widget', RobustConfigWidget);
```

---

#### Pattern 12: Authentication with security-scheme

**Use Case**: Make authenticated API calls using different security schemes.

**Example with localStorage (default)**:

```javascript
import DataroomElement from 'dataroom-js';

class SecureDataFetcher extends DataroomElement {
  async initialize() {
    // Uses localStorage bearer token by default
    try {
      const data = await this.call('/api/secure-data');
      this.create('pre', { content: JSON.stringify(data, null, 2) });
    } catch (error) {
      this.create('p', { content: `Auth error: ${error.message}`, class: 'error' });
    }
  }
}

customElements.define('secure-data-fetcher', SecureDataFetcher);
```

**Usage in HTML**:

```html
<!-- Uses localStorage bearer token -->
<secure-data-fetcher security-scheme="localstorage"></secure-data-fetcher>

<!-- Uses cookies for authentication -->
<secure-data-fetcher security-scheme="cookie"></secure-data-fetcher>
```

**Example with Cookie Authentication**:

```javascript
import DataroomElement from 'dataroom-js';

class CookieAuthComponent extends DataroomElement {
  async initialize() {
    // Set security-scheme to cookie
    this.setAttribute('security-scheme', 'cookie');
    
    try {
      const data = await this.call('/api/user-profile');
      this.create('h2', { content: data.name });
      this.create('p', { content: data.email });
    } catch (error) {
      this.create('p', { content: 'Please log in', class: 'error' });
    }
  }
}

customElements.define('cookie-auth-component', CookieAuthComponent);
```

---

#### Pattern 13: Timeout Handling

**Use Case**: Set timeouts for API calls to prevent hanging requests.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class TimeoutAwareComponent extends DataroomElement {
  async initialize() {
    // Set 5 second timeout
    this.setAttribute('call-timeout', '5000');
    
    const statusEl = this.create('p', { content: 'Fetching data...' });
    
    try {
      const data = await this.call('/api/slow-endpoint');
      statusEl.textContent = 'Data loaded successfully';
      this.create('pre', { content: JSON.stringify(data, null, 2) });
    } catch (error) {
      if (error.message === 'Request timed out') {
        statusEl.textContent = 'Request timed out after 5 seconds';
        statusEl.style.color = 'orange';
        
        // Offer retry
        const retryBtn = this.create('button', { content: 'Retry' });
        retryBtn.addEventListener('click', () => {
          this.innerHTML = '';
          this.initialize();
        });
      } else {
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.style.color = 'red';
      }
    }
  }
}

customElements.define('timeout-aware-component', TimeoutAwareComponent);
```

**Usage in HTML**:

```html
<!-- 10 second timeout -->
<timeout-aware-component call-timeout="10000"></timeout-aware-component>
```

---

#### Pattern 14: Comprehensive Error Handling

**Use Case**: Handle all types of errors gracefully with user feedback.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class RobustApiComponent extends DataroomElement {
  async initialize() {
    const container = this.create('div', { class: 'api-container' });
    const statusEl = this.create('p', { content: 'Loading...', class: 'status' }, container);
    
    try {
      const endpoint = this.attrs['data-endpoint'];
      
      if (!endpoint) {
        throw new Error('No endpoint specified');
      }
      
      const data = await this.call(endpoint);
      
      // Check for empty response
      if (!data || Object.keys(data).length === 0) {
        statusEl.textContent = 'No data available';
        statusEl.style.color = 'gray';
        return;
      }
      
      // Success
      statusEl.textContent = 'Data loaded successfully';
      statusEl.style.color = 'green';
      
      this.create('pre', { 
        content: JSON.stringify(data, null, 2),
        style: 'background: #f5f5f5; padding: 10px; overflow: auto;'
      }, container);
      
      this.event('data-loaded', data);
      
    } catch (error) {
      statusEl.style.color = 'red';
      
      // Handle different error types
      if (error.message === 'Request timed out') {
        statusEl.textContent = 'Request timed out. Please try again.';
      } else if (error.message.includes('HTTP error! status: 404')) {
        statusEl.textContent = 'Resource not found (404)';
      } else if (error.message.includes('HTTP error! status: 401')) {
        statusEl.textContent = 'Unauthorized. Please log in.';
      } else if (error.message.includes('HTTP error! status: 500')) {
        statusEl.textContent = 'Server error. Please try again later.';
      } else if (error.message.includes('Network error')) {
        statusEl.textContent = 'Network error. Check your connection.';
      } else {
        statusEl.textContent = `Error: ${error.message}`;
      }
      
      // Add retry button
      const retryBtn = this.create('button', { 
        content: 'Retry',
        style: 'margin-top: 10px;'
      }, container);
      
      retryBtn.addEventListener('click', () => {
        container.innerHTML = '';
        this.initialize();
      });
      
      this.event('data-error', { error: error.message });
    }
  }
}

customElements.define('robust-api-component', RobustApiComponent);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: No error handling
const data = await this.call('/api/data');
this.create('pre', { content: JSON.stringify(data) });

// ✅ CORRECT: Always use try/catch with user feedback
try {
  const data = await this.call('/api/data');
  this.create('pre', { content: JSON.stringify(data) });
} catch (error) {
  this.create('p', { content: `Error: ${error.message}`, class: 'error' });
}
```

---

### Component Composition

#### Pattern 15: Parent-Child Communication

**Use Case**: Multiple DataroomElement components communicating via events.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

// Child component
class ChildCounter extends DataroomElement {
  async initialize() {
    const count = parseInt(this.attrs['data-count']) || 0;
    
    const display = this.create('p', { content: `Count: ${count}` });
    const btn = this.create('button', { content: 'Increment' });
    
    btn.addEventListener('click', () => {
      const newCount = parseInt(this.attrs['data-count']) || 0;
      this.setAttribute('data-count', newCount + 1);
      this.event('count-updated', { count: newCount + 1 });
    });
    
    this.on('NODE-CHANGED', (detail) => {
      if (detail.attribute === 'data-count') {
        display.textContent = `Count: ${detail.newValue}`;
      }
    });
  }
}

// Parent component
class ParentContainer extends DataroomElement {
  async initialize() {
    this.create('h2', { content: 'Parent Container' });
    
    const child = this.create('child-counter', { 'data-count': '0' });
    const status = this.create('p', { content: 'Waiting for updates...' });
    
    // Listen to child events
    child.addEventListener('count-updated', (e) => {
      status.textContent = `Child count updated to: ${e.detail.count}`;
    });
  }
}

customElements.define('child-counter', ChildCounter);
customElements.define('parent-container', ParentContainer);
```

**Usage**:

```html
<parent-container></parent-container>
```

---

### Advanced Patterns

#### Pattern 16: Attribute Observation and Reactivity

**Use Case**: React to external attribute changes.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class ReactiveDisplay extends DataroomElement {
  async initialize() {
    const display = this.create('div', { class: 'display' });
    
    // Initial render
    this.render(display);
    
    // Listen for any attribute change
    this.on('NODE-CHANGED', (detail) => {
      this.log(`Attribute ${detail.attribute} changed`);
      this.render(display);
    });
  }
  
  render(container) {
    container.innerHTML = '';
    this.create('p', { content: `Name: ${this.attrs['data-name'] || 'N/A'}` }, container);
    this.create('p', { content: `Status: ${this.attrs['data-status'] || 'N/A'}` }, container);
    this.create('p', { content: `Count: ${this.attrs['data-count'] || '0'}` }, container);
  }
}

customElements.define('reactive-display', ReactiveDisplay);
```

**Usage**:

```html
<reactive-display data-name="Alice" data-status="active" data-count="5"></reactive-display>

<script>
  // Changing attributes externally will trigger re-render
  const el = document.querySelector('reactive-display');
  el.setAttribute('data-count', '10');
</script>
```

---

#### Pattern 17: Logging and Debugging

**Use Case**: Debug component behavior with verbose logging.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class DebuggableComponent extends DataroomElement {
  async initialize() {
    this.log('Component initializing...');
    
    const data = this.attrs['data-items'] ? JSON.parse(this.attrs['data-items']) : [];
    this.log(`Received ${data.length} items`);
    
    const list = this.create('ul');
    
    data.forEach((item, index) => {
      this.log(`Rendering item ${index}: ${item}`);
      this.create('li', { content: item }, list);
    });
    
    this.log('Component initialized successfully');
    this.event('initialized', { itemCount: data.length });
  }
  
  async disconnect() {
    this.log('Component disconnecting...');
  }
}

customElements.define('debuggable-component', DebuggableComponent);
```

**Usage**:

```html
<!-- Enable verbose logging -->
<debuggable-component verbose="true" data-items='["A", "B", "C"]'></debuggable-component>
```

---

#### Pattern 18: Cleanup Patterns

**Use Case**: Properly clean up resources when component is removed.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class CleanupComponent extends DataroomElement {
  async initialize() {
    this.intervalId = null;
    this.eventHandlers = [];
    
    const display = this.create('p', { content: 'Timer: 0' });
    let count = 0;
    
    // Set up interval
    this.intervalId = setInterval(() => {
      count++;
      display.textContent = `Timer: ${count}`;
    }, 1000);
    
    // Set up external event listener
    const handleResize = () => {
      this.log(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
    };
    window.addEventListener('resize', handleResize);
    this.eventHandlers.push({ target: window, event: 'resize', handler: handleResize });
  }
  
  async disconnect() {
    // Clean up interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.log('Interval cleared');
    }
    
    // Clean up event listeners
    this.eventHandlers.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
      this.log(`Removed ${event} listener`);
    });
  }
}

customElements.define('cleanup-component', CleanupComponent);
```

⚠️ **DON'T**:

```javascript
// ❌ WRONG: Not cleaning up resources
async initialize() {
  setInterval(() => {
    // This will keep running even after component is removed
  }, 1000);
}

// ✅ CORRECT: Always clean up in disconnect()
async initialize() {
  this.intervalId = setInterval(() => { /* ... */ }, 1000);
}

async disconnect() {
  if (this.intervalId) clearInterval(this.intervalId);
}
```

---

#### Pattern 19: Dynamic Content Access

**Use Case**: Access and use the component's initial innerHTML.

**Example**:

```javascript
import DataroomElement from 'dataroom-js';

class ContentWrapper extends DataroomElement {
  async initialize() {
    // Access initial content
    const originalContent = this.content;
    
    // Clear and rebuild
    this.innerHTML = '';
    
    const container = this.create('div', { class: 'wrapper' });
    this.create('h3', { content: 'Wrapped Content:' }, container);
    this.create('div', { 
      content: originalContent,
      class: 'original-content',
      style: 'border: 1px solid #ccc; padding: 10px;'
    }, container);
    this.create('p', { 
      content: `Content length: ${originalContent.length} characters`,
      class: 'meta'
    }, container);
  }
}

customElements.define('content-wrapper', ContentWrapper);
```

**Usage**:

```html
<content-wrapper>
  This is the original content that will be wrapped.
  It can contain <strong>HTML</strong> too!
</content-wrapper>
```

---

## Anti-Patterns Summary

This section consolidates all critical anti-patterns that AI agents must avoid when generating DataroomElement code.

### ❌ NEVER use document.createElement

**Why**: DataroomElement provides `this.create()` which is the standard way to create elements. Using native DOM APIs breaks consistency and bypasses the framework's element creation pattern.

**Wrong**:

```javascript
import DataroomElement from 'dataroom-js';

class BadComponent extends DataroomElement {
  async initialize() {
    // ❌ WRONG: Using native DOM API
    const div = document.createElement('div');
    div.className = 'container';
    this.appendChild(div);
    
    const p = document.createElement('p');
    p.textContent = 'Hello';
    div.appendChild(p);
  }
}
```

**Correct**:

```javascript
import DataroomElement from 'dataroom-js';

class GoodComponent extends DataroomElement {
  async initialize() {
    // ✅ CORRECT: Using this.create()
    const div = this.create('div', { class: 'container' });
    this.create('p', { content: 'Hello' }, div);
  }
}
```

---

### ❌ NEVER use Shadow DOM

**Why**: DataroomElement does not support Shadow DOM. It operates on the regular (light) DOM. Attempting to use Shadow DOM will cause errors and unexpected behavior.

**Wrong**:

```javascript
import DataroomElement from 'dataroom-js';

class BadComponent extends DataroomElement {
  async initialize() {
    // ❌ WRONG: Trying to use Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    const div = document.createElement('div');
    shadow.appendChild(div);
  }
}
```

**Correct**:

```javascript
import DataroomElement from 'dataroom-js';

class GoodComponent extends DataroomElement {
  async initialize() {
    // ✅ CORRECT: Using regular DOM with this.create()
    const div = this.create('div', { class: 'container' });
    this.create('p', { content: 'Content goes in light DOM' }, div);
  }
}
```

**Alternative for Encapsulation**: If you need style encapsulation, use scoped CSS classes or CSS modules instead of Shadow DOM.

---

### ❌ NEVER use native CustomEvent/dispatchEvent

**Why**: DataroomElement provides `this.event()` and `this.on()` for event handling. Using native event APIs is inconsistent with the framework's patterns and makes code harder to maintain.

**Wrong**:

```javascript
import DataroomElement from 'dataroom-js';

class BadComponent extends DataroomElement {
  async initialize() {
    const btn = this.create('button', { content: 'Click' });
    
    btn.addEventListener('click', () => {
      // ❌ WRONG: Using native CustomEvent
      const event = new CustomEvent('button-clicked', {
        detail: { timestamp: Date.now() }
      });
      this.dispatchEvent(event);
    });
    
    // ❌ WRONG: Using native addEventListener for custom events
    this.addEventListener('button-clicked', (e) => {
      console.log(e.detail);
    });
  }
}
```

**Correct**:

```javascript
import DataroomElement from 'dataroom-js';

class GoodComponent extends DataroomElement {
  async initialize() {
    const btn = this.create('button', { content: 'Click' });
    
    btn.addEventListener('click', () => {
      // ✅ CORRECT: Using this.event()
      this.event('button-clicked', { timestamp: Date.now() });
    });
    
    // ✅ CORRECT: Using this.on()
    this.on('button-clicked', (detail) => {
      console.log(detail);
    });
  }
}
```

**Note**: Native `addEventListener` is still correct for standard DOM events (click, input, etc.) on HTML elements. Only use `this.on()` for custom events emitted by DataroomElement components.

---

### Why These Restrictions?

1. **Consistency**: Using the framework's methods ensures all code follows the same patterns, making it easier to read and maintain.

2. **Abstraction**: DataroomElement's methods provide a cleaner API that reduces boilerplate and potential errors.

3. **Framework Integration**: The custom methods integrate with DataroomElement's internal systems (logging, attribute observation, etc.).

4. **AI Agent Clarity**: Having clear, consistent patterns makes it easier for AI agents to generate correct code.

---

### Quick Checklist for AI Agents

Before generating DataroomElement code, verify:

- [ ] All code starts with `import DataroomElement from 'dataroom-js';`
- [ ] Component class extends `DataroomElement`
- [ ] Logic is in `initialize()` method, not constructor
- [ ] All elements created with `this.create()`, never `document.createElement()`
- [ ] Custom events emitted with `this.event()`, never `new CustomEvent()`
- [ ] Custom events listened with `this.on()` or `this.once()`
- [ ] No Shadow DOM usage (`attachShadow`)
- [ ] Cleanup logic in `disconnect()` method if needed
- [ ] Component registered with `customElements.define()`

---

## Complete Examples

### Example 1: Simple Counter Component

```javascript
import DataroomElement from 'dataroom-js';

class SimpleCounter extends DataroomElement {
  async initialize() {
    // Initialize state
    const initialCount = parseInt(this.attrs['data-count']) || 0;
    
    // Create UI
    const container = this.create('div', { class: 'counter-container' });
    const display = this.create('h2', { 
      content: `Count: ${initialCount}`,
      class: 'counter-display'
    }, container);
    
    const btnContainer = this.create('div', { class: 'button-group' }, container);
    const decrementBtn = this.create('button', { content: '-' }, btnContainer);
    const resetBtn = this.create('button', { content: 'Reset' }, btnContainer);
    const incrementBtn = this.create('button', { content: '+' }, btnContainer);
    
    // Handle attribute changes
    this.on('NODE-CHANGED', (detail) => {
      if (detail.attribute === 'data-count') {
        display.textContent = `Count: ${detail.newValue}`;
        this.event('count-changed', { count: parseInt(detail.newValue) });
      }
    });
    
    // Button handlers
    incrementBtn.addEventListener('click', () => {
      const current = parseInt(this.attrs['data-count']) || 0;
      this.setAttribute('data-count', current + 1);
    });
    
    decrementBtn.addEventListener('click', () => {
      const current = parseInt(this.attrs['data-count']) || 0;
      this.setAttribute('data-count', current - 1);
    });
    
    resetBtn.addEventListener('click', () => {
      this.setAttribute('data-count', '0');
    });
  }
}

customElements.define('simple-counter', SimpleCounter);
```

**Usage**:

```html
<simple-counter data-count="5"></simple-counter>
```

---

### Example 2: Todo List with API

```javascript
import DataroomElement from 'dataroom-js';

class TodoList extends DataroomElement {
  async initialize() {
    const container = this.create('div', { class: 'todo-container' });
    
    // Header
    this.create('h2', { content: 'My Todo List' }, container);
    
    // Input form
    const form = this.create('form', { class: 'todo-form' }, container);
    const input = this.create('input', { 
      type: 'text',
      placeholder: 'Enter a new todo...',
      required: 'true'
    }, form);
    const addBtn = this.create('button', { 
      type: 'submit',
      content: 'Add Todo'
    }, form);
    
    // Todo list container
    const listContainer = this.create('div', { class: 'todo-list' }, container);
    const statusEl = this.create('p', { 
      content: 'Loading todos...',
      class: 'status'
    }, listContainer);
    
    // Load todos from API
    try {
      const todos = await this.call('/api/todos');
      statusEl.remove();
      this.renderTodos(todos, listContainer);
      this.event('todos-loaded', { count: todos.length });
    } catch (error) {
      statusEl.textContent = `Error loading todos: ${error.message}`;
      statusEl.style.color = 'red';
    }
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!input.value.trim()) return;
      
      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';
      
      try {
        const newTodo = await this.call('/api/todos', {
          text: input.value.trim(),
          completed: false
        });
        
        this.addTodoToList(newTodo, listContainer);
        input.value = '';
        this.event('todo-added', newTodo);
      } catch (error) {
        alert(`Failed to add todo: ${error.message}`);
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Add Todo';
      }
    });
  }
  
  renderTodos(todos, container) {
    if (todos.length === 0) {
      this.create('p', { 
        content: 'No todos yet. Add one above!',
        class: 'empty-state'
      }, container);
      return;
    }
    
    const ul = this.create('ul', { class: 'todo-items' }, container);
    todos.forEach(todo => this.createTodoItem(todo, ul));
  }
  
  createTodoItem(todo, container) {
    const li = this.create('li', { 
      class: todo.completed ? 'todo-item completed' : 'todo-item'
    }, container);
    
    const checkbox = this.create('input', { 
      type: 'checkbox',
      checked: todo.completed ? 'true' : ''
    }, li);
    
    this.create('span', { content: todo.text }, li);
    
    const deleteBtn = this.create('button', { 
      content: 'Delete',
      class: 'delete-btn'
    }, li);
    
    checkbox.addEventListener('change', async () => {
      try {
        await this.call(`/api/todos/${todo.id}`, {
          completed: checkbox.checked
        });
        li.classList.toggle('completed');
        this.event('todo-updated', { id: todo.id, completed: checkbox.checked });
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        alert(`Failed to update todo: ${error.message}`);
      }
    });
    
    deleteBtn.addEventListener('click', async () => {
      try {
        await this.call(`/api/todos/${todo.id}/delete`);
        li.remove();
        this.event('todo-deleted', { id: todo.id });
      } catch (error) {
        alert(`Failed to delete todo: ${error.message}`);
      }
    });
  }
  
  addTodoToList(todo, container) {
    let ul = container.querySelector('ul.todo-items');
    if (!ul) {
      container.innerHTML = '';
      ul = this.create('ul', { class: 'todo-items' }, container);
    }
    this.createTodoItem(todo, ul);
  }
}

customElements.define('todo-list', TodoList);
```

**Usage**:

```html
<todo-list></todo-list>
```

---

### Example 3: Data Table with Sorting

```javascript
import DataroomElement from 'dataroom-js';

class SortableDataTable extends DataroomElement {
  async initialize() {
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.data = [];
    
    const container = this.create('div', { class: 'table-container' });
    const statusEl = this.create('p', { content: 'Loading data...' }, container);
    
    // Load data
    try {
      const endpoint = this.attrs['data-endpoint'] || '/api/data';
      this.data = await this.call(endpoint);
      statusEl.remove();
      
      if (this.data.length === 0) {
        this.create('p', { content: 'No data available' }, container);
        return;
      }
      
      this.renderTable(container);
      this.event('data-loaded', { count: this.data.length });
    } catch (error) {
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.style.color = 'red';
    }
  }
  
  renderTable(container) {
    // Clear existing table
    const existingTable = container.querySelector('table');
    if (existingTable) existingTable.remove();
    
    const table = this.create('table', { class: 'sortable-table' }, container);
    
    // Create header
    const thead = this.create('thead', {}, table);
    const headerRow = this.create('tr', {}, thead);
    
    const headers = Object.keys(this.data[0]);
    headers.forEach(header => {
      const th = this.create('th', { 
        content: `${header} ${this.getSortIndicator(header)}`,
        class: 'sortable-header',
        style: 'cursor: pointer;'
      }, headerRow);
      
      th.addEventListener('click', () => {
        this.sortBy(header);
        this.renderTable(container);
      });
    });
    
    // Create body
    const tbody = this.create('tbody', {}, table);
    this.data.forEach((row, index) => {
      const tr = this.create('tr', { 
        class: index % 2 === 0 ? 'even-row' : 'odd-row'
      }, tbody);
      
      headers.forEach(key => {
        const value = row[key] !== undefined && row[key] !== null ? row[key] : '-';
        this.create('td', { content: String(value) }, tr);
      });
    });
    
    // Add summary
    const summary = this.create('p', { 
      content: `Showing ${this.data.length} rows`,
      class: 'table-summary'
    }, container);
  }
  
  sortBy(column) {
    if (this.sortColumn === column) {
      // Toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.data.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      
      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      // Compare values
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.event('table-sorted', { column, direction: this.sortDirection });
  }
  
  getSortIndicator(column) {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
}

customElements.define('sortable-data-table', SortableDataTable);
```

**Usage**:

```html
<sortable-data-table data-endpoint="/api/users"></sortable-data-table>
```

---

## Tips for AI Agents

### 1. Always Start with the Import

Every DataroomElement component must begin with:

```javascript
import DataroomElement from 'dataroom-js';
```

This is the npm package import and should be used by default unless the user specifically requests CDN usage.

---

### 2. Recognize Common Patterns in User Requests

When users ask for:

- **"Create a list/table/form"** → Use data-driven component patterns
- **"Make it interactive/clickable"** → Use interactive widget patterns with event handling
- **"Fetch data from API"** → Use API integration patterns with error handling
- **"Show loading state"** → Include loading/error/success state management
- **"Make it reactive"** → Use attribute observation with `this.attrs` and `NODE-CHANGED`

---

### 3. Structure Your Components

Follow this structure for all components:

```javascript
import DataroomElement from 'dataroom-js';

class ComponentName extends DataroomElement {
  async initialize() {
    // 1. Get attributes/configuration
    const config = this.attrs['data-config'];
    
    // 2. Create container
    const container = this.create('div', { class: 'component-container' });
    
    // 3. Set up event listeners
    this.on('custom-event', (detail) => {
      // Handle event
    });
    
    // 4. Fetch data if needed (with error handling)
    try {
      const data = await this.call('/api/endpoint');
      // Render data
    } catch (error) {
      // Handle error
    }
    
    // 5. Emit events for parent components
    this.event('component-ready', {});
  }
  
  async disconnect() {
    // Clean up resources
  }
}

customElements.define('component-name', ComponentName);
```

---

### 4. Combine Patterns for Complex Requirements

For complex components, combine multiple patterns:

- **Data table with API** = Pattern 2 (Data Table) + Pattern 9 (Fetch and Display) + Pattern 10 (Loading States)
- **Interactive form with validation** = Pattern 3 (Form Input) + Pattern 4 (State Management) + Pattern 5 (Button Events)
- **Modal with dynamic content** = Pattern 6 (Modal) + Pattern 19 (Dynamic Content)

---

### 5. Error Handling is Mandatory

Always wrap API calls in try/catch blocks and provide user feedback:

```javascript
try {
  const data = await this.call('/api/endpoint');
  // Success path
} catch (error) {
  // Error path with user feedback
  this.create('p', { 
    content: `Error: ${error.message}`,
    class: 'error'
  });
}
```

---

### 6. Use Semantic HTML

Create semantic, accessible HTML structures:

```javascript
// Good: Semantic structure
const article = this.create('article', { class: 'post' });
this.create('h2', { content: title }, article);
this.create('p', { content: body }, article);

// Avoid: Generic divs everywhere
const div1 = this.create('div', { class: 'post' });
const div2 = this.create('div', { content: title }, div1);
```

---

### 7. Leverage Attribute Reactivity

Use attributes for state that should trigger re-renders:

```javascript
// Listen for changes
this.on('NODE-CHANGED', (detail) => {
  if (detail.attribute === 'data-filter') {
    this.applyFilter(detail.newValue);
  }
});

// Update from code
this.setAttribute('data-filter', 'active');
```

---

### 8. Clean Up Resources

Always implement `disconnect()` if your component:
- Sets up intervals or timeouts
- Adds event listeners to window/document
- Creates external resources

```javascript
async disconnect() {
  if (this.intervalId) clearInterval(this.intervalId);
  if (this.externalListener) {
    window.removeEventListener('resize', this.externalListener);
  }
}
```

---

### 9. Emit Events for Communication

Use custom events to communicate between components:

```javascript
// Emit events for important state changes
this.event('data-loaded', { count: items.length });
this.event('user-action', { action: 'submit', data: formData });
this.event('error-occurred', { error: error.message });
```

---

### 10. Test Edge Cases

Always consider:
- Empty data arrays
- Null/undefined values
- Network failures
- Slow API responses
- Invalid user input
- Component removal/cleanup

---

**Remember**: The goal is to write clean, maintainable, and consistent code that follows DataroomElement patterns. When in doubt, refer back to the pattern library and anti-patterns sections.
