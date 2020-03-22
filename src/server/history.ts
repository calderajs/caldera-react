export type SessionHistory = {
  path: string;
  // Implemented like this due to
  // https://github.com/facebook/react/issues/14110
  listeners: Set<() => void>;
};

export const updateHistory = (history: SessionHistory, path: string) => {
  if (history.path !== path) {
    history.path = path;
    history.listeners.forEach(listener => listener());
  }
};
