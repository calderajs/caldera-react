# Event propagation

React exposes an event abstraction which includes a feature subset of the real DOM event system. The constraints are namely:

- At most one listener for an event type is registered for any given node
- Event propagation bubbles _up_ the tree and doesn't _capture_ down the tree (to do capture, pass in stuff like onClickCapture - this is uncommonly used and we don't need to support right now but the method is similar)

To support this abstraction on the server without a real DOM while avoiding the n+1 problem, the propagation path to walk is handled on the client (we will deal with validation later, but this is unlikely to pose a security issue). This works as follows:

1. When a callback is registered, preventDefault if the event is _cancelable_ but do not stopPropagation. Ignore and stopPropagation if isTrusted is not true.
2. When an event is dispatched, store the current node ID at each callback handler when hit in an array (single element if `event.bubbles` is false). Send the contents of that array over RPC when the event hits `document.body`, along with the node ID of the original target element.
3. On the server, we walk up the callbacks of the corresponding server node instances until stopPropagation is called. When stopPropagation is called or all nodes in the list are processed, if preventDefault was not called and the original event was _cancelable_ we send a virtual event dispatch message to the client, and the client permits the side-effect but stops propagation (as detailed in step 1).

Ideally we would be able to implement a useful subset of the [SyntheticEvent](https://reactjs.org/docs/events.html) wrapper.

## Cancelabiity

- Non-trusted DOM events (save for `click`) don't cause default side-effects when dispatched. We work around this by supporting only a subset of cancellable events that have a corresponding redispatch method (currently submit, focus, blur, click). React Flare is relying on a similar type of async cancellation/default preventDefaulted, so it's worth investigating their implementation (https://github.com/facebook/react/issues/15257)

## Potential validation methods

- Use some ID generation scheme that lets you easily check if a node is a child of another node (harder)
- Pass reference to instance up the tree with registered callback (easier, but updating this may be harder)
- Walk React Fiber instance parent references (slow, may need to walk entire app tree per event process, but updating is handled automatically)
