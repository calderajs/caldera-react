import {
  NodeID,
  CalderaRPCMessage,
  MessageType,
  ScrollIntoViewMessage
} from "../rpc/messages";
import { SessionID } from ".";
import { Dispatcher } from "./dispatcher";

// We are essentially forced into this design since React refs are just exposed internal instances
export class CalderaNode {
  readonly _calderaSessionId: SessionID;
  readonly _calderaNodeId: NodeID;

  constructor(sessionId: SessionID, nodeId: NodeID) {
    this._calderaSessionId = sessionId;
    this._calderaNodeId = nodeId;
  }
}

export type CallbackRef = [string, Function];

// Non text nodes, exposes focus/blur/value etc
export class CalderaElement extends CalderaNode {
  readonly _calderaDispatcher: Dispatcher;
  _calderaCallbackRefs?: CallbackRef[];

  constructor(sessionId: SessionID, nodeId: NodeID, dispatcher: Dispatcher) {
    super(sessionId, nodeId);
    this._calderaDispatcher = dispatcher;
  }

  _dispatch(msg: CalderaRPCMessage) {
    this._calderaDispatcher.dispatch(this._calderaSessionId, msg);
    this._calderaDispatcher.requestFlush(this._calderaSessionId);
  }

  click() {
    this._dispatch({
      msg: MessageType.DISPATCH_EVENT,
      target: this._calderaNodeId,
      name: "click",
      performDefault: false
    });
  }

  scrollIntoView(options: ScrollIntoViewMessage["options"]) {
    this._dispatch({
      msg: MessageType.SCROLL_INTO_VIEW,
      target: this._calderaNodeId,
      options:
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
        options === true
          ? { block: "start", inline: "nearest" }
          : options === false
          ? { block: "end", inline: "nearest" }
          : options
    });
  }

  // TODO: Optimize out roundtrips for blur/focus/submit
  blur() {
    this._dispatch({
      msg: MessageType.DISPATCH_EVENT,
      target: this._calderaNodeId,
      name: "blur",
      performDefault: false
    });
  }

  focus() {
    this._dispatch({
      msg: MessageType.DISPATCH_EVENT,
      target: this._calderaNodeId,
      name: "focus",
      performDefault: false
    });
  }

  // TODO: Figure out how to hide this without maintaining too much state?
  // Maybe something with getPublicInstanc
  submit() {
    this._dispatch({
      msg: MessageType.DISPATCH_EVENT,
      target: this._calderaNodeId,
      name: "submit",
      performDefault: false
    });
  }
}

export const INPUT_TAGS = ["input", "textarea", "select"];

export class CalderaInputElement extends CalderaElement {
  value: string = "";
  checked: boolean = false;
}
