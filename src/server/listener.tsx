import { useCallback, useEffect } from "react";
import { useForceRender } from "./useForceRender";
export type ListenerType = string;
type Listener = () => void;

export interface SharedResource<T> {
  getValue: () => T;
  addListener: (listener: () => void) => void;
  removeListener: (listener: () => void) => void;
  updateListeners: (value: T) => void;
}

export const makeSharedResource = <T,>(initialValue: T): SharedResource<T> => {
  let currValue: T = initialValue;
  const listeners: Set<Listener> = new Set();

  return {
    getValue: () => currValue,
    addListener: (listener: Listener) => listeners.add(listener),
    removeListener: (listener: Listener) => listeners.delete(listener),
    updateListeners: (newValue: T) => {
      if (currValue !== newValue) {
        currValue = newValue;
        listeners.forEach(listener => listener());
      }
    }
  };
};

export const useSharedState = <T,>(resource: SharedResource<T>) => {
  const forceRender = useForceRender();

  useEffect(() => {
    resource.addListener(forceRender);
    return () => resource.removeListener(forceRender);
  }, [forceRender, resource]);

  return [resource.getValue(), resource.updateListeners] as const;
};

type Reducer<S, A> = (prevState: S, action: A) => S;

export const useSharedReducer = <S, A>(
  dispatch: Reducer<S, A>,
  resource: SharedResource<S>
) => {
  const [state, setState] = useSharedState(resource);
  return [
    state,
    useCallback((action: A) => setState(dispatch(state, action)), [
      dispatch,
      setState,
      state
    ])
  ] as const;
};
