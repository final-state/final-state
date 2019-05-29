[![Build Status](https://travis-ci.com/final-state/final-state.svg?branch=master)](https://travis-ci.com/final-state/final-state)
[![codecov.io](https://codecov.io/gh/final-state/final-state/branch/master/graph/badge.svg)](https://codecov.io/gh/final-state/final-state)
[![Known Vulnerabilities](https://snyk.io/test/github/final-state/final-state/badge.svg)](https://snyk.io/test/github/final-state/final-state)
[![minified + gzip](https://badgen.net/bundlephobia/minzip/final-state@0.2.7)](https://bundlephobia.com/result?p=final-state@0.2.7)
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

### Store#dispatch(type[, params])

Dispatch an action to alter state.

The first parameter `type` is the name of the action function which will be triggered.

The second parameter `params` is the dynamic values that are used by action function.

Each time `dispatch` is called, all the listeners registered by `Store#subscribe` will be called.

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
