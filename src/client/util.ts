import { getDebugMessageType } from "../rpc/debug";
import { CalderaRPCMessage } from "../rpc/messages";

// From https://github.com/preactjs/preact/blob/158430c4db480dfc0b77f2ee62002e975013dfdc/src/constants.js
const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

export const getNormalizedEventName = (node: Node, name: string) => {
  if (
    (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) &&
    name === "change"
  ) {
    return "input";
  } else {
    return name;
  }
};

export const applyStylesToNode = (
  node: HTMLElement,
  styles: Record<string, string | number | boolean>
) =>
  // TODO: Remove old styles
  Object.entries(styles).forEach(([name, value]) => {
    const styles = node.style;

    // From Preact's implementation
    // The index types are fucked because https://github.com/Microsoft/TypeScript/issues/17827#issuecomment-391663310
    if (name[0] === "-") {
      styles.setProperty(name, value.toString());
    } else if (typeof value === "number" && IS_NON_DIMENSIONAL.test(name)) {
      styles[name as any] = value + "px";
    } else if (value === null || value === undefined) {
      styles[name as any] = "";
    } else {
      styles[name as any] = value.toString();
    }
  });

export const withDebugName = (msg: CalderaRPCMessage) => ({
  ...msg,
  msg: getDebugMessageType(msg.msg)
});

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(() => resolve(), ms));
