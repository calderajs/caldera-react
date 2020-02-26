import {
  DOMInputEvent,
  EventType,
  NodeID,
  SimpleDOMEvent
} from "../rpc/messages";
import { rebounce } from "./debounce";
import { checkDefaultDispatch, shouldDeferDefault } from "./deferDefault";
import { dispatchEvent, NODE_ID_ATTR, getNode, rootNode } from "./index";
import { getNormalizedEventName } from "./util";

// This diverges from CallbackRef, but we will need to decide on a format
export type Callback = (event: Event) => void;

const eventListenerMap = new Map<NodeID, Map<string, Callback>>();

export const removeCallbackFromNode = (nodeId: NodeID, name: string) => {
  const callbacksForNode = eventListenerMap.get(nodeId);
  const callback = callbacksForNode?.get(name);
  if (!callbacksForNode || !callback) {
    throw new Error(
      `Tried to remove missing event listener ${name} for ${nodeId}`
    );
  }

  // TODO: Optimize
  const normalizedName = getNormalizedEventName(getNode(nodeId), name);
  getNode(nodeId).removeEventListener(normalizedName, callback);
  callbacksForNode.delete(normalizedName);
  if (callbacksForNode.size === 0) {
    eventListenerMap.delete(nodeId);
  }
};

type WithoutPropagationProps<E> = Omit<E, "bubbles" | "composedPath">;

export const addCallbackToNode = (nodeId: NodeID, name: string) => {
  const node = getNode(nodeId);
  const normalizedName = getNormalizedEventName(node, name);

  // TODO: handle passing data in callback
  // onChange (really onInput) works, keyevents need to work
  const callback: Callback = e => {
    if (checkDefaultDispatch(e)) {
      e.stopPropagation();
      return;
    }

    const target = e.target;
    if (
      !(target instanceof HTMLElement) ||
      !target.hasAttribute(NODE_ID_ATTR)
    ) {
      throw new Error(`Received callback with alien target ${target}`);
    }

    const targetId = parseInt(target.getAttribute(NODE_ID_ATTR)!) as NodeID;

    // TODO: always cancel / replicate default behavior after waiting
    // (except for onChange)
    let evtProps:
      | WithoutPropagationProps<SimpleDOMEvent>
      | WithoutPropagationProps<DOMInputEvent>;

    const cancelable = shouldDeferDefault(name);

    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      evtProps = {
        event: EventType.DOM_INPUT_EVENT,
        target: targetId,
        name,
        // TODO: Optional checked
        checked:
          e.target instanceof HTMLInputElement ? e.target.checked : false,
        value: e.target.value,
        cancelable
      };
      if (normalizedName === "input") {
        rebounce(nodeId);
      }
    } else {
      evtProps = {
        event: EventType.DOM_EVENT,
        target: targetId,
        name,
        cancelable
      };
    }

    if (cancelable) {
      e.preventDefault();
    }

    if (e.bubbles) {
      const domComposedPath = e.composedPath();
      e.stopPropagation();

      const selfIndex = domComposedPath.indexOf(node);
      const rootIndex = domComposedPath.indexOf(rootNode);
      const composedPath = domComposedPath
        .slice(selfIndex, rootIndex)
        .flatMap(el => {
          if (el instanceof HTMLElement && el.hasAttribute(NODE_ID_ATTR)) {
            const id = parseInt(el.getAttribute(NODE_ID_ATTR)!) as NodeID;
            if (
              eventListenerMap
                .get(id)
                ?.get(getNormalizedEventName(el, name)) !== undefined
            ) {
              return [id];
            }
          }
          return [];
        });
      dispatchEvent({ ...evtProps, bubbles: true, composedPath });
    } else {
      dispatchEvent({ ...evtProps, bubbles: false });
    }
  };

  let callbacksForNode = eventListenerMap.get(nodeId);
  if (!callbacksForNode) {
    callbacksForNode = new Map<string, Callback>();
    eventListenerMap.set(nodeId, callbacksForNode);
  }

  // TODO: Optimize
  if (callbacksForNode!.get(normalizedName) !== undefined) {
    throw new Error(
      `A ${name} callback has already been registered for ${nodeId}, this shouldn't be happening`
    );
  }

  callbacksForNode!.set(normalizedName, callback);
  node.addEventListener(normalizedName, callback);
};

export const cleanupCallbacks = (nodeId: NodeID) =>
  eventListenerMap.delete(nodeId);

export const clearCallbackHandlers = () => eventListenerMap.clear();
