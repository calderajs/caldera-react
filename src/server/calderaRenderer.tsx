import { performance } from "perf_hooks";
import React from "react";
import ReactReconciler from "react-reconciler";
import v8 from "v8";
import { SessionID } from ".";
import {
  AppendChildMessage,
  CalderaRPCCallback,
  CreateElementMessage,
  CreateTextMessage,
  InsertBeforeMessage,
  MessageType,
  NodeID,
  RemoveChildMessage,
  SetInitialAttrsMessage,
  Type,
  UpdateAttrsMessage,
  UpdateTextMessage,
  DOCUMENT_ROOT_ID
} from "../rpc/messages";
import CalderaContainer from "./CalderaContainer";
import { Dispatcher } from "./dispatcher";
import {
  CalderaElement,
  CalderaInputElement,
  CalderaNode,
  CallbackRef,
  INPUT_TAGS
} from "./instances";

type Props = Record<string, any>;

function isEventName(propName: String) {
  return (
    propName.length > 2 &&
    propName[0] === "o" &&
    propName[1] === "n" &&
    propName[2].toUpperCase() === propName[2]
  );
}

function shallowDiff(oldObj: Props, newObj: Props) {
  const uniqueProps = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const changedProps = Array.from(uniqueProps).filter(
    propName => oldObj[propName] !== newObj[propName]
  );

  return changedProps;
}

const getCallbackListFor = (inst: CalderaElement): CallbackRef[] => {
  if (!inst._calderaCallbackRefs) {
    inst._calderaCallbackRefs = [];
  }
  return inst._calderaCallbackRefs;
};

export const createRenderer = (dispatcher: Dispatcher) => {
  // 0 is reserved for document root
  // TODO: make this session-local
  let nextNodeId = 1;
  const elementRefs = new Map<SessionID, Map<NodeID, CalderaElement>>();
  const updateElementRef = (inst: CalderaElement) => {
    const sessionElementRefs = elementRefs.get(inst._calderaSessionId)!;
    if (!sessionElementRefs.has(inst._calderaNodeId)) {
      sessionElementRefs.set(inst._calderaNodeId, inst);
    }
  };

  // Inspired by https://github.com/jiayihu/react-tiny-dom/blob/master/renderer/tiny-dom.js
  // This really needs to be typed more
  const reconcilerOptions: Partial<ReactReconciler.HostConfig<
    Type,
    Props,
    SessionID,
    CalderaElement,
    CalderaNode,
    any,
    any,
    any,
    any,
    string[],
    any,
    any,
    any
  >> = {
    now: performance.now,
    supportsMutation: true,
    createInstance(
      type,
      props,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    ) {
      const nodeId = nextNodeId++ as NodeID;

      let inst: CalderaElement;
      // TODO: figure out if selects should actually be considered InputElements
      if (INPUT_TAGS.includes(type)) {
        inst = new CalderaInputElement(
          rootContainerInstance,
          nodeId,
          dispatcher
        );
      } else {
        inst = new CalderaElement(rootContainerInstance, nodeId, dispatcher);
      }

      const msg: CreateElementMessage = {
        msg: MessageType.CREATE_ELEMENT,
        nodeId,
        type
      };
      dispatcher.dispatch(rootContainerInstance, msg);
      return inst;
    },
    createTextInstance(
      text,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    ) {
      const textId = nextNodeId++ as NodeID;
      const inst = new CalderaNode(rootContainerInstance, textId);
      const msg: CreateTextMessage = {
        msg: MessageType.CREATE_TEXT,
        textId: textId,
        text
      };
      dispatcher.dispatch(rootContainerInstance, msg);
      return inst;
    },
    commitTextUpdate(textInstance, oldText, newText) {
      const msg: UpdateTextMessage = {
        msg: MessageType.UPDATE_TEXT,
        textId: textInstance._calderaNodeId,
        text: newText
      };
      dispatcher.dispatch(textInstance._calderaSessionId, msg);
    },
    clearContainer(container) {},
    // to root container
    appendChildToContainer(container, child) {
      const sessionId = container;
      const childId = child._calderaNodeId;
      const msg: AppendChildMessage = {
        msg: MessageType.APPEND_CHILD,
        nodeId: DOCUMENT_ROOT_ID,
        childId
      };
      dispatcher.dispatch(sessionId, msg);
    },
    appendChild(parent, child) {
      const msg: AppendChildMessage = {
        msg: MessageType.APPEND_CHILD,
        nodeId: parent._calderaNodeId,
        childId: child._calderaNodeId
      };
      dispatcher.dispatch(parent._calderaSessionId, msg);
    },
    // Not quite sure what this does
    appendInitialChild(parent, child) {
      const msg: AppendChildMessage = {
        msg: MessageType.APPEND_CHILD,
        nodeId: parent._calderaNodeId,
        childId: child._calderaNodeId
      };
      dispatcher.dispatch(parent._calderaSessionId, msg);
    },
    removeChildFromContainer(container, child) {
      const sessionId = container;
      const msg: RemoveChildMessage = {
        msg: MessageType.REMOVE_CHILD,
        nodeId: DOCUMENT_ROOT_ID,
        childId: child._calderaNodeId
      };
      dispatcher.dispatch(sessionId, msg);
      elementRefs.get(sessionId)!.delete(child._calderaNodeId);
    },
    removeChild(parent, child) {
      const msg: RemoveChildMessage = {
        msg: MessageType.REMOVE_CHILD,
        nodeId: parent._calderaNodeId,
        childId: child._calderaNodeId
      };
      dispatcher.dispatch(parent._calderaSessionId, msg);
      elementRefs.get(parent._calderaSessionId)!.delete(child._calderaNodeId);
    },
    insertInContainerBefore(container, child, before) {
      const sessionId = container;
      const msg: InsertBeforeMessage = {
        msg: MessageType.INSERT_BEFORE,
        nodeId: DOCUMENT_ROOT_ID,
        childId: child._calderaNodeId,
        beforeChildId: before._calderaNodeId
      };
      dispatcher.dispatch(sessionId, msg);
    },
    insertBefore(parent, child, before) {
      const msg: InsertBeforeMessage = {
        msg: MessageType.INSERT_BEFORE,
        nodeId: parent._calderaNodeId,
        childId: child._calderaNodeId,
        beforeChildId: before._calderaNodeId
      };
      dispatcher.dispatch(parent._calderaSessionId, msg);
    },
    prepareUpdate(
      instance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      currentHostContext
    ) {
      return shallowDiff(oldProps, newProps);
    },
    commitUpdate(
      instance,
      updatePayload,
      type,
      oldProps,
      newProps,
      finishedWork
    ) {
      const updateAttrs: Record<string, any> = {};
      const removeAttrs: Record<string, any> = {};

      updatePayload.forEach(propName => {
        // children changes is done by the other methods like `commitTextUpdate`
        if (propName === "children") {
        } else if (propName === "style") {
          // Return a diff between the new and the old styles
          const styleDiffs = shallowDiff(oldProps.style, newProps.style);
          const acc: Record<string, any> = {};
          const styleUpdates = styleDiffs.reduce((acc, styleName) => {
            if (!newProps.style[styleName]) acc[styleName] = "";
            else acc[styleName] = newProps.style[styleName];
            return acc;
          }, acc);
          if (Object.keys(styleUpdates).length > 0) {
            updateAttrs["style"] = styleUpdates;
          }
        } else if (isEventName(propName)) {
          updateElementRef(instance);
          const eventName = propName.slice(2).toLowerCase();
          const instanceCallbackList = getCallbackListFor(instance);

          if (newProps[propName] && typeof newProps[propName] === "function") {
            // if a callback already exists, update it on the server
            const callbackIndex = instanceCallbackList.findIndex(
              ([existingEventName]) => existingEventName === eventName
            );

            if (callbackIndex !== -1) {
              instanceCallbackList[callbackIndex] = [
                eventName,
                newProps[propName]
              ];
            } else {
              updateAttrs[eventName] = {
                __calderaRPCCallbackBrand: true
              } as CalderaRPCCallback;
              instanceCallbackList.push([eventName, newProps[propName]]);
            }
          } else if (
            oldProps[propName] &&
            typeof oldProps[propName] === "function"
          ) {
            removeAttrs[eventName] = true;
            const callbackIndex = instanceCallbackList.findIndex(
              ([existingEventName]) => existingEventName === eventName
            );
            instanceCallbackList.splice(callbackIndex, 1);
          }
        } else {
          if (newProps[propName] !== undefined) {
            updateAttrs[propName] = newProps[propName];
          } else if (oldProps[propName] !== undefined) {
            removeAttrs[propName] = false;
          }
        }
      });

      if (instance instanceof CalderaInputElement) {
        // Todo: Handle skipped value update controlled components
        if (updateAttrs.value !== undefined) {
          // Handle no-transform value set case
          if (instance.value !== updateAttrs.value) {
            instance.value = updateAttrs.value;
          } else {
            delete updateAttrs.value;
          }
        }
        if (updateAttrs.checked !== undefined) {
          if (instance.checked !== updateAttrs.checked) {
            instance.checked = updateAttrs.checked;
          } else {
            delete instance.checked;
          }
        }
        if (removeAttrs.value !== undefined) {
          instance.value = "";
        }
        if (removeAttrs.checked !== undefined) {
          instance.checked = false;
        }
      }

      if (
        Object.keys(removeAttrs).length + Object.keys(updateAttrs).length >
        0
      ) {
        const msg: UpdateAttrsMessage = {
          msg: MessageType.UPDATE_ATTRS,
          nodeId: instance._calderaNodeId,
          updateAttrs,
          removeAttrs
        };
        dispatcher.dispatch(instance._calderaSessionId, msg);
      }
    },
    finalizeInitialChildren(parent, type, props) {
      if (parent instanceof CalderaInputElement) {
        if (props.value) parent.value = props.value;
        if (props.checked) parent.checked = props.checked;
      }

      const attrsToSend: Record<string, any> = {};
      Object.entries(props).forEach(([propName, propValue]) => {
        if (propName === "children") {
        } else if (typeof propValue === "function") {
          if (isEventName(propName)) {
            updateElementRef(parent);
            const eventName = propName.slice(2).toLowerCase();
            getCallbackListFor(parent).push([eventName, propValue]);
            attrsToSend[eventName] = {
              __calderaRPCCallbackBrand: true
            } as CalderaRPCCallback;
          } else {
            throw new Error(`Callback provided for non-event prop ${propName}`);
          }
        } else {
          attrsToSend[propName] = propValue;
        }
      });

      const msg: SetInitialAttrsMessage = {
        msg: MessageType.SET_INITIAL_ATTRS,
        nodeId: parent._calderaNodeId,
        attrs: attrsToSend
      };
      dispatcher.dispatch(parent._calderaSessionId, msg);

      // TODO: Handle focus/assign refs
      return false;
    },
    getChildHostContext() { },
    getPublicInstance(inst) {
      return inst;
    },
    getRootHostContext() { },
    prepareForCommit(container): Record<string, any> | null {
      return null;
    },
    resetAfterCommit(container) {
      dispatcher.requestFlush(container);
    },
    shouldSetTextContent() {
      return false;
    }
  };

  const reconciler = ReactReconciler(reconcilerOptions as any);

  return {
    render: (
      element: React.ReactElement,
      sessionId: SessionID,
      initialPath: string,
      savedState?: Buffer
    ) => {
      // Lock flush until initial render complete
      dispatcher.lockFlush(sessionId);
      dispatcher.dispatch(sessionId, {
        msg: MessageType.SET_SESSION_TOKEN,
        token: sessionId
      });

      return new CalderaContainer(
        sessionId,
        elementRefs,
        reconciler,
        dispatcher,
        initialPath,
        savedState && v8.deserialize(savedState),
        element
      );
    }
  };
};

export default createRenderer;
