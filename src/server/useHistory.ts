import { useContext, useEffect, useMemo } from "react";
import { HistoryMethod, MessageType } from "../rpc/messages";
import { CalderaContext } from "./CalderaContainer";
import { updateHistory } from "./history";
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

export const useHistory = () => {
  const { history, dispatch } = useContext(CalderaContext);

  return useMemo(() => {
    const push = (path: string) => {
      dispatch({
        msg: MessageType.HISTORY,
        method: HistoryMethod.PUSH,
        path
      });
      updateHistory(history, path);
    };

    const replace = (path: string) => {
      dispatch({
        msg: MessageType.HISTORY,
        method: HistoryMethod.REPLACE,
        path
      });
      updateHistory(history, path);
    };

    const go = (delta: number) => {
      dispatch({
        msg: MessageType.HISTORY,
        method: HistoryMethod.GO,
        delta
      });
      // Optimism not implemented
      // until we replicate browser history behavior here
    };

    const goBack = () => go(-1);
    const goForward = () => go(1);

    return { push, replace, go, goBack, goForward };
  }, [dispatch, history]);
};
