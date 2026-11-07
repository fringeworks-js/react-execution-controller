# @fringeworks/react-execution-controller

`@fringeworks/react-execution-controller` is a library some will find handy, for sharing [`@fringeworks/execution-controller`](https://www.npmjs.com/package/@fringeworks/execution-controller) across React components.\
It lets you prevent repeated clicks, discard other operations while one is running, and limit the concurrency of async tasks — across components.

**[日本語のREADMEはこちら](./README.ja.md)**

## Installation

```bash
npm install @fringeworks/react-execution-controller @fringeworks/execution-controller
# or
pnpm add @fringeworks/react-execution-controller @fringeworks/execution-controller
```

## Usage

### Sharing a controller within a screen

Define the sharing range with `ExecutionScope`, then use the controller from hooks inside it.

```tsx
import { ExclusiveController } from '@fringeworks/execution-controller';
import {
  ExecutionScope,
  useControlledCallback,
  useExecutionState,
  useLocalExecutionController,
} from '@fringeworks/react-execution-controller';

function Form() {
  // While either save or delete is running, other operations are discarded
  const controller = useLocalExecutionController(
    () => new ExclusiveController({ id: 'form' }),
  );

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

When sharing is not needed, pass a controller created with `useLocalExecutionController` directly to the hooks.

```tsx
import { ExclusiveController } from '@fringeworks/execution-controller';
import {
  useControlledCallback,
  useLocalExecutionController,
} from '@fringeworks/react-execution-controller';

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
function UploadForm() {
  const upload = useLocalExecutionController(
    () => new ParallelController({ id: 'upload', limit: 3 }),
  );
  const form = useLocalExecutionController(
    () => new ExclusiveController({ id: 'form' }),
  );

  return (
    <ExecutionScope controller={upload}>
      <ExecutionScope controller={form}>
        <Uploader />
      </ExecutionScope>
    </ExecutionScope>
  );
}

function Uploader() {
  // Limit concurrency with 'upload', which is outside 'form'
  const upload = useControlledCallback(uploadFile, 'upload');
  // ...
}
```

### Where to create controllers

When passing an instance to the `controller` prop of `ExecutionScope` or the `controller` argument of the hooks, do not create it with `new` on every render. Recreating the instance resets its state, such as repeated-click prevention, and also recreates the functions returned by `useControlledCallback`.

| Where it is created                            | Shared by                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| The `factory` of `useLocalExecutionController` | That component instance                                              |
| The top level of a module                      | The whole app. With SSR, the same instance is shared across requests |

Only controllers created with `useLocalExecutionController` cancel the calls waiting to be executed on unmount. With a controller created at the top level of a module, waiting calls (e.g. debouncing) are still executed after the calling component unmounts.

## API

| API                                      | Description                                         |
| ---------------------------------------- | --------------------------------------------------- |
| `ExecutionScope`                         | Shares a controller with descendant components      |
| `useControlledCallback(fn, controller?)` | Returns a function executed under a controller      |
| `useExecutionState(controller?)`         | Returns the execution state of a controller         |
| `useExecutionController(id?)`            | Returns the controller shared by `ExecutionScope`   |
| `useLocalExecutionController(factory)`   | Creates a controller used only within the component |

### Specifying a controller

The `controller` argument of the hooks accepts one of the following.

| Value    | Controller used                                                           |
| -------- | ------------------------------------------------------------------------- |
| Omitted  | The controller of the nearest `ExecutionScope`                            |
| String   | The first controller with a matching ID, walking up the `ExecutionScope`s |
| Instance | The given controller                                                      |

If no controller is found, no error is thrown and the hooks work without control (so they can be used in tests or Storybook without an `ExecutionScope`).

### `ExecutionScope`

```ts
function ExecutionScope(props: ExecutionScopeProps): JSX.Element;
```

A component that shares a controller with its descendants.\
When nested, hooks use the controller of the nearest scope. With an ID, they walk up the scopes and use the controller whose ID matches.

| Property     | Type                     | Description                            |
| ------------ | ------------------------ | -------------------------------------- |
| `controller` | `AnyExecutionController` | The controller shared within the scope |
| `children?`  | `ReactNode`              | The elements rendered within the scope |

### `useControlledCallback`

```ts
function useControlledCallback<
  F extends LooseSyncFunction,
  P extends CancelPolicy = CancelPolicy,
>(fn: F, controller?: ExecutionControllerTarget<P>): ControlledFunction<F, P>;
```

Returns a function executed under the control of the controller.

- The reference of the returned function does not change unless the controller changes.
- The latest `fn` is always executed, so `fn` can refer to the latest props and state.
- The `this` of the call is passed on to `fn`.
- If no controller is found, returns a function that executes `fn` without control. It still returns a `Promise`, and exceptions thrown by `fn` are returned as rejections.

When a controller instance is given, the return type is determined by its `cancelPolicy`. When the controller is omitted or specified by ID, the type cannot tell which controller is used, so the resolved value includes `CANCEL`. Check it with `isCanceled`.

```ts
import { isCanceled } from '@fringeworks/execution-controller';

const upload = useControlledCallback(uploadFile, 'upload');
// ...
const result = await upload(file);
if (isCanceled(result)) {
  return;
}
```

| Parameter     | Type                           | Description                                    |
| ------------- | ------------------------------ | ---------------------------------------------- |
| `fn`          | `F`                            | The target function                            |
| `controller?` | `ExecutionControllerTarget<P>` | The controller (see "Specifying a controller") |

### `useExecutionState`

```ts
function useExecutionState(
  controller?: ExecutionControllerTarget,
): ExecutionState;
```

Returns the execution state of the controller specified by `controller` (see "Specifying a controller"). The component re-renders when the state changes.\
The same object is returned as long as the state does not change. If no controller is found, always returns `{ executing: 0, isExecuting: false }`.

| Property      | Type      | Description                                                                                                                 |
| ------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `executing`   | `number`  | The number of running functions. Calls waiting to be executed, such as those queued by `SerialController`, are not included |
| `isExecuting` | `boolean` | Whether one or more functions are running                                                                                   |

### `useExecutionController`

```ts
function useExecutionController(
  id?: string,
): AnyExecutionController | undefined;
```

Returns the controller shared by `ExecutionScope`. Without `id`, returns the controller of the nearest scope; with `id`, walks up the scopes and returns the controller whose ID matches. Returns `undefined` if not found.

### `useLocalExecutionController`

```ts
function useLocalExecutionController<C extends AnyExecutionController>(
  factory: () => C,
): C;
```

Creates a controller used only within the component.

- `factory` is called only on the first render; the same instance is returned afterwards.
- On unmount, calls waiting to be executed (e.g. debouncing) are canceled. Functions already running are not interrupted.

### Types

| Type                           | Description                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `ExecutionScopeProps`          | The props of `ExecutionScope`                                                             |
| `ExecutionState`               | The return value of `useExecutionState`                                                   |
| `ExecutionControllerTarget<P>` | The type of the `controller` argument of the hooks: an ID string or a controller instance |
| `AnyExecutionController`       | A controller of any type and `cancelPolicy`                                               |

## License

MIT
