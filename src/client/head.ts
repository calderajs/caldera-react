import {
  AppendOrUpdateHeadMesage,
  DeleteHeadMesage,
  HeadElementID
} from "../rpc/messages";

const headNodeMap = new Map<HeadElementID, HTMLElement>();

export const handleAppendOrUpdateHead = (data: AppendOrUpdateHeadMesage) => {
  const tag = document.createElement(data.type);
  tag.setAttribute("data-caldera-head-elementid", data.elementId.toString());

  Object.entries(data.attrs).forEach(([key, value]) => {
    if (key !== "children") {
      tag!.setAttribute(key, value);
    } else if (value !== null) {
      tag!.appendChild(document.createTextNode(value));
    }
  });

  const oldTag = headNodeMap.get(data.elementId);

  if (oldTag !== undefined) {
    document.head.replaceChild(tag, oldTag);
  } else {
    document.head.appendChild(tag);
  }

  headNodeMap.set(data.elementId, tag);
};

export const handleDeleteHead = (data: DeleteHeadMesage) => {
  const toDelete = headNodeMap.get(data.elementId);
  // eslint-disable-next-line no-unused-expressions
  toDelete?.parentElement?.removeChild(toDelete);
};

export const clearHead = () => {
  for (const headNode of headNodeMap.values()) {
    document.head.removeChild(headNode);
  }
  headNodeMap.clear();
};
