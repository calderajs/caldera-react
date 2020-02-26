# Caldera server architecture

Caldera is a custom React renderer built on top of the React Reconciler API. Instead of mutating a real DOM stored on the server, it sends the mutations over WebSockets to a client which performs them on the real DOM. I haven't benchmarked the current renderer, but it maintains essentially the same amount of state as a simple no-op renderer and was able to run 250000 concurrent instances (all running timers) in 1.7GB of real heap. This should make it reasonably safe to maintain disconnected instances in memory for a non-trivial amount of time, and is way cheaper than maintaining a real DOM (JSDOM, undom, or similar) on top of the React virtual dom.

## Philosophy

In one sentence: maintain as little non-React state on the server as possible. This means:

1. All component state should be in the React tree - this means all inputs are controlled (https://reactjs.org/docs/forms.html)
2. Don't maintain any tree - the virtual dom already contains everything necessary for operation
3. Punt serialization/hydration as far back as possible - because Fiber instances are really cheap, disconnected sessions can be maintained for quite a while.
