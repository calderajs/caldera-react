import { Fiber } from "react-reconciler";

const getSerializableState = (
  memoizedState: Fiber["memoizedState"],
  acc = [] as any[]
) => {
  if (memoizedState !== null) {
    if (memoizedState.queue !== null) {
      acc.push(memoizedState.memoizedState);
    }
    if (memoizedState.next !== null) {
      getSerializableState(memoizedState.next, acc);
    }
  }
  return acc;
};

export const walkFiberRoot = (root: Fiber, acc = [] as any[]) => {
  if (root.type !== null && typeof root.type !== "string") {
    acc.push(...getSerializableState(root.memoizedState));
  }
  if (root.child !== null) {
    walkFiberRoot(root.child, acc);
  }
  if (root.sibling !== null) {
    walkFiberRoot(root.sibling, acc);
  }
  return acc;
};
