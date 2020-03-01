import React from "react";
import { CalderaContext } from "./CalderaContainer";

export const HooksInjector = ({
  children
}: {
  children: React.ReactElement;
}) => {
  const currentReactDispatcher = (React as any)
    .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
    .current;

  if (!currentReactDispatcher.__CALDERA_PATCHED_HOOK__) {
    const origUseState = currentReactDispatcher.useState;
    const newUseState = (initialState: any) => {
      const { savedState } = currentReactDispatcher.readContext(CalderaContext);
      return origUseState(
        savedState !== undefined ? savedState.shift() : initialState
      );
    };
    currentReactDispatcher.useState = newUseState;

    const origUseReducer = currentReactDispatcher.useReducer;
    const newUseReducer = (reducer: any, initialArg: any, init?: any) => {
      const { savedState } = currentReactDispatcher.readContext(CalderaContext);
      return savedState !== undefined
        ? origUseReducer(reducer, savedState.shift())
        : origUseReducer(reducer, initialArg, init);
    };
    currentReactDispatcher.useReducer = newUseReducer;

    console.log("Injected hooks into React dispatcher");
    currentReactDispatcher.__CALDERA_PATCHED_HOOK__ = true;
  }

  return children;
};
