import { NodeID } from "../rpc/messages";
import { getInputDebounce } from "./index";

// TODO: Replace with fancier text diff solution

// Not quite sure about this debounce implementation
type DebouncedTask = [number, () => void];

const lastInteractions = new Map<NodeID, number>();
const debounceTasks = new Map<NodeID, DebouncedTask>();

export const scheduleDebounced = (nodeId: NodeID, task: DebouncedTask[1]) => {
  const lastScheduled = debounceTasks.get(nodeId);
  if (lastScheduled !== undefined) {
    window.clearTimeout(lastScheduled[0]);
  }
  const wrappedTask = () => {
    debounceTasks.delete(nodeId);
    task();
  };
  const lastInteraction = lastInteractions.get(nodeId);
  const scheduled: DebouncedTask = [
    window.setTimeout(
      wrappedTask,
      lastInteraction !== undefined
        ? getInputDebounce() - (performance.now() - lastInteraction)
        : 0
    ),
    wrappedTask
  ];
  debounceTasks.set(nodeId, scheduled);
};

// Push back existing tasks in debounce queue
export const rebounce = (nodeId: NodeID) => {
  lastInteractions.set(nodeId, performance.now());
  const lastScheduled = debounceTasks.get(nodeId);
  if (lastScheduled !== undefined) {
    const [taskId, wrappedTask] = lastScheduled;
    window.clearTimeout(taskId);
    const scheduled: DebouncedTask = [
      window.setTimeout(wrappedTask, getInputDebounce()),
      wrappedTask
    ];
    debounceTasks.set(nodeId, scheduled);
  }
};

export const cleanupDebounceTasks = (nodeId: NodeID) => {
  lastInteractions.delete(nodeId);

  const scheduledTask = debounceTasks.get(nodeId);
  if (scheduledTask) {
    window.clearTimeout(scheduledTask[0]);
    debounceTasks.delete(nodeId);
  }
};

export const clearDebounceTasks = () => {
  lastInteractions.clear();
  for (const scheduledTask of debounceTasks.values()) {
    window.clearTimeout(scheduledTask[0]);
  }
  debounceTasks.clear();
};
