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
 */
export type Action<T = any, K = undefined> = (
  draftState: Draft<T>,
  actionParams?: K,
) => void;

/**
 * Listener type
 *
 * @template T the type of your state
 */
export type Listener<T = any> = (prevState?: T) => void;

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
   * all subscription listeners
   */
  private listeners: Listener<T>[] = [];

  /**
   * @constructor
   * @param {T} initialState the initial state object
   * @template T the type of your state
   */
  public constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * @public Get latest state object
   */
  public getState() {
    return this.state;
  }

  /**
   * @public dispatch an `Action` to modify state
   * @param {Action<T>} action the action to modify state
   * @template T the type of your state
   * @template K the type of your action parameters
   *
   * All listeners will be triggered after this method is called.
   */
  public dispatch<K = undefined>(action: Action<T, K>, actionParams?: K) {
    const nextState = produce(this.state, (draftState: Draft<T>) =>
      action(draftState, actionParams),
    );
    // only update state and trigger listeners when state **really** changed
    if (this.state !== nextState) {
      const prevState = this.state;
      this.state = nextState;
      this.listeners.forEach(listener => listener(prevState));
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
