/* eslint-disable no-console,no-param-reassign */
import { Observable } from 'rxjs';
import { createStore } from 'final-state';

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const initialState = {
  a: 1,
  b: 'good',
  c: true,
};

const actions = {
  increaseA(draftState, n = 1) {
    draftState.a += n;
  },
  toggleC(draftState) {
    draftState.c = !draftState.c;
  },
  async asyncIncreaseA(draftState, n = 1) {
    await sleep(200);
    draftState.a += n;
  },
  doNothing() {},
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
  pluginNonexistent: {
    handler: 'nonexistent',
    action() {
      console.log('plugin not exists.');
    },
  },
  rxActionWithError: {
    handler: 'rx',
    action() {
      return new Observable(() => {
        throw new Error('Something went wrong.');
      });
    },
  },
};

describe('Create store & Store#getState', () => {
  const store = createStore(initialState, actions, 'test');
  test("New store's state should have a same ref with the initial state", () => {
    expect(store.getState()).toBe(initialState);
  });
  test("New store's state should have a same shape with the initial state", () => {
    expect(JSON.stringify(store.getState())).toBe(JSON.stringify(initialState));
  });
  test("Store instance's name should be same with the one passed in", () => {
    const name = 'name';
    const s = createStore({}, {}, name);
    expect(s.name).toBe(`Store[${name}]`);
  });
  test("Store instance's name should be correct when no name passed in", () => {
    const s = createStore({}, {});
    expect(s.name).toMatch(/^Store\[NO_NAME_STORE_\d+]$/);
  });
});

describe('Store#dispatch overload 1', () => {
  const store = createStore(initialState, actions, 'test');
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
  test('An exception is thrown when dispatch a nonexistent action type', async () => {
    try {
      await store.dispatch('nonexistent');
    } catch (e) {
      expect(e.message).toBe("The action 'nonexistent' is not exist.");
    }
  });
  test('Async action works', async () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatch('asyncIncreaseA', n);
    await sleep(300);
    expect(store.getState().a).toBe(current + n);
    await store.dispatch('asyncIncreaseA', n);
    expect(store.getState().a).toBe(current + n * 2);
  });
});

describe('Store#dispatch overload 1, plugin action', () => {
  const store = createStore(initialState, actions, 'test');
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
  test('`rxIncreaseA` should work', async () => {
    store.dispatch('rxIncreaseA');
    expect(store.getState().a).toBe(initialState.a + 1);
    await sleep(300);
    expect(store.getState().a).toBe(initialState.a + 2);
    store.dispatch('rxIncreaseA', 5);
    expect(store.getState().a).toBe(initialState.a + 7);
    await sleep(300);
    expect(store.getState().a).toBe(initialState.a + 8);
    await store.dispatch('rxIncreaseA', 10);
    expect(store.getState().a).toBe(initialState.a + 19);
  });
  test('handler plugin not exists will not mutate state and will catch an exception', async () => {
    const state = store.getState();
    try {
      await store.dispatch('pluginNonexistent');
    } catch (e) {
      expect(e.message).toBe("The handler 'nonexistent' is not registered");
    }
    expect(store.getState()).toBe(state);
  });
  test('`rxActionWithError` will throw an exception and we can catch it.', async () => {
    try {
      await store.dispatch('rxActionWithError');
    } catch (e) {
      expect(e.message).toBe('Something went wrong.');
    }
  });
});

describe('Store#dispatch overload 2', () => {
  const store = createStore(initialState, actions, 'test');
  test('`incrementAction` should work', () => {
    store.dispatch(actions.increaseA);
    expect(store.getState().a).toBe(initialState.a + 1);
  });
  test('`toggleAction` should work', () => {
    store.dispatch(actions.toggleC);
    expect(store.getState().c).toBe(!initialState.c);
  });
  test('Action with parameters works', () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatch(actions.increaseA, n);
    expect(store.getState().a).toBe(current + n);
  });
  test('Async action works', async () => {
    const current = store.getState().a;
    const n = 10;
    store.dispatch(actions.asyncIncreaseA, n);
    await sleep(300);
    expect(store.getState().a).toBe(current + n);
    await store.dispatch(actions.asyncIncreaseA, n);
    expect(store.getState().a).toBe(current + n * 2);
  });
});

describe('Store#subscribe & Store#unSubscribe', () => {
  test("Listener won't be triggered when an action hasn't alter state", () => {
    const store = createStore(initialState, actions, 'test');

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
    const store = createStore(initialState, actions, 'test');
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
    const store = createStore(initialState, actions, 'test');
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
  test("Listener won't be triggered after unSubscribe(returned by Subscribe)", () => {
    const store = createStore(initialState, actions, 'test');
    let listenerRunned = 0;
    function listener() {
      listenerRunned += 1;
    }
    const unsubscribe = store.subscribe(listener);
    expect(listenerRunned).toBe(0);
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(1);
    store.unSubscribe(() => {});
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(2);
    unsubscribe();
    store.dispatch('increaseA');
    expect(listenerRunned).toBe(2);
  });
  test('Listener can access the previous state', () => {
    const store = createStore(initialState, actions, 'test');
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
