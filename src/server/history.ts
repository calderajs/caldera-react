export type SessionHistory = {
  path: string;
  // Implemented like this due to
  // https://github.com/facebook/react/issues/14110
  listeners: Set<(newPath: string) => void>;
};
