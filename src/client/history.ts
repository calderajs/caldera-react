import { createBrowserHistory } from "history";
import {
  EventType,
  HistoryAction,
  HistoryMessage,
  HistoryMethod
} from "../rpc/messages";
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

export const handleHistory = (data: HistoryMessage) => {
  switch (data.method) {
    case HistoryMethod.PUSH: {
      history.push(data.path);
      break;
    }
    case HistoryMethod.REPLACE: {
      history.replace(data.path);
      break;
    }
    case HistoryMethod.GO: {
      history.go(data.delta);
      break;
    }
  }
};
