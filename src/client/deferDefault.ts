export const shouldDeferDefault = (evtName: string) =>
  evtName === "submit" ||
  evtName === "focus" ||
  evtName === "blur" ||
  evtName === "click";

const executing = new Map<Node, string>();

export const checkDefaultDispatch = (e: Event) => {
  return e.target instanceof Node && executing.get(e.target) === e.type;
};

export const execDOMEvent = (
  target: Node,
  evtName: string,
  performDefault: boolean
) => {
  if (!(target instanceof HTMLElement)) {
    throw new Error(`Tried dispatching ${evtName} on non-element target`);
  }

  if (performDefault) {
    executing.set(target, evtName);
  }

  switch (evtName) {
    case "submit": {
      if (!(target instanceof HTMLFormElement)) {
        throw new Error("Submit called on non-form node");
      }

      // calling submit() does not fire onsubmit, which is good for the default case
      // (not sure why anybody would do that though) but bad for the non-default case
      if (performDefault) {
        // idk why you would ever want to do this
        target.submit();
      } else {
        // TODO: figure out if this is the expected behavior
        target.dispatchEvent(new Event("submit", { cancelable: true }));
      }
      break;
    }
    case "focus": {
      target.focus();
      break;
    }
    case "blur": {
      target.blur();
      break;
    }
    case "click": {
      target.click();
      break;
    }
    default: {
      throw new Error(`Invalid default dispatch event ${evtName}`);
    }
  }

  if (performDefault) {
    executing.delete(target);
  }
};
