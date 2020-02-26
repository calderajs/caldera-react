import { Dispatch, SessionID } from ".";
import { CalderaRPCMessage } from "../rpc/messages";

type BatchedDispatch = (session: SessionID, msgs: CalderaRPCMessage[]) => void;

export type Dispatcher = {
  dispatch: Dispatch;
  lockFlush: (session: SessionID) => void;
  unlockFlush: (session: SessionID) => void;
  requestFlush: (session: SessionID) => void;
};

export const makeDispatcher = (
  batchedDispatch: BatchedDispatch
): Dispatcher => {
  const queues = new Map<SessionID, CalderaRPCMessage[]>();
  const locks = new Set<SessionID>();

  return {
    lockFlush: session => locks.add(session),
    unlockFlush: session => locks.delete(session),
    requestFlush: session => {
      if (locks.has(session)) {
        return;
      }
      const queue = queues.get(session);
      if (queue && queue.length) {
        batchedDispatch(session, queue);
      }
      queues.delete(session);
    },
    dispatch: (session, msg, skipQueue) => {
      // Only used for pongs
      if (skipQueue) {
        batchedDispatch(session, [msg]);
        return;
      }

      let queue = queues.get(session);
      if (!queue) {
        queue = [];
        queues.set(session, queue);
      }
      queue.push(msg);
    }
  };
};
