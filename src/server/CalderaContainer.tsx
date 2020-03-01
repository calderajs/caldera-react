import assertNever from "assert-never";
import React from "react";
import ReactReconciler from "react-reconciler";
import v8 from "v8";
import { SessionID } from ".";
import { getDebugEventType } from "../rpc/debug";
import {
  CalderaRPCEvent,
  CalderaRPCMessage,
  EventType,
  GenericDOMEvent,
  MessageType,
  NodeID
} from "../rpc/messages";
import { Dispatcher } from "./dispatcher";
import { CalderaElement, CalderaInputElement } from "./instances";
import { walkFiberRoot } from "./walkFiberRoot";
import { HooksInjector } from "./HooksInjector";

export const CalderaContext = React.createContext<{
  dispatch: (msg: CalderaRPCMessage) => void;
  requestFlush: () => void;
  savedState?: any[];
  nextHeadElementId: number;
}>({
  dispatch: () => {
    throw new Error("not implemented");
  },
  requestFlush: () => {
    throw new Error("not implemented");
  },
  savedState: [],
  nextHeadElementId: 0
});

export default class CalderaContainer {
  readonly sessionId: SessionID;
  readonly elementRefs: Map<SessionID, Map<NodeID, CalderaElement>>;
  readonly reconciler: ReactReconciler.Reconciler<
    unknown,
    unknown,
    unknown,
    unknown
  >;
  readonly dispatcher: Dispatcher;
  readonly sessionElementRefs: Map<NodeID, CalderaElement>;
  readonly container: ReactReconciler.FiberRoot;

  constructor(
    sessionId: SessionID,
    elementRefs: Map<SessionID, Map<NodeID, CalderaElement>>,
    reconciler: ReactReconciler.Reconciler<unknown, unknown, unknown, unknown>,
    dispatcher: Dispatcher,
    savedState: any[] | undefined,
    rootEl: React.ReactElement
  ) {
    this.sessionId = sessionId;
    this.elementRefs = elementRefs;
    this.dispatcher = dispatcher;
    this.reconciler = reconciler;

    const sessionElementRefs = new Map<NodeID, CalderaElement>();
    elementRefs.set(sessionId, sessionElementRefs);
    this.sessionElementRefs = sessionElementRefs;
    this.container = reconciler.createContainer(sessionId, false, false);

    const initialContext = {
      dispatch: (msg: CalderaRPCMessage) =>
        this.dispatcher.dispatch(this.sessionId, msg),
      requestFlush: () => dispatcher.requestFlush(this.sessionId),
      savedState,
      nextHeadElementId: 0
    };

    reconciler.updateContainer(
      <CalderaContext.Provider value={initialContext}>
        <HooksInjector>{rootEl}</HooksInjector>
      </CalderaContext.Provider>,
      this.container,
      null,
      () => {
        initialContext.savedState = undefined;
        dispatcher.unlockFlush(this.sessionId);
        dispatcher.requestFlush(this.sessionId);
      }
    );
  }

  getCallbackFor(node: CalderaElement | undefined, e: GenericDOMEvent) {
    const callbackRef = node?._calderaCallbackRefs?.find(
      ([eventName]) => eventName === e.name
    );
    if (!callbackRef) {
      throw new Error(
        `Failed to find ${e.name} on node ${node?._calderaNodeId}@${this.sessionId}`
      );
    }
    return callbackRef[1];
  }

  dispatchEvent(e: CalderaRPCEvent) {
    console.log("Received event", { ...e, event: getDebugEventType(e.event) });

    switch (e.event) {
      case EventType.PING: {
        this.dispatcher.dispatch(
          this.sessionId,
          {
            msg: MessageType.PONG,
            nonce: e.nonce
          },
          true
        );
        break;
      }
      case EventType.DOM_INPUT_EVENT:
      case EventType.DOM_EVENT: {
        const target = this.sessionElementRefs.get(e.target);

        // Prevent a malformed client call from crashing the whole event loop
        // TODO: Evaluate error handling (disconnect? React error boundaries?)
        // Also prevent state mis-syncing too badly (batched updates?)
        try {
          if (e.event === EventType.DOM_INPUT_EVENT) {
            if (target instanceof CalderaInputElement) {
              target.value = e.value;
              target.checked = e.checked;
            } else {
              console.error(
                `Received DOMInputEvent on non-input target ${e.target}@${this.sessionId}`
              );
            }
          }

          // TODO: type this better
          let event = {
            type: e.name,
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            defaultPrevented: false,
            preventDefault: e.cancelable
              ? () => {
                  event.defaultPrevented = true;
                }
              : () => {},
            target
          };

          // Match ReactDOM behavior (batch when triggering event dispatch callbacks)
          this.dispatcher.lockFlush(this.sessionId);
          if (e.bubbles) {
            const callbacks = e.composedPath.map(nodeId =>
              this.getCallbackFor(this.sessionElementRefs.get(nodeId), e)
            );

            const bubblingEvent = {
              ...event,
              _calderaPropagating: true,
              stopPropagation: () => {
                bubblingEvent._calderaPropagating = false;
              }
            };

            for (const callback of callbacks) {
              callback(bubblingEvent);
              if (!bubblingEvent._calderaPropagating) {
                break;
              }
            }
          } else {
            const callback = this.getCallbackFor(target, e);
            callback(event);
          }
          this.dispatcher.unlockFlush(this.sessionId);

          // Only redispatch events that support cancellation
          if (e.cancelable && !event.defaultPrevented) {
            this.dispatcher.dispatch(this.sessionId, {
              msg: MessageType.DISPATCH_EVENT,
              name: e.name,
              target: e.target,
              performDefault: true
            });
          }

          this.dispatcher.requestFlush(this.sessionId);
        } catch (e) {
          console.error(e.message);
          console.error(
            `Failed to dispatch ${e.name} on ${e.nodeId}@${this.sessionId}`,
            e
          );
        }
        break;
      }
      default:
        assertNever(e);
    }
  }

  serializeState() {
    return v8.serialize(walkFiberRoot(this.container.current));
  }

  shutdown() {
    return new Promise<void>(resolve => {
      this.reconciler.updateContainer(null, this.container, null, () => {
        this.elementRefs.delete(this.sessionId);
        resolve();
      });
    });
  }
}
