import { useReducer } from "react";

const forceRenderReducer = (x: number) => -x;

export const useForceRender = () => {
  const [, forceRender] = useReducer(forceRenderReducer, 1);
  return forceRender;
};
