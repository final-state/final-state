/* eslint-disable no-console,no-param-reassign */

import Store from '../dist';

function createContext() {
  const initialState = {
    a: 1,
    b: 'good',
    c: true,
  };
  const store = new Store(initialState);
  return {
    initialState,
    store,
  };
}

describe('Create store & Store#getState', () => {
  const { initialState, store } = createContext();
  test("New store's state should have a same ref with the initial state", () => {
    expect(store.getState()).toBe(initialState);
  });
  test("New store's state should have a same shape with the initial state", () => {
    expect(JSON.stringify(store.getState())).toBe(JSON.stringify(initialState));
  });
});

describe('Store#dispatch', () => {
  const { initialState, store } = createContext();
  function incrementAction(draftState) {
    draftState.a += 1;
  }
  function incrementNAction(draftState, n) {
    draftState.a += n;
  }
  function toggleAction(draftState) {
    draftState.c = !draftState.c;
  }
  test('`incrementAction` should work', () => {
    store.dispatch(incrementAction);
    expect(store.getState().a).toBe(initialState.a + 1);
  });
  test('`toggleAction` should work', () => {
    store.dispatch(toggleAction);
    expect(store.getState().c).toBe(!initialState.c);
  });
  test('Action with parameters works', () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatch(incrementNAction, n);
    expect(store.getState().a).toBe(current + n);
  });
});

describe('Store#subscribe & Store#unSubscribe', () => {
  test("Listener won't be triggered when an action hasn't alter state", () => {
    const { store } = createContext();

    let listenerRunned = 0;
    function listener() {
      listenerRunned += 1;
    }
    store.subscribe(listener);
    expect(listenerRunned).toBe(0);
    store.dispatch(() => {});
    expect(listenerRunned).toBe(0);
    store.dispatch(() => {});
    expect(listenerRunned).toBe(0);
  });
  test('Listener will be triggered when an action altered state', () => {
    const { store } = createContext();
    let listenerRunned = 0;
    function listener() {
      listenerRunned += 1;
    }
    store.subscribe(listener);
    expect(listenerRunned).toBe(0);
    store.dispatch(draftState => {
      draftState.a += 1;
    });
    expect(listenerRunned).toBe(1);
    store.dispatch(draftState => {
      draftState.a += 1;
    });
    expect(listenerRunned).toBe(2);
  });
  test("Listener won't be triggered after unSubscribe", () => {
    const { store } = createContext();
    let listenerRunned = 0;
    function listener() {
      listenerRunned += 1;
    }
    store.subscribe(listener);
    expect(listenerRunned).toBe(0);
    store.dispatch(draftState => {
      draftState.a += 1;
    });
    expect(listenerRunned).toBe(1);
    store.unSubscribe(listener);
    store.dispatch(draftState => {
      draftState.a += 1;
    });
    expect(listenerRunned).toBe(1);
  });
  test('Listener can access the previous state', () => {
    const { store } = createContext();
    let prev = null;
    function listener(prevState) {
      prev = prevState;
    }
    store.subscribe(listener);
    function action(draftState) {
      draftState.a += 1;
    }
    store.dispatch(action);
    expect(prev.a).toBe(1);
    expect(store.getState().a).toBe(2);
    store.dispatch(action);
    expect(prev.a).toBe(2);
    expect(store.getState().a).toBe(3);
  });
});
