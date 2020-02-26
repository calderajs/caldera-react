import React, { useContext } from "react";
import { CalderaContext } from "./CalderaContainer";

/* Hacked */
const origUseState = React.useState;
const newUseState = (initialState: any) => {
  /* eslint-disable react-hooks/rules-of-hooks */
  const { savedState } = useContext(CalderaContext);
  return origUseState(
    savedState !== undefined ? savedState.shift() : initialState
  );
};
React.useState = newUseState as any;

const origUseReducer = React.useReducer;
const newUseReducer = (reducer: any, initialArg: any, init?: any) => {
  /* eslint-disable react-hooks/rules-of-hooks */
  const { savedState } = useContext(CalderaContext);
  return savedState !== undefined
    ? origUseReducer(reducer, savedState.shift())
    : origUseReducer(reducer, initialArg, init);
};
React.useReducer = newUseReducer;
