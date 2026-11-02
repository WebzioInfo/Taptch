# React 19 Engineering Standards

## 1. Modern React 19 Hooks
- Use the `use()` hook for unwrapping promises and context conditionally in components.
- Use `useActionState()` for managing form submission states and server action responses.
- Use `useOptimistic()` for instant, zero-latency UI updates during mutations.

## 2. Dependency Array & Closure Safety
- Never suppress `react-hooks/exhaustive-deps` using eslint-disable comments.
- Always include all referenced variables in effect and callback dependency arrays.
- Use functional state updates (`setCount(prev => prev + 1)`) to avoid stale closures.
- Every `useEffect` that creates an event listener, interval, or subscription must return a cleanup function.

## 3. Composition & Component Design
- Prefer compound component composition over boolean prop explosion.
- Keep presentational components pure and decoupled from data fetching.
- Keep component files under 300 lines of code; decompose complex surfaces into smaller focused subcomponents.

## 4. State Management Boundaries
- Use local `useState` for transient UI state (modals, dropdowns, inputs).
- Use URL search parameters for shareable navigation state (tabs, search queries, pagination).
- Use **Zustand** stores for complex interactive application workflows (e.g. 3-pane profile builder).
- Avoid monolithic React Context providers that trigger full-tree re-renders on every state update.

