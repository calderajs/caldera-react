import { Nominal } from "simplytyped";
import { SessionID } from "../server";

export type Type = string;
export type NodeID = Nominal<number, "NodeID">;
export const DOCUMENT_ROOT_ID = 0 as NodeID;
export type HeadElementID = Nominal<number, "HeadElementID">;

export const enum MessageType {
  SET_SESSION_TOKEN,
  CREATE_ELEMENT,
  CREATE_TEXT,
  UPDATE_TEXT,
  APPEND_CHILD,
  REMOVE_CHILD,
  INSERT_BEFORE,
  SET_INITIAL_ATTRS,
  UPDATE_ATTRS,
  SCROLL_INTO_VIEW,
  DISPATCH_EVENT,
  DISPATCH_KEY_EVENT,
  PONG,
  APPEND_OR_UPDATE_HEAD,
  DELETE_HEAD
}

export const CALDERA_SESSION_TOKEN_COOKIE = "caldera-session-token";

export interface SetSessionTokenMessage {
  msg: MessageType.SET_SESSION_TOKEN;
  token: SessionID;
}

export interface CreateElementMessage {
  msg: MessageType.CREATE_ELEMENT;
  nodeId: NodeID;
  type: Type;
}

export interface CreateTextMessage {
  msg: MessageType.CREATE_TEXT;
  textId: NodeID;
  text: string;
}

export interface UpdateTextMessage {
  msg: MessageType.UPDATE_TEXT;
  textId: NodeID;
  text: string;
}

export interface AppendChildMessage {
  msg: MessageType.APPEND_CHILD;
  nodeId: NodeID;
  childId: NodeID;
}

export interface RemoveChildMessage {
  msg: MessageType.REMOVE_CHILD;
  nodeId: NodeID;
  childId: NodeID;
}

export interface InsertBeforeMessage {
  msg: MessageType.INSERT_BEFORE;
  nodeId: NodeID;
  childId: NodeID;
  beforeChildId: NodeID;
}

export interface SetInitialAttrsMessage {
  msg: MessageType.SET_INITIAL_ATTRS;
  nodeId: NodeID;
  attrs: Record<string, any>;
}

export interface UpdateAttrsMessage {
  msg: MessageType.UPDATE_ATTRS;
  nodeId: NodeID;
  updateAttrs: Record<string, any>;
  removeAttrs: Record<string, boolean>;
}

// Non-reconciler functionality
export interface DispatchEventMessage {
  msg: MessageType.DISPATCH_EVENT;
  target: NodeID;
  name: string;
  performDefault: boolean;
}

export interface DispatchKeyEventMessage {
  msg: MessageType.DISPATCH_KEY_EVENT;
  target: NodeID;
  name: string;
  key: string;
  code: string;
  location: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
}

export interface ScrollIntoViewMessage {
  msg: MessageType.SCROLL_INTO_VIEW;
  target: NodeID;
  options: ScrollIntoViewOptions;
}

export interface AppendOrUpdateHeadMesage {
  msg: MessageType.APPEND_OR_UPDATE_HEAD;
  elementId: HeadElementID;
  type: Type;
  attrs: Record<string, any>;
}

export interface DeleteHeadMesage {
  msg: MessageType.DELETE_HEAD;
  elementId: HeadElementID;
}

export interface PongMessage {
  msg: MessageType.PONG;
  nonce: number;
}

export type CalderaRPCMessage =
  | SetSessionTokenMessage
  | CreateElementMessage
  | CreateTextMessage
  | UpdateTextMessage
  | AppendChildMessage
  | RemoveChildMessage
  | InsertBeforeMessage
  | SetInitialAttrsMessage
  | UpdateAttrsMessage
  | ScrollIntoViewMessage
  | DispatchEventMessage
  | DispatchKeyEventMessage
  | AppendOrUpdateHeadMesage
  | DeleteHeadMesage
  | PongMessage;

export interface CalderaRPCCallback {
  __calderaRPCCallbackBrand: true;
}

export const enum EventType {
  DOM_EVENT,
  DOM_INPUT_EVENT,
  DOM_KEY_EVENT,
  PING
}

export type GenericDOMEvent = {
  target: NodeID;
  name: string;
  cancelable: boolean;
} & ({ bubbles: true; composedPath: NodeID[] } | { bubbles: false });

export type SimpleDOMEvent = GenericDOMEvent & { event: EventType.DOM_EVENT };

export type DOMInputEvent = GenericDOMEvent & {
  event: EventType.DOM_INPUT_EVENT;
  value: string;
  checked: boolean;
};

export type DOMKeyEvent = GenericDOMEvent & {
  event: EventType.DOM_KEY_EVENT;
  key: string;
  code: string;
  location: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  repeat: boolean;
};

export type PingEvent = { event: EventType.PING; nonce: number };

export type CalderaRPCEvent =
  | SimpleDOMEvent
  | DOMInputEvent
  | DOMKeyEvent
  | PingEvent;
