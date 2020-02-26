import { MessageType, EventType } from "./messages";

export const getDebugMessageType = (type: MessageType): string => {
  switch (type) {
    case MessageType.SET_SESSION_TOKEN: {
      return "SET_SESSION_TOKEN";
    }
    case MessageType.CREATE_ELEMENT: {
      return "CREATE_ELEMENT";
    }
    case MessageType.CREATE_TEXT: {
      return "CREATE_TEXT";
    }
    case MessageType.UPDATE_TEXT: {
      return "UPDATE_TEXT";
    }
    case MessageType.APPEND_CHILD: {
      return "APPEND_CHILD";
    }
    case MessageType.REMOVE_CHILD: {
      return "REMOVE_CHILD";
    }
    case MessageType.INSERT_BEFORE: {
      return "INSERT_BEFORE";
    }
    case MessageType.SET_INITIAL_ATTRS: {
      return "SET_INITIAL_ATTRS";
    }
    case MessageType.UPDATE_ATTRS: {
      return "UPDATE_ATTRS";
    }
    case MessageType.SCROLL_INTO_VIEW: {
      return "SCROLL_INTO_VIEW";
    }
    case MessageType.DISPATCH_EVENT: {
      return "DISPATCH_EVENT";
    }
    case MessageType.PONG: {
      return "PONG";
    }
    case MessageType.APPEND_OR_UPDATE_HEAD: {
      return "APPEND_OR_UPDATE_HEAD";
    }
    case MessageType.DELETE_HEAD: {
      return "DELETE_HEAD";
    }
  }
};

export const getDebugEventType = (type: EventType): string => {
  switch (type) {
    case EventType.DOM_EVENT: {
      return "DOM_EVENT";
    }
    case EventType.DOM_INPUT_EVENT: {
      return "DOM_INPUT_EVENT";
    }
    case EventType.PING: {
      return "PING";
    }
  }
};
