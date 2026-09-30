# @niche-works/react-execution-controller

`@niche-works/react-execution-controller` is a niche library for sharing [`@niche-works/execution-controller`](https://www.npmjs.com/package/@niche-works/execution-controller) across React components.\
It lets you prevent repeated clicks, discard other operations while one is running, and limit the concurrency of async tasks — across components.

**[日本語のREADMEはこちら](./README.ja.md)**

## Installation

```bash
npm install @niche-works/react-execution-controller @niche-works/execution-controller
# or
pnpm add @niche-works/react-execution-controller @niche-works/execution-controller
```

## Usage

### Sharing a controller within a screen

Define the sharing range with `ExecutionScope`, then use the controller from hooks inside it.

```tsx
import { ExclusiveController } from '@niche-works/execution-controller';
import {
  ExecutionScope,
  useControlledCallback,
  useExecutionState,
} from '@niche-works/react-execution-controller';

// While either save or delete is running, other operations are discarded
const controller = new ExclusiveController({ id: 'form' });

function Form() {
  return (
    <ExecutionScope controller={controller}>
      <SaveButton />
      <DeleteButton />
    </ExecutionScope>
  );
}

function SaveButton() {
  const handleClick = useControlledCallback(async () => {
    await save();
  });
  const { isExecuting } = useExecutionState();

  return (
    <button onClick={handleClick} disabled={isExecuting}>
      Save
    </button>
  );
}
```

### Using a controller only within a component

When sharing is not needed, create a component-local controller with `useLocalExecutionController` and pass it to the hooks.

```tsx
import { ExclusiveController } from '@niche-works/execution-controller';
import {
  useControlledCallback,
  useLocalExecutionController,
} from '@niche-works/react-execution-controller';

function SubmitButton() {
  // Prevent repeated clicks while running
  const controller = useLocalExecutionController(
    () => new ExclusiveController({ id: 'submit' }),
  );
  const handleClick = useControlledCallback(submit, controller);

  return <button onClick={handleClick}>Submit</button>;
}
```

### Using multiple controllers

`ExecutionScope` can be nested. Without an ID, hooks use the controller of the nearest scope; with an ID, they walk up the scopes and use the controller whose ID matches.

```tsx
<ExecutionScope controller={new ParallelController({ id: 'upload', limit: 3 })}>
  <ExecutionScope controller={new ExclusiveController({ id: 'form' })}>
    <Uploader />
  </ExecutionScope>
</ExecutionScope>;

function Uploader() {
  // Limit concurrency with 'upload', which is outside 'form'
  const upload = useControlledCallback(uploadFile, 'upload');
  // ...
}
```

## API

### Specifying a controller

The `controller` argument of the hooks accepts one of the following.

| Value     | Controller used                                                         |
| --------- | ----------------------------------------------------------------------- |
| Omitted   | The controller of the nearest `ExecutionScope`                          |
| String    | The first controller with a matching ID, walking up the `ExecutionScope`s |
| Instance  | The given controller                                                    |

If no controller is found, no error is thrown and the hooks work without control (so they can be used in tests or Storybook without an `ExecutionScope`).

### ExecutionScope

A component that shares a controller with its descendants.

| Property     | Type                  | Description                           |
| ------------ | --------------------- | ------------------------------------- |
| `controller` | `ExecutionController` | The controller shared within the scope |

### useControlledCallback

```ts
useControlledCallback(fn, controller?): ControlledFunction
```

Returns a function executed under the control of the controller.

- The reference of the returned function does not change unless the controller changes.
- The latest `fn` is always executed, so `fn` can refer to the latest props and state.
- If no controller is found, returns a function that executes `fn` without control.

### useExecutionState

```ts
useExecutionState(controller?): { executing: number; isExecuting: boolean }
```

Returns the execution state of the controller. The component re-renders when the state changes.\
If no controller is found, always returns `{ executing: 0, isExecuting: false }`.

### useExecutionController

```ts
useExecutionController(id?): ExecutionController | undefined
```

Returns the controller shared by `ExecutionScope`, or `undefined` if not found.

### useLocalExecutionController

```ts
useLocalExecutionController(factory): ExecutionController
```

Creates a controller used only within the component.

- `factory` is called only on the first render; the same instance is returned afterwards.
- On unmount, calls waiting to be executed (e.g. debouncing) are canceled.

> [!WARNING]
> When passing a controller instance directly to the hooks, do not create it with `new` on every render. Recreating the instance resets its state, such as repeated-click prevention.\
> To create one within a component, use `useLocalExecutionController`.

## License

MIT
