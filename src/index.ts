/* eslint @typescript-eslint/no-explicit-any:0 */
import { produce, Draft } from 'immer';

/**
 * Type of action for plugins
 * @param {string} handler the name of plugin handler
 * @param {T} action the action that plugins can parse
 * @template T the type of the action that plugins can parse
 */
export interface PluginAction<T = any> {
  handler: string;
  action: T;
}

/**
 * Type of default action
 *
 * You should directly mutate `draftState`, and `immer` will merge draft to state immutably.
 * @param {Draft<T>} draftState a `Draft` of your state, `Draft` is a `immer` object.
 * @param {K} params the parameters of action
 * @template T the type of your state
 * @template K the type of your action parameters
 *
 * @returns void | Promise
 */
export type Action<T = any, K = undefined> = (
  draftState: Draft<T>,
  params?: K,
) => void;

/**
 * Type of plugin handler to handle actions
 * @param {PluginAction} pluginAction the action object of plugins
 * @param {any} params the parameters of action
 */
export type ActionHandler = (
  pluginAction: PluginAction,
  params?: any,
) => Promise<void>;

/**
 * Listener type
 *
 * @template T the type of your state
 */
export type Listener<T = any> = (type: string, prevState: T) => void;

/**
 * Action map
 */
export interface ActionMap {
  [type: string]: Action<any, any> | PluginAction;
}

export interface Store<T = any> {
  name: string;
  getState(): T;
  registerActionHandler(name: string, handler: ActionHandler): void;
  dispatch<K = undefined>(action: string, params?: K): Promise<void>;
  dispatch<K = undefined>(action: Action<T, K>, params?: K): Promise<void>;
  subscribe(listener: Listener<T>): () => void;
  unSubscribe(listener: Listener<T>): void;
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
class StoreClass<T = any> implements Store<T> {
  /**
   * state object
   * @template T the type of your state
   */
  private state: T;

  /**
   * actions
   */
  private actions: ActionMap;

  /**
   * plugin handlers to handle action
   */
  private actionHandlers: {
    [name: string]: ActionHandler;
  } = {};

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
    actions: ActionMap,
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
   * Register a plugin handler to handle action
   * @param {string} name the plugin handler's name
   * @param {ActionHandler} handler the function to handle action
   */
  public registerActionHandler(name: string, handler: ActionHandler) {
    this.actionHandlers[name] = handler;
  }

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

  /**
   * Implementation for overloads
   */
  public dispatch<K = undefined>(
    action: string | Action<T, K>,
    params?: K,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof action === 'string') {
        const theAction = this.actions[action];
        if (theAction === undefined) {
          resolve();
          return;
        }
        const anyAction = theAction as any;
        if (typeof anyAction.handler === 'string') {
          const pluginAction = theAction as PluginAction;
          const handler = this.actionHandlers[pluginAction.handler];
          // this is a runtime check
          if (handler !== undefined) {
            handler(pluginAction, params)
              .then(() => resolve())
              .catch(e => reject(e));
          } else {
            reject(
              new Error(`The handler '${anyAction.handler}' is not registered`),
            );
          }
        } else {
          const normalAction = theAction as Action<T, K>;
          const nextState = produce(this.state, draftState =>
            normalAction(draftState, params),
          );
          this.updateState(action, nextState);
          resolve();
        }
      } else {
        const nextState = produce(this.state, draftState =>
          action(draftState, params),
        );
        this.updateState('NO_TYPE', nextState);
        resolve();
      }
    });
  }

  /**
   * Trigger all listeners
   * @param {string} type the type of the action which causes the changing of state
   * @param {T} nextState the next state
   * @template T the type of your state
   */
  private updateState(type: string, nextState: T) {
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
   *
   * @returns A function to do unsubscription
   */
  public subscribe(listener: Listener<T>) {
    this.listeners.push(listener);
    return () => this.unSubscribe(listener);
  }

  /**
   * @public unsubscribe a listener
   * @param {Listener<T>} listener the listener that used to subscribe
   */
  public unSubscribe(listener: Listener<T>) {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }
}

export function createStore<T>(
  initialState: T,
  actions: ActionMap,
  name?: string,
): Store<T> {
  return new StoreClass(initialState, actions, name);
}
