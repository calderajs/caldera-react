🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋🌋

Caldera is a server-side execution environment for React. Think of it as the Node.js analog to Phoenix LiveView — **all** of the application logic (including rendering) runs on the server, and DOM updates are sent to the client in real-time.

This allows developers to rapidly build interactive and multiplayer applications without developing boilerplate around RPC layers (REST/GraphQL/gRPC) and messaging primitives (WebSockets/subscriptions/etc).

Because it's built on top of the React reconciler, it's compatible with (currently, a reasonably useful subset of) the existing React API. See [what's currently included](#what-works) and [what's to come](#whats-being-worked-on) for updates.

## Installation

Run `npm install caldera` to install Caldera

## API

- `<Head />` (title/other singletons are special cased)
- renderCalderaApp (put the import at top of file)
- useSharedState/useSharedReducer
- makeSharedResource (default shared state and shared reducer implementation)

## Comparison with Phoenix LiveView

There are some significant advantages of using React for the rendering engine compared to Phoenix LiveView's approach. React's single source of truth paradigm enables serialization and restoration of state across sessions. This means that the complete application state is preserved across server restarts, and eventually across multiple devices (and potentially different application versions). In the future, React's isolated component model (props down, callbacks up) will allow Caldera to seamlessly render certain display-only components (think maps, searchable selects, date pickers) on the client while rendering the rest of the application on the server.

## Examples

A simple example (chat room) to get started:
```JSX
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
A few other examples [here](https://github.com/calderajs/caldera-examples) demonstrate features like shared state, database usage, and session persistence.

## What works <a name="what-works"></a>

- Basic form inputs (text fields/areas, checkboxes, selects, radio buttons)
- Basic event listeners (onclick/onchange/onsubmit/onfocus/onblur)
- CSS and other head tags (via <Head />)
- Basic input reconciliation (currently implemented via debounce)
- Shared state and reducer hooks
- State serialization and restore + state "forking" whenever a user opens a new client

## What's being worked on <a name="whats-being-worked-on"></a>

- More events (onmouseenter/onmouseleave, keyevents, etc)
- Better, diff-based input reconciliation
- Routing support (this is a big one)

## Future plans

- Proper versioning for state serialization
    - This will allow support for upgrading the server in-place, while retaining certain parts of the client state
- Support for selectively rendering arbitrary React components on the client
