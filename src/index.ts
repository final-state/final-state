/* eslint @typescript-eslint/no-explicit-any:0 */
import { produce, Draft } from 'immer';

/**
 * Action type
 *
 * `draftState` is a `Draft` of your state
 *
 * `Draft` is a `immer` object
 *
 * You can modify `draftState` as you like in this function
 *
 * `immer` will merge draft to state immutably
 *
 * @template T the type of your state
 * @template K the type of your action parameters
 *
 * @returns void | Promise
 */
export type Action<T = any, K = undefined> = (
  draftState: Draft<T>,
  actionParams?: K,
) => void | Promise<undefined>;

/**
 * Listener type
 *
 * @template T the type of your state
 */
export type Listener<T = any> = (type?: string, prevState?: T) => void;

/**
 * Action map
 */
export interface ActionMap<T> {
  [type: string]: Action<T, any>;
}

/**
 * class Store
 *
 * Manage all state
 *
 * @constructor (initialState: T) initialState is your initial state object
 *
 * @template T the type of your state
 */
export default class Store<T = any> {
  /**
   * state object
   * @template T the type of your state
   */
  private state: T;

  /**
   * actions
   */
  private actions: ActionMap<T>;

  /**
   * store's name
   */
  public name: string;

  /**
   * all subscription listeners
   */
  private listeners: Listener<T>[] = [];

  /**
   * @constructor
   * @param {T} initialState the initial state object
   * @template T the type of your state
   */
  public constructor(
    initialState: T,
    actions: ActionMap<T>,
    name: string = `NO_NAME_STORE_${Date.now()}`,
  ) {
    this.state = initialState;
    this.actions = actions;
    this.name = `Store[${name}]`;
  }

  /**
   * @public Get latest state object
   */
  public getState() {
    return this.state;
  }

  /**
   * @public dispatch an `Action` to modify state
   * @param {string} type the action's name
   * @param {any} params the parameters passed to action
   */
  public dispatch(type: string, params?: any) {
    const action = this.actions[type];
    if (action === undefined) {
      // eslint-disable-next-line no-console
      console.error(`The action '${type}' is not exist.`);
      return;
    }
    const nextState = produce(this.state, draftState =>
      action(draftState, params),
    );
    if (nextState instanceof Promise) {
      nextState.then(state => this.triggerListeners(type, state));
    } else {
      this.triggerListeners(type, nextState);
    }
  }

  /**
   * @public dispatch an `Action` to modify state
   * @param {Action<T, K>} action the action to modify state
   * @param {K} params the parameters passed to action
   * @template K the type of your action parameters
   */
  public dispatchAction<K = undefined>(action: Action<T, K>, params?: K) {
    const nextState = produce(this.state, draftState =>
      action(draftState, params),
    );
    if (nextState instanceof Promise) {
      nextState.then(state => this.triggerListeners('NO_TYPE', state));
    } else {
      this.triggerListeners('NO_TYPE', nextState);
    }
  }

  private triggerListeners(type: string, nextState: T) {
    // only update state and trigger listeners when state **really** changed
    if (this.state !== nextState) {
      const prevState = this.state;
      this.state = nextState;
      this.listeners.forEach(listener => listener(type, prevState));
    }
  }

  /**
   * @public subscribe the changes of state
   * @param {Listener<T>} listener listener will be triggered after `dispatch` is called.
   * @template T the type of your state
   */
  public subscribe(listener: Listener<T>) {
    this.listeners.push(listener);
  }

  /**
   * @public unsubscribe a listener
   * @param {Listener<T>} listener the listener that used to subscribe
   */
  public unSubscribe(listener: Listener<T>): void {
    const index = this.listeners.findIndex(
      (item): boolean => item === listener,
    );
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }
}
