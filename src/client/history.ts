import { createBrowserHistory } from "history";
import { EventType, HistoryAction, HistoryMessage } from "../rpc/messages";
import { dispatchEvent } from "./index";

const history = createBrowserHistory();

const actionEnumMapping = {
  PUSH: HistoryAction.PUSH,
  POP: HistoryAction.POP,
  REPLACE: HistoryAction.REPLACE
} as const;

let unsubscribeListener: (() => void) | null = null;

export const registerHistoryListener = () => {
  if (!unsubscribeListener) {
    unsubscribeListener = history.listen((location, action) => {
      dispatchEvent({
        event: EventType.HISTORY_EVENT,
        action: actionEnumMapping[action],
        path: location.pathname + location.search
      });
    });
  } else {
    throw new Error(
      "Attempted to register history listener when already registered"
    );
  }
};

export const cleanupHistoryListener = () => unsubscribeListener?.();

export const handleHistory = (data: HistoryMessage) => {};
