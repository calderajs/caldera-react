import { assertNever } from "assert-never";
import Cookies from "js-cookie";
import { readRPCMessages } from "../rpc/decoder";
import { writeRPCEvent } from "../rpc/encoder";
import {
  CalderaRPCEvent,
  CalderaRPCMessage,
  CALDERA_SESSION_TOKEN_COOKIE,
  DOCUMENT_ROOT_ID,
  EventType,
  MessageType,
  NodeID
} from "../rpc/messages";
import {
  addCallbackToNode,
  cleanupCallbacks,
  removeCallbackFromNode,
  clearCallbackHandlers
} from "./callbacks";
import {
  cleanupDebounceTasks,
  scheduleDebounced,
  clearDebounceTasks
} from "./debounce";
import { execDOMEvent } from "./deferDefault";
import { handleAppendOrUpdateHead, handleDeleteHead, clearHead } from "./head";
import { applyStylesToNode, withDebugName, sleep } from "./util";
import {
  registerHistoryListener,
  cleanupHistoryListener,
  handleHistory
} from "./history";

const LATENCY_SIM = 0;
// TODO: Figure out fluctuation
let LATENCY = 0;
// TODO: Figure out how to simulate jitter
const JITTER = 20;

// TODO: Compute based off of actual latency + jitter
export const getInputDebounce = () => LATENCY + LATENCY_SIM + JITTER * 2;

export const NODE_ID_ATTR = "data-caldera-nodeid";
export const rootNode = document.getElementById("root")!;
export const nodeMap = new Map<NodeID, Node>();

export const getNode = (nodeId: NodeID): Node => {
  if (nodeId === DOCUMENT_ROOT_ID) {
    return rootNode;
  }
  const node = nodeMap.get(nodeId);
  if (!node) {
    throw new Error(`Mismatched node ID ${nodeId}`);
  }
  return node;
};

let ws: WebSocket;

export const dispatchEvent = (data: CalderaRPCEvent) =>
  ws.send(writeRPCEvent(data));

let pingCount = 0;
const pingTimes = new Map<number, number>();

const requestPing = () => {
  if (!document.hidden) {
    const nonce = ++pingCount;
    pingTimes.set(nonce, performance.now());
    dispatchEvent({ event: EventType.PING, nonce });
  }
};
let requestPingTask: number;

const processMessage = (data: CalderaRPCMessage) => {
  switch (data.msg) {
    case MessageType.SET_SESSION_TOKEN: {
      while (rootNode.firstChild) {
        rootNode.removeChild(rootNode.firstChild);
      }

      nodeMap.clear();
      clearHead();
      clearCallbackHandlers();
      clearDebounceTasks();
      registerHistoryListener();

      const token = data.token;
      Cookies.set(CALDERA_SESSION_TOKEN_COOKIE, token);
      window.setTimeout(requestPing, 0);
      requestPingTask = window.setInterval(requestPing, 5000);
      break;
    }
    case MessageType.PONG: {
      const pingTime = pingTimes.get(data.nonce);
      if (pingTime === undefined) {
        console.error("Unknown ping nonce", data.nonce);
      } else {
        LATENCY = performance.now() - pingTime;
        pingTimes.delete(data.nonce);
        console.info("Roundtrip latency", LATENCY);
      }
      break;
    }
    case MessageType.CREATE_ELEMENT: {
      const newElement = document.createElement(data.type);
      nodeMap.set(data.nodeId, newElement);
      newElement.setAttribute(NODE_ID_ATTR, data.nodeId.toString());
      break;
    }
    case MessageType.CREATE_TEXT: {
      nodeMap.set(data.textId, document.createTextNode(data.text));
      break;
    }
    case MessageType.UPDATE_TEXT: {
      const textNode = getNode(data.textId);
      textNode.nodeValue = data.text;
      break;
    }
    case MessageType.APPEND_CHILD: {
      const node = getNode(data.nodeId);
      const childNode = getNode(data.childId);
      node.appendChild(childNode);
      break;
    }
    case MessageType.REMOVE_CHILD: {
      const node = getNode(data.nodeId);
      const childNode = getNode(data.childId);
      node.removeChild(childNode);
      nodeMap.delete(data.childId);
      cleanupCallbacks(data.childId);
      cleanupDebounceTasks(data.childId);
      break;
    }
    case MessageType.INSERT_BEFORE: {
      const node = getNode(data.nodeId);
      const childNode = getNode(data.childId);
      const beforeChildNode = getNode(data.beforeChildId);
      node.insertBefore(childNode, beforeChildNode);
      break;
    }
    case MessageType.UPDATE_ATTRS: {
      const node = getNode(data.nodeId);
      if (!(node instanceof HTMLElement)) {
        throw new Error(
          `Tried to apply attributes to non-HTMLElement node ${data.nodeId}`
        );
      }
      Object.entries(data.updateAttrs).forEach(([name, value]) => {
        if (name === "style") {
          applyStylesToNode(node, value);
        } else if (name === "className") {
          node.setAttribute("class", value);
        } else if (value.__calderaRPCCallbackBrand) {
          addCallbackToNode(data.nodeId, name);
        } else if (
          name === "value" &&
          (node instanceof HTMLInputElement ||
            node instanceof HTMLSelectElement ||
            node instanceof HTMLTextAreaElement)
        ) {
          const setNodeValue = () => {
            node.value = value;
          };
          if (node instanceof HTMLSelectElement) {
            setNodeValue();
          } else {
            scheduleDebounced(data.nodeId, setNodeValue);
          }
        } else if (name === "checked" && node instanceof HTMLInputElement) {
          node.checked = value;
        } else {
          node.setAttribute(name, value);
        }
      });

      Object.entries(data.removeAttrs).forEach(([name, value]) => {
        if (value) {
          removeCallbackFromNode(data.nodeId, name);
        } else {
          node.removeAttribute(name);
        }
      });
      break;
    }
    case MessageType.APPEND_OR_UPDATE_HEAD: {
      handleAppendOrUpdateHead(data);
      break;
    }
    case MessageType.DELETE_HEAD: {
      handleDeleteHead(data);
      break;
    }
    case MessageType.HISTORY: {
      handleHistory(data);
      break;
    }
    case MessageType.SET_INITIAL_ATTRS: {
      const node = getNode(data.nodeId);
      if (!(node instanceof HTMLElement)) {
        throw new Error(
          `Tried to apply attributes to non-HTMLElement node ${data.nodeId}`
        );
      }
      Object.entries(data.attrs).forEach(([name, value]) => {
        if (name === "style") {
          applyStylesToNode(node, value);
        } else if (name === "className") {
          node.setAttribute("class", value);
        } else if (value.__calderaRPCCallbackBrand) {
          addCallbackToNode(data.nodeId, name);
        } else if (
          name === "value" &&
          (node instanceof HTMLInputElement ||
            node instanceof HTMLSelectElement ||
            node instanceof HTMLTextAreaElement)
        ) {
          node.value = value;
        } else if (name === "checked" && node instanceof HTMLInputElement) {
          node.checked = value;
        } else {
          node.setAttribute(name, value);
        }
      });
      break;
    }
    case MessageType.SCROLL_INTO_VIEW: {
      const target = getNode(data.target);
      if (!(target instanceof HTMLElement)) {
        throw new Error(
          `Tried to call scrollIntoView on non-HTMLElement node ${data.target}`
        );
      }
      target.scrollIntoView(data.options);
      break;
    }
    case MessageType.DISPATCH_EVENT: {
      const target = getNode(data.target);
      execDOMEvent(target, data.name, data.performDefault);
      break;
    }
    default:
      assertNever(data);
  }
};

// Use the ws equivalent of whatever the current url is
const serverUrl = new URL(window.location.href);
serverUrl.protocol = serverUrl.protocol === "https:" ? "wss:" : "ws:";

// Misnomer, but whatever
let connected = false;

const connect = () => {
  ws = new WebSocket(serverUrl.href);
  ws.binaryType = "arraybuffer";
  connected = true;

  ws.addEventListener("message", async ev => {
    if (LATENCY_SIM > 0) {
      await sleep(LATENCY_SIM);
    }

    const decoded: CalderaRPCMessage[] = readRPCMessages(
      new Uint8Array(ev.data)
    );
    console.log("Received", decoded.map(withDebugName));
    decoded.forEach(processMessage);
  });

  ws.addEventListener("close", () => {
    window.clearInterval(requestPingTask);
    pingTimes.clear();
    cleanupHistoryListener();
    connected = false;
  });
};

connect();

document.addEventListener("visibilitychange", () => {
  if (!connected && document.visibilityState === "visible") {
    connect();
  }
});
