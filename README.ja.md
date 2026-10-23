# @fringeworks/react-execution-controller

`@fringeworks/react-execution-controller` は [`@fringeworks/execution-controller`](https://www.npmjs.com/package/@fringeworks/execution-controller) を React の画面内で共有して利用するための、誰かにとっては便利なライブラリです。\
ボタンの連打防止、実行中の他の操作の破棄、非同期処理の並列数の制限などを、コンポーネントをまたいで実現できます。

**[English README is available here](./README.md)**

## インストール

```bash
npm install @fringeworks/react-execution-controller @fringeworks/execution-controller
# または
pnpm add @fringeworks/react-execution-controller @fringeworks/execution-controller
```

## 使い方

### 画面内でコントローラーを共有する

`ExecutionScope` で共有する範囲を決め、その中の hook からコントローラーを利用します。

```tsx
import { ExclusiveController } from '@fringeworks/execution-controller';
import {
  ExecutionScope,
  useControlledCallback,
  useExecutionState,
  useLocalExecutionController,
} from '@fringeworks/react-execution-controller';

function Form() {
  // 保存・削除のどちらかを実行している間は、他の操作を破棄する
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
      保存
    </button>
  );
}
```

### コンポーネント内だけで使う

共有する必要がない場合は、`useLocalExecutionController` で作成したコントローラーを hook に直接渡します。

```tsx
import { ExclusiveController } from '@fringeworks/execution-controller';
import {
  useControlledCallback,
  useLocalExecutionController,
} from '@fringeworks/react-execution-controller';

function SubmitButton() {
  // 実行中の連打を防止する
  const controller = useLocalExecutionController(
    () => new ExclusiveController({ id: 'submit' }),
  );
  const handleClick = useControlledCallback(submit, controller);

  return <button onClick={handleClick}>送信</button>;
}
```

### 複数のコントローラーを使い分ける

`ExecutionScope` は入れ子にできます。hook は ID を省略すると最寄りのスコープのコントローラーを、ID を指定するとスコープを遡って ID が一致するコントローラーを使用します。

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
  // 'form' の外側にある 'upload' で並列数を制限する
  const upload = useControlledCallback(uploadFile, 'upload');
  // ...
}
```

### コントローラーを作成する場所

`ExecutionScope` の `controller` や hook の `controller` 引数にインスタンスを渡す場合は、レンダリングのたびに `new` しないでください。インスタンスが作り直されると、連打防止などの状態がリセットされ、`useControlledCallback` が返す関数も作り直されます。

| 作成する場所                               | 共有される範囲                                                     |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `useLocalExecutionController` の `factory` | そのコンポーネントのインスタンス                                   |
| モジュールのトップレベル                   | アプリ全体。SSR ではリクエストをまたいで同じインスタンスが使われる |

アンマウント時に実行を待機している呼び出しをキャンセルするのは、`useLocalExecutionController` で作成したコントローラーだけです。モジュールのトップレベルで作成したコントローラーでは、呼び出し元のコンポーネントがアンマウントされても、待機している呼び出し（デバウンス待ちなど）は実行されます。

## API

| API                                      | 説明                                                   |
| ---------------------------------------- | ------------------------------------------------------ |
| `ExecutionScope`                         | 子孫のコンポーネントでコントローラーを共有する         |
| `useControlledCallback(fn, controller?)` | コントローラーの制御下で実行される関数を返す           |
| `useExecutionState(controller?)`         | コントローラーの実行状態を返す                         |
| `useExecutionController(id?)`            | `ExecutionScope` で共有されているコントローラーを返す  |
| `useLocalExecutionController(factory)`   | コンポーネント内でのみ使用するコントローラーを作成する |

### コントローラーの指定

hook の `controller` 引数には、以下のいずれかを指定できます。

| 指定         | 使用するコントローラー                                                 |
| ------------ | ---------------------------------------------------------------------- |
| 未指定       | 最寄りの `ExecutionScope` のコントローラー                             |
| 文字列       | `ExecutionScope` を遡って最初に見つかった、ID が一致するコントローラー |
| インスタンス | 指定されたコントローラー                                               |

コントローラーが見つからない場合もエラーにはならず、制御なしで動作します（テストや Storybook で `ExecutionScope` を用意しなくても使えます）。

### `ExecutionScope`

```ts
function ExecutionScope(props: ExecutionScopeProps): JSX.Element;
```

子孫のコンポーネントでコントローラーを共有するコンポーネントです。\
入れ子にした場合、hook は最寄りのスコープのコントローラーを使用します。ID を指定した場合は、スコープを遡って ID が一致するコントローラーを使用します。

| プロパティ   | 型                       | 説明                               |
| ------------ | ------------------------ | ---------------------------------- |
| `controller` | `AnyExecutionController` | スコープ内で共有するコントローラー |
| `children?`  | `ReactNode`              | スコープ内に描画する要素           |

### `useControlledCallback`

```ts
function useControlledCallback<
  F extends SyncLooseFunction,
  P extends CancelPolicy = CancelPolicy,
>(fn: F, controller?: ExecutionControllerTarget<P>): ControlledFunction<F, P>;
```

コントローラーの制御下で実行される関数を返します。

- 返す関数の参照は、コントローラーが変わらない限り変わりません。
- 呼び出し時には常に最新の `fn` が実行されるため、`fn` 内で最新の props や state を参照できます。
- 呼び出し時の `this` は `fn` に引き継がれます。
- コントローラーが見つからない場合は、制御せずに `fn` を実行する関数を返します。この場合も戻り値は `Promise` で、`fn` の例外は reject として返ります。

戻り値の型は、コントローラーのインスタンスを指定した場合はその `cancelPolicy` から決まります。未指定・ID の場合は、型の上ではどのコントローラーが使われるか分からないため、解決値に `CANCEL` を含む型になります。`isCanceled` で判定してください。

```ts
import { isCanceled } from '@fringeworks/execution-controller';

const upload = useControlledCallback(uploadFile, 'upload');
// ...
const result = await upload(file);
if (isCanceled(result)) {
  return;
}
```

| 引数          | 型                             | 説明                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------ |
| `fn`          | `F`                            | 対象の関数                                             |
| `controller?` | `ExecutionControllerTarget<P>` | コントローラーの指定（「コントローラーの指定」を参照） |

### `useExecutionState`

```ts
function useExecutionState(
  controller?: ExecutionControllerTarget,
): ExecutionState;
```

`controller` で指定したコントローラーの実行状態を返します（指定方法は「コントローラーの指定」を参照）。実行状態が変わると再レンダリングされます。\
状態が変わらない限り、同じオブジェクトを返します。コントローラーが見つからない場合は、常に `{ executing: 0, isExecuting: false }` を返します。

| プロパティ    | 型        | 説明                                                                                        |
| ------------- | --------- | ------------------------------------------------------------------------------------------- |
| `executing`   | `number`  | 実行中の関数の件数。`SerialController` の順番待ちなど、実行を待機している呼び出しは含まない |
| `isExecuting` | `boolean` | 1件以上の関数が実行中か                                                                     |

### `useExecutionController`

```ts
function useExecutionController(
  id?: string,
): AnyExecutionController | undefined;
```

`ExecutionScope` で共有されているコントローラーを返します。`id` を省略すると最寄りのスコープのコントローラーを、指定するとスコープを遡って ID が一致するコントローラーを返します。見つからない場合は `undefined` を返します。

### `useLocalExecutionController`

```ts
function useLocalExecutionController<C extends AnyExecutionController>(
  factory: () => C,
): C;
```

コンポーネント内でのみ使用するコントローラーを作成します。

- `factory` は初回のレンダリングでのみ呼ばれ、以降は同じインスタンスを返します。
- アンマウント時に、実行を待機している呼び出し（デバウンス待ちなど）をキャンセルします。既に実行中の関数は中断しません。

### 型

| 型                             | 説明                                                                       |
| ------------------------------ | -------------------------------------------------------------------------- |
| `ExecutionScopeProps`          | `ExecutionScope` のプロパティ                                              |
| `ExecutionState`               | `useExecutionState` の戻り値                                               |
| `ExecutionControllerTarget<P>` | hook の `controller` 引数の型。ID の文字列か、コントローラーのインスタンス |
| `AnyExecutionController`       | 種別・`cancelPolicy` を問わないコントローラーの型                          |

## ライセンス

MIT
