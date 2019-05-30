/* eslint-disable no-console,no-param-reassign */

import Store from '../dist';

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const actions = {
  increaseA(draftState, n = 1) {
    draftState.a += n;
  },
  toggleC(draftState) {
    draftState.c = !draftState.c;
  },
  async asyncIncreaseA(draftState, n = 1) {
    await sleep(500);
    draftState.a += n;
  },
  doNothing() {},
};

function createContext() {
  const initialState = {
    a: 1,
    b: 'good',
    c: true,
  };
  const store = new Store(initialState, actions, 'test-store');
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
  test("Store instance's name should be same with the one passed in", () => {
    const name = 'name';
    const s = new Store({}, {}, name);
    expect(s.name).toBe(`Store[${name}]`);
  });
  test("Store instance's name should be correct when no name passed in", () => {
    const s = new Store({}, {});
    expect(s.name).toMatch(/^Store\[NO_NAME_STORE_\d+]$/);
  });
});

describe('Store#dispatch', () => {
  const { initialState, store } = createContext();
  test('`incrementAction` should work', () => {
    store.dispatch('increaseA');
    expect(store.getState().a).toBe(initialState.a + 1);
  });
  test('`toggleAction` should work', () => {
    store.dispatch('toggleC');
    expect(store.getState().c).toBe(!initialState.c);
  });
  test('Action with parameters works', () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatch('increaseA', n);
    expect(store.getState().a).toBe(current + n);
  });
  test('Error message will be displayed when dispatch a nonexistent action type', () => {
    const spyError = jest.spyOn(console, 'error');
    expect(spyError).not.toHaveBeenCalled();
    store.dispatch('nonexistent');
    expect(spyError).toHaveBeenCalledTimes(1);
    expect(spyError).toHaveBeenCalledWith(
      `The action 'nonexistent' is not exist.`,
    );
    spyError.mockClear();
  });
  test('Async action works', async () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatch('asyncIncreaseA', n);
    await sleep(600);
    expect(store.getState().a).toBe(current + n);
  });
});

describe('Store#dispatchAction', () => {
  const { initialState, store } = createContext();
  test('`incrementAction` should work', () => {
    store.dispatchAction(actions.increaseA);
    expect(store.getState().a).toBe(initialState.a + 1);
  });
  test('`toggleAction` should work', () => {
    store.dispatchAction(actions.toggleC);
    expect(store.getState().c).toBe(!initialState.c);
  });
  test('Action with parameters works', () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatchAction(actions.increaseA, n);
    expect(store.getState().a).toBe(current + n);
  });
  test('Async action works', async () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatchAction(actions.asyncIncreaseA, n);
    await sleep(600);
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
    store.dispatch('doNothing');
    expect(listenerRunned).toBe(0);
    store.dispatch('doNothing');
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
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(1);
    store.dispatch('increaseA');
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
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(1);
    store.unSubscribe(() => {});
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(2);
    store.unSubscribe(listener);
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(2);
  });
  test('Listener can access the previous state', () => {
    const { store } = createContext();
    let t = null;
    let prev = null;
    function listener(type, prevState) {
      t = type;
      prev = prevState;
    }
    store.subscribe(listener);
    store.dispatch('increaseA');
    expect(t).toBe('increaseA');
    expect(prev.a).toBe(1);
    expect(store.getState().a).toBe(2);
    store.dispatch('toggleC');
    expect(t).toBe('toggleC');
    expect(prev.c).toBe(true);
    expect(store.getState().c).toBe(false);
  });
});
