[![Build Status](https://travis-ci.com/final-state/final-state.svg?branch=master)](https://travis-ci.com/final-state/final-state)
[![Known Vulnerabilities](https://snyk.io/test/github/final-state/final-state/badge.svg)](https://snyk.io/test/github/final-state/final-state)

# final-state

> A lightweight, framework agnostic state management.

## Installation

```bash
yarn add final-state
# or
npm install final-state
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

// Create store instance
const store = new Store(initialState);

// Print state
console.log('INITIAL STATE:', store.getState());

// Define a listener to listen the changes of state
function listener() {
  // Print state
  console.log('IN SUBSCRIBE LISTENER:', store.getState());
}

// Subscribe the changes of state
store.subscribe(listener);

// Define an action to alter state
function incrementAction(draftState) {
  draftState.a = draftState.a + 1;
}

// Dispatch action
store.dispatch(incrementAction);

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

### new Store(initialState)

Create a store instance by passing in the initial state of your app.

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
export type Listener<T> = (prevState?: T) => void;
```

It passes a `prevState` as function parameter to let you know the previous state. You can call `Store#getState` in `listener` to get the latest state.

A basic example of using `prevState`:

```javascript
// final-state-logger
store.subscribe(prevState => console.log(prevState, store.getState()));
```

### Store#unSubscribe(listener)

Unsubscribe a listener. The `listener` should exactly be same with the one passed to `Store#subscribe`.

### Store#dispatch(action[, actionParams])

Dispatch an action to alter state. Each time `dispatch` is called, all the listeners registered by `Store#subscribe` will be called. The `action` is a special callback function with the following signature:

```javascript
(draftState[, actionParams]) => {
  // To mutate draftState directly!
  // No need to return anything!
  // Changes will be merged into real state object immutably.
}
```

It's inner implementation is:

```javascript
// pseudocode
import { produce } from 'immer';
produce(state, action);
```

## Use with `typescript`

```typescript
import Store, { Action } from 'final-state';

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

// Create store instance
const store = new Store<State>(initialState);

// Print state
console.log('INITIAL STATE:', store.getState());

// Define a listener to listen the changes of state
function listener() {
  // Print state
  console.log('IN SUBSCRIBE LISTENER:', store.getState());
}

// Subscribe the changes of state
store.subscribe(listener);

// Define an action to alter state
const incrementAction: Action<State> = draftState => {
  draftState.a = draftState.a + 1;
};

// Dispatch action
store.dispatch(incrementAction);

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
