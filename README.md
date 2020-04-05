# 🌋

Caldera is a server-side execution environment for React. Think of it as the Node.js analog to Phoenix LiveView — **all** of the application logic (including rendering) runs on the server, and DOM updates are sent to the client in real-time.

This allows developers to rapidly build interactive and multiplayer applications without developing boilerplate around RPC layers (REST/GraphQL/gRPC) and messaging primitives (WebSockets/subscriptions/etc).

Because it's built on top of the React reconciler, it's compatible with (currently, a reasonably useful subset of) the existing React API. See [what's currently included](#what-works) and [what's to come](#whats-being-worked-on) for updates.

## Installation

Run `npm install caldera` to install Caldera

## API/Documentation

**[Work in progress]**

The `caldera` package provides the following top-level exports:

- `Head`: A React component that renders its children into the page's `<head />`
- `renderCalderaApp`: A function that takes in a React element, and runs the Caldera server on port 8080
- `makeSharedResource`: Creates a shared resource suitable for use in `useSharedState` and `useSharedReducer`
- `useSharedState`/`useSharedReducer`: Shared equivalents to the `useState` and `useReducer` hooks that are initialized with the current value of the passed in resource, and trigger rerenders in all other call sites upon updating
- `useHistory`/`useLocation` - hooks that enable routing functionality

## Examples

A simple example (chat room) to get started:

```JSX
import React from "react";
import { renderCalderaApp, makeSharedResource, useSharedState } from "caldera";

const messagesResource = makeSharedResource([]); // default impl of shared state

const App = () => {
  // shared resources are shared with all clients
  const [messages, setMessages] = useSharedState(messagesResource);
  // local state, preserved across client restarts
  const [draftMsg, setDraftMsg] = useState("");

  return (
    <>
      <h1>Chat Room!</h1>
      {messages.map((message, i) => (
        <div key={i}>{message}</div>
      ))}
      <form
        onSubmit={e => {
          e.preventDefault();
          setMessages(messages => [...messages, draftMsg]);
          setDraftMsg("");
        }}
      >
        <input
          type="text"
          value={draftMessage}
          onChange={e => setDraftMsg(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

renderCalderaApp(<App />);
```

Then, run the app using `node app.js`.

A few other examples [here](https://github.com/calderajs/caldera-examples) demonstrate features like shared state, database usage, and session persistence.

## What works <a name="what-works"></a>

- Basic form inputs (text fields/areas, checkboxes, selects, radio buttons)
- Basic event listeners (onclick/onchange/onsubmit/onfocus/onblur/keyevents)
- CSS and other head tags (via `<Head />`)
- Basic input reconciliation (currently implemented via debounce)
- Shared state and reducer hooks
- State serialization and restore + state "forking" whenever a user opens a new client

## What's being worked on <a name="whats-being-worked-on"></a>

- More events (ondragstart, intersection observers)
- `<input type="file">` support
- Better, diff-based input reconciliation

## Future plans

- Proper versioning for state serialization
  - This will allow support for upgrading the server in-place, while retaining certain parts of the client state
- Support for selectively rendering arbitrary React components on the client
