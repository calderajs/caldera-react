import { createBrowserHistory } from "history";
import { EventType, HistoryAction } from "../rpc/messages";
import { dispatchEvent } from "./index";

const history = createBrowserHistory();

const actionEnumMapping = {
  PUSH: HistoryAction.PUSH,
  POP: HistoryAction.POP,
  REPLACE: HistoryAction.REPLACE
} as const;

let unsubscribeListener: (() => void) | null = null;

export const registerHistoryListener = () => {
  unsubscribeListener = history.listen((location, action) => {
    dispatchEvent({
      event: EventType.HISTORY_EVENT,
      action: actionEnumMapping[action],
      path: location.pathname + location.search
    });
  });
};

export const cleanupHistoryListener = () => unsubscribeListener?.();
