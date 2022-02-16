const React = require("react");
const {
  renderCalderaApp,
  makeSharedResource,
  useSharedState
} = require("react-native-remote-web");
const fs = require("fs");

const DATA_PATH = "messages.json";
const messagesResource = makeSharedResource(
  // Load initial messages
  fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) : []
);

const usePersistedMessages = () => {
  // Basic shared state, synced with all clients
  const [messages, setMessages] = useSharedState(messagesResource);
  return [
    messages,
    // Persist to disk (in prod, use a database)
    (newMessages) => {
      setMessages(newMessages);
      fs.writeFileSync(DATA_PATH, JSON.stringify(newMessages));
    },
  ];
};

const App = () => {
  const [messages, setMessages] = usePersistedMessages();
  // local state, persisted across client reconnects
  const [draftMsg, setDraftMsg] = React.useState("");

  return (
    <>
      <h1>Chat Room!</h1>
      {messages.map((message, i) => (
        <div key={i}>{message}</div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMessages([...messages, draftMsg]);
          setDraftMsg("");
        }}
      >
        <input type="text" value={draftMsg} onChange={(e) => setDraftMsg(e.target.value)} />
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

renderCalderaApp(<App />, { port: 4444 });
