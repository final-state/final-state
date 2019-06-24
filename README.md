[![Build Status](https://travis-ci.com/final-state/final-state.svg?branch=master)](https://travis-ci.com/final-state/final-state)
[![codecov.io](https://codecov.io/gh/final-state/final-state/branch/master/graph/badge.svg)](https://codecov.io/gh/final-state/final-state)
[![Known Vulnerabilities](https://snyk.io/test/github/final-state/final-state/badge.svg)](https://snyk.io/test/github/final-state/final-state)
[![minified + gzip](https://badgen.net/bundlephobia/minzip/final-state@1.0.7)](https://bundlephobia.com/result?p=final-state@1.0.7)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# final-state

> A lightweight, framework agnostic state management.

## Installation

```bash
# Install peer dependencies
yarn add immer
# Install final-state
yarn add final-state
```

`final-state` is written in `Typescript`, so you don't need to find a type definition for it.

## Basic Example

```javascript
import Store from 'final-state';

// Define initial state
const initialState = {
  a: 1,
  b: 'good',
};

// Define actions
const actions = {
  increaseA(draftState, n = 1) {
    draftState.a += n;
  },
};

// Create store instance
const store = new Store(initialState, actions, 'store-name');

// Print state
console.log('INITIAL STATE:', store.getState());

// Define a listener to listen the changes of state
function listener() {
  // Print state
  console.log('IN SUBSCRIBE LISTENER:', store.getState());
}

// Subscribe the changes of state
store.subscribe(listener);

// Dispatch action
store.dispatch('increaseA');

// Print state
console.log('CURRENT STATE:', store.getState());

store.unSubscribe(listener);

/* Output will be:
INITIAL STATE: Object {a: 1, b: "good"}
IN SUBSCRIBE LISTENER: Object {a: 2, b: "good"}
CURRENT STATE: Object {a: 2, b: "good"}
*/
```

## API Reference

### new Store(initialState, actions[, name])

Create a store instance. You can create multiple stores in your app.

Parameters:

- `initialState` is the initial state, it can be any type.
- `actions` is all the actions that work for this store. It looks like this:
  ```javascript
  const actions = {
    someFooAction(draftState, params) {
      // do something
    },
    someBarAction: draftState => {
      // do something
    },
    async someAsyncAction(draftState) {
      // do some async works
    },
  };
  ```
  The signature of action function is:
  ```javascript
  (draftState[, actionParams]) => {
    // To mutate draftState directly!
    // No need to return anything!
    // Changes will be merged into real state object immutably.
  }
  ```
- `name` is optional. It will give this store instance a name. If you don't give it a name, it's default name is \`NO*NAME_STORE*\${Date.now()}\`.

### Store#getState()

Get the latest state object. Keep in mind that you shouldn't mutate the state object directly. It will not take effect until next `Store#dispatch` and may cause your app broken.

### Store#subscribe(listener)

Subscribe the changes of state. Once the state are changed by `Store#dispatch`, the `listener` will be called.

It returns a function to let you unsubscribe this listener:

```javascript
const unSubscribe = store.subscribe(listener);
unSubscribe();
```

#### listener

The `listener` is a function with the following signature:

```typescript
/**
 * Listener type
 *
 * @template T the type of your state
 */
export type Listener<T = any> = (type?: string, prevState?: T) => void;
```

- `type` lets you know which action causes this change.
- `prevState` lets you know the previous state.
- You can call `Store#getState` in `listener` to get the latest state.

A basic example of using `type` and `prevState`:

```javascript
// final-state-logger
store.subscribe((type, prevState) =>
  console.log(type, prevState, store.getState()),
);
```

### Store#unSubscribe(listener)

Unsubscribe a listener. The `listener` should exactly be same with the one passed to `Store#subscribe`.

### Store#dispatch(action[, params]) **_[overload]_**

```typescript
// definition
/**
 * An overload of dispatch
 *
 * Dispatch an action that has been defined and named.
 * @param {string} action the name of action
 * @param {K} params the type of your action parameters
 * @template K the type of your action parameters
 * @returns a promise to indicate the action is totally finished
 */
public dispatch<K = undefined>(action: string, params?: K): Promise<void>;
```

Dispatch an action to alter state.

The first parameter `action` is the name of the action function which will be triggered.

The second parameter `params` is the dynamic values that are used by action function.

It returns a `Promise` to indicate whether the action is totally finished.

```javascript
store.dispatch(...).then(() => {
  // action is totally finished
});
```

**⚡️️️️️️️Important Notes!!!**

When you dispatch an async action like this:

```javascript
const actions = {
  async someAsyncAction(draftState) {...},
};
// ...
store.dispatch('someAsyncAction');
// store.getState() is still old state

store.dispatch('someAsyncAction').then(() => {
  // store.getState() is the latest state
});
```

You can't get the latest state right after dispatching. Because as it's name says, it is asynchronous.

### Store#dispatch(action[, params]) **_[overload]_**

```typescript
// definition
/**
 * An overload of dispatch
 *
 * Dispatch an action that is defined temporarily
 * @param {Action<T, K>} action the action function
 * @param {K} params the type of your action parameters
 * @template K the type of your action parameters
 * @returns a promise to indicate the action is totally finished
 */
public dispatch<K = undefined>(
  action: Action<T, K>,
  params?: K,
): Promise<void>;
```

Dispatch an action to alter state.

The first parameter `action` is the action function which will be triggered.

The second parameter `params` is the dynamic values that are used by action function.

It returns a `Promise` to indicate whether the action is totally finished.

Async action function is also supported.

### Store#registerActionHandler(name, handler)

Anyone can write his own action handler to handle the custom actions.

The first parameter `name` is the name of your handler.

The second parameter `handler` is a function with the following signature:

```typescript
/**
 * Type of plugin handler to handle actions
 * @param {PluginAction} pluginAction the action object of plugins
 * @param {any} params the parameters of action
 */
export type ActionHandler = (pluginAction: PluginAction, params?: any) => void;
```

Let's see a simple example:

```javascript
// Register a custom handler that can handle observable actions
import { Observable } from 'rxjs';
import Store from 'final-state';

const initialState = {
  a: 0,
};

const actions = {
  increaseA(draftState, n = 1) {
    draftState.a += n;
  },
  rxIncreaseA: {
    handler: 'rx',
    action(n = 1) {
      return new Observable(subscriber => {
        subscriber.next(['increaseA', n]);
        setTimeout(() => {
          subscriber.next('increaseA');
          subscriber.complete();
        }, 200);
      });
    },
  },
};

const store = new Store(initialState, actions, 'custom-handler-example-store');

store.registerActionHandler('rx', (pluginAction, params) => {
  return new Promise((resolve, reject) => {
    pluginAction.action(params).subscribe({
      next(value) {
        if (Array.isArray(value)) {
          store.dispatch(...value);
        } else if (typeof value === 'string') {
          store.dispatch(value);
        }
      },
      error: reject,
      complete() {
        resolve();
      },
    });
  });
});

store.dispatch('rxIncreaseA', 5);

// a = 5 now
// after 1000 milliseconds, a = 6
```

## Use with `typescript`

```typescript
import Store, { Action, ActionMap } from 'final-state';

// Define state shape
interface State {
  a: number;
  b: string;
}

// Define initial state
const initialState: State = {
  a: 1,
  b: 'good',
};

// Define actions
const actions: ActionMap<State> = {
  increaseA(draftState, n = 1) {
    draftState.a += n;
  },
};

// Create store instance
const store = new Store<State>(initialState, actions);

// Print state
console.log('INITIAL STATE:', store.getState());

// Define a listener to listen the changes of state
function listener() {
  // Print state
  console.log('IN SUBSCRIBE LISTENER:', store.getState());
}

// Subscribe the changes of state
store.subscribe(listener);

// Dispatch action
store.dispatch('increaseA');

// Print state
console.log('CURRENT STATE:', store.getState());

store.unSubscribe(listener);

/* Output will be:
INITIAL STATE: Object {a: 1, b: "good"}
IN SUBSCRIBE LISTENER: Object {a: 2, b: "good"}
CURRENT STATE: Object {a: 2, b: "good"}
*/
```

## Test

This project uses [jest](https://jestjs.io/) to perform testing.

```bash
yarn test
```
