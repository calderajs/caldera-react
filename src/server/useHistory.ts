import { useContext, useEffect, useMemo } from "react";
import { CalderaContext } from "./CalderaContainer";
import { useForceRender } from "./useForceRender";

export const useLocation = () => {
  const { path, listeners } = useContext(CalderaContext).history;
  const forceRender = useForceRender();

  useEffect(() => {
    listeners.add(forceRender);
    return () => {
      listeners.delete(forceRender);
    };
  });

  return useMemo(() => ({ path }), [path]);
};
