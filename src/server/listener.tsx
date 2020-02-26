import { useState, useEffect, useCallback } from "react";
export type ListenerType = string;
type Listener = (v: any) => void;

export interface SharedResource<T> {
  getValue: () => T;
  addListener: (listener: (value: T) => void) => void;
  removeListener: (listener: (value: T) => void) => void;
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
      currValue = newValue;
      listeners.forEach(listener => listener(currValue));
    }
  };
};

export const useSharedState = <T,>(resource: SharedResource<T>) => {
  const [value, setValue] = useState(resource.getValue());

  useEffect(() => {
    setValue(resource.getValue());
    resource.addListener(setValue);
    return () => resource.removeListener(setValue);
  }, [resource]);

  const updateValue = useCallback((val: T) => resource.updateListeners(val), [
    resource
  ]);
  return [value, updateValue] as const;
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
