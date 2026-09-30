# @niche-works/react-execution-controller

`@niche-works/react-execution-controller` は [`@niche-works/execution-controller`](https://www.npmjs.com/package/@niche-works/execution-controller) を React の画面内で共有して利用するためのニッチなライブラリです。\
ボタンの連打防止、実行中の他の操作の破棄、非同期処理の並列数の制限などを、コンポーネントをまたいで実現できます。

**[English README is available here](./README.md)**

## インストール

```bash
npm install @niche-works/react-execution-controller @niche-works/execution-controller
# または
pnpm add @niche-works/react-execution-controller @niche-works/execution-controller
```

## 使い方

### 画面内でコントローラーを共有する

`ExecutionScope` で共有する範囲を決め、その中の hook からコントローラーを利用します。

```tsx
import { ExclusiveController } from '@niche-works/execution-controller';
import {
  ExecutionScope,
  useControlledCallback,
  useExecutionState,
} from '@niche-works/react-execution-controller';

// 保存・削除のどちらかを実行している間は、他の操作を破棄する
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
      保存
    </button>
  );
}
```

### コンポーネント内だけで使う

共有する必要がない場合は、`useLocalExecutionController` でコンポーネント専用のコントローラーを作成し、hook に渡します。

```tsx
import { ExclusiveController } from '@niche-works/execution-controller';
import {
  useControlledCallback,
  useLocalExecutionController,
} from '@niche-works/react-execution-controller';

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
<ExecutionScope controller={new ParallelController({ id: 'upload', limit: 3 })}>
  <ExecutionScope controller={new ExclusiveController({ id: 'form' })}>
    <Uploader />
  </ExecutionScope>
</ExecutionScope>;

function Uploader() {
  // 'form' の外側にある 'upload' で並列数を制限する
  const upload = useControlledCallback(uploadFile, 'upload');
  // ...
}
```

## API

### コントローラーの指定

hook の `controller` 引数には、以下のいずれかを指定できます。

| 指定           | 使用するコントローラー                                              |
| -------------- | ------------------------------------------------------------------- |
| 未指定         | 最寄りの `ExecutionScope` のコントローラー                          |
| 文字列         | `ExecutionScope` を遡って最初に見つかった、ID が一致するコントローラー |
| インスタンス   | 指定されたコントローラー                                            |

コントローラーが見つからない場合もエラーにはならず、制御なしで動作します（テストや Storybook で `ExecutionScope` を用意しなくても使えます）。

### ExecutionScope

子孫のコンポーネントでコントローラーを共有するコンポーネントです。

| プロパティ   | 型                    | 説明                           |
| ------------ | --------------------- | ------------------------------ |
| `controller` | `ExecutionController` | スコープ内で共有するコントローラー |

### useControlledCallback

```ts
useControlledCallback(fn, controller?): ControlledFunction
```

コントローラーの制御下で実行される関数を返します。

- 返す関数の参照は、コントローラーが変わらない限り変わりません。
- 呼び出し時には常に最新の `fn` が実行されるため、`fn` 内で最新の props や state を参照できます。
- コントローラーが見つからない場合は、制御せずに `fn` を実行する関数を返します。

### useExecutionState

```ts
useExecutionState(controller?): { executing: number; isExecuting: boolean }
```

コントローラーの実行状態を返します。実行状態が変わると再レンダリングされます。\
コントローラーが見つからない場合は、常に `{ executing: 0, isExecuting: false }` を返します。

### useExecutionController

```ts
useExecutionController(id?): ExecutionController | undefined
```

`ExecutionScope` で共有されているコントローラーを返します。見つからない場合は `undefined` を返します。

### useLocalExecutionController

```ts
useLocalExecutionController(factory): ExecutionController
```

コンポーネント内でのみ使用するコントローラーを作成します。

- `factory` は初回のレンダリングでのみ呼ばれ、以降は同じインスタンスを返します。
- アンマウント時に、実行を待機している呼び出し（デバウンス待ちなど）をキャンセルします。

> [!WARNING]
> コントローラーのインスタンスを hook に直接渡す場合、レンダリングのたびに `new` しないでください。インスタンスが作り直されると、連打防止などの状態がリセットされます。\
> コンポーネント内で作成する場合は `useLocalExecutionController` を使用してください。

## ライセンス

MIT
