import assertNever from "assert-never";
import Pbf from "pbf";
import {
  AppendChildMessage,
  AppendOrUpdateHeadMessage,
  CreateElementMessage,
  CreateTextMessage,
  DeleteHeadMessage,
  DispatchEventMessage,
  InsertBeforeMessage,
  PongMessage,
  RemoveChildMessage,
  ScrollIntoViewMessage,
  SetInitialAttrsMessage,
  SetSessionTokenMessage,
  UpdateAttrsMessage,
  UpdateTextMessage,
  HistoryMessage
} from "../generated/rpcMessage.js";
import {
  CalderaRPCMessage,
  MessageType,
  CalderaRPCEvent,
  EventType
} from "./messages";
import {
  SimpleDOMEvent,
  DOMInputEvent,
  PingEvent,
  DOMKeyEvent,
  HistoryEvent
} from "../generated/rpcEvent.js";

const stringifyValues = (obj: object) => {
  const newObj: object = {};
  Object.entries(obj).forEach(
    ([k, v]) => ((newObj as any)[k] = JSON.stringify(v))
  );
  return newObj;
};

const writeRPCMessage = (pbf: Pbf, data: CalderaRPCMessage) => {
  switch (data.msg) {
    case MessageType.SET_SESSION_TOKEN: {
      pbf.writeMessage(data.msg, SetSessionTokenMessage.write, data);
      break;
    }
    case MessageType.CREATE_ELEMENT: {
      pbf.writeMessage(data.msg, CreateElementMessage.write, data);
      break;
    }
    case MessageType.CREATE_TEXT: {
      pbf.writeMessage(data.msg, CreateTextMessage.write, data);
      break;
    }
    case MessageType.UPDATE_TEXT: {
      pbf.writeMessage(data.msg, UpdateTextMessage.write, data);
      break;
    }
    case MessageType.APPEND_CHILD: {
      pbf.writeMessage(data.msg, AppendChildMessage.write, data);
      break;
    }
    case MessageType.REMOVE_CHILD: {
      pbf.writeMessage(data.msg, RemoveChildMessage.write, data);
      break;
    }
    case MessageType.INSERT_BEFORE: {
      pbf.writeMessage(data.msg, InsertBeforeMessage.write, data);
      break;
    }
    case MessageType.SET_INITIAL_ATTRS: {
      pbf.writeMessage(data.msg, SetInitialAttrsMessage.write, {
        ...data,
        attrs: stringifyValues(data.attrs)
      });
      break;
    }
    case MessageType.UPDATE_ATTRS: {
      pbf.writeMessage(data.msg, UpdateAttrsMessage.write, {
        ...data,
        updateAttrs: stringifyValues(data.updateAttrs)
      });
      break;
    }
    case MessageType.DISPATCH_EVENT: {
      pbf.writeMessage(data.msg, DispatchEventMessage.write, data);
      break;
    }
    case MessageType.SCROLL_INTO_VIEW: {
      pbf.writeMessage(data.msg, ScrollIntoViewMessage.write, data);
      break;
    }
    case MessageType.APPEND_OR_UPDATE_HEAD: {
      pbf.writeMessage(data.msg, AppendOrUpdateHeadMessage.write, {
        ...data,
        attrs: stringifyValues(data.attrs)
      });
      break;
    }
    case MessageType.DELETE_HEAD: {
      pbf.writeMessage(data.msg, DeleteHeadMessage.write, data);
      break;
    }
    case MessageType.HISTORY: {
      pbf.writeMessage(data.msg, HistoryMessage.write, data);
      break;
    }
    case MessageType.PONG: {
      pbf.writeMessage(data.msg, PongMessage.write, data);
      break;
    }
    default:
      assertNever(data);
  }
};

export const writeRPCMessages = (data: CalderaRPCMessage[]) => {
  const pbf = new Pbf();
  data.forEach(msg => writeRPCMessage(pbf, msg));
  return pbf.finish();
};

export const writeRPCEvent = (data: CalderaRPCEvent) => {
  const pbf = new Pbf();
  pbf.writeVarint(data.event);
  switch (data.event) {
    case EventType.DOM_EVENT: {
      SimpleDOMEvent.write(data, pbf);
      break;
    }
    case EventType.DOM_INPUT_EVENT: {
      DOMInputEvent.write(data, pbf);
      break;
    }
    case EventType.DOM_KEY_EVENT: {
      DOMKeyEvent.write(data, pbf);
      break;
    }
    case EventType.HISTORY_EVENT: {
      HistoryEvent.write(data, pbf);
      break;
    }
    case EventType.PING: {
      PingEvent.write(data, pbf);
      break;
    }
    default:
      assertNever(data);
  }
  return pbf.finish();
};
