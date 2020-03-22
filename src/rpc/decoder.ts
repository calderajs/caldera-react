import Pbf from "pbf";
import {
  MessageType,
  CalderaRPCMessage,
  EventType,
  CalderaRPCEvent
} from "./messages";
import assertNever from "assert-never";
import {
  SetSessionTokenMessage,
  CreateElementMessage,
  CreateTextMessage,
  UpdateTextMessage,
  AppendChildMessage,
  RemoveChildMessage,
  InsertBeforeMessage,
  SetInitialAttrsMessage,
  UpdateAttrsMessage,
  DispatchEventMessage,
  ScrollIntoViewMessage,
  AppendOrUpdateHeadMessage,
  DeleteHeadMessage,
  PongMessage,
  HistoryMessage
} from "../generated/rpcMessage";
import {
  SimpleDOMEvent,
  DOMInputEvent,
  PingEvent,
  DOMKeyEvent,
  HistoryEvent
} from "../generated/rpcEvent";

const parseValues = (obj: object) => {
  const newObj: object = {};
  Object.entries(obj).forEach(([k, v]) => ((newObj as any)[k] = JSON.parse(v)));
  return newObj;
};

const readRPCMessage = (tag: number, acc?: CalderaRPCMessage[], pbf?: Pbf) => {
  const type = tag as MessageType;
  const end = pbf!.readVarint() + pbf!.pos;
  let data: any;
  switch (type) {
    case MessageType.SET_SESSION_TOKEN: {
      data = SetSessionTokenMessage.read(pbf, end);
      break;
    }
    case MessageType.CREATE_ELEMENT: {
      data = CreateElementMessage.read(pbf, end);
      break;
    }
    case MessageType.CREATE_TEXT: {
      data = CreateTextMessage.read(pbf, end);
      break;
    }
    case MessageType.UPDATE_TEXT: {
      data = UpdateTextMessage.read(pbf, end);
      break;
    }
    case MessageType.APPEND_CHILD: {
      data = AppendChildMessage.read(pbf, end);
      break;
    }
    case MessageType.REMOVE_CHILD: {
      data = RemoveChildMessage.read(pbf, end);
      break;
    }
    case MessageType.INSERT_BEFORE: {
      data = InsertBeforeMessage.read(pbf, end);
      break;
    }
    case MessageType.SET_INITIAL_ATTRS: {
      data = SetInitialAttrsMessage.read(pbf, end);
      data.attrs = parseValues(data.attrs);
      break;
    }
    case MessageType.UPDATE_ATTRS: {
      data = UpdateAttrsMessage.read(pbf, end);
      data.updateAttrs = parseValues(data.updateAttrs);
      break;
    }
    case MessageType.DISPATCH_EVENT: {
      data = DispatchEventMessage.read(pbf, end);
      break;
    }
    case MessageType.SCROLL_INTO_VIEW: {
      data = ScrollIntoViewMessage.read(pbf, end);
      break;
    }
    case MessageType.APPEND_OR_UPDATE_HEAD: {
      data = AppendOrUpdateHeadMessage.read(pbf, end);
      data.attrs = parseValues(data.attrs);
      break;
    }
    case MessageType.DELETE_HEAD: {
      data = DeleteHeadMessage.read(pbf, end);
      break;
    }
    case MessageType.HISTORY: {
      data = HistoryMessage.read(pbf, end);
      break;
    }
    case MessageType.PONG: {
      data = PongMessage.read(pbf, end);
      break;
    }
    default:
      assertNever(type);
  }
  data.msg = tag;
  acc!.push(data);
};

export const readRPCMessages = (buf: Uint8Array | ArrayBuffer) => {
  const pbf = new Pbf(buf);
  const acc: CalderaRPCMessage[] = [];
  pbf.readFields(readRPCMessage, acc);
  return acc;
};

export const readRPCEvent = (
  buf: Uint8Array | ArrayBuffer
): CalderaRPCEvent => {
  const pbf = new Pbf(buf);
  const event = pbf.readVarint() as EventType;
  let data: any;
  switch (event) {
    case EventType.DOM_EVENT: {
      data = SimpleDOMEvent.read(pbf);
      break;
    }
    case EventType.DOM_INPUT_EVENT: {
      data = DOMInputEvent.read(pbf);
      break;
    }
    case EventType.DOM_KEY_EVENT: {
      data = DOMKeyEvent.read(pbf);
      break;
    }
    case EventType.HISTORY_EVENT: {
      data = HistoryEvent.read(pbf);
      break;
    }
    case EventType.PING: {
      data = PingEvent.read(pbf);
      break;
    }
    default:
      assertNever(event);
  }
  data.event = event;
  return data;
};
