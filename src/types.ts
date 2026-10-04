import type {
  CancelPolicy,
  ExecutionController,
} from '@fringeworks/execution-controller';

/**
 * 種別・キャンセル時の動作を問わない実行コントローラー
 */
export type AnyExecutionController = ExecutionController<string, CancelPolicy>;

/**
 * hookで利用する実行コントローラーの指定
 *
 * - 未指定: 最寄りの`ExecutionScope`のコントローラー
 * - 文字列: `ExecutionScope`を遡って最初に見つかった、IDが一致するコントローラー
 * - インスタンス: 指定されたコントローラー
 */
export type ExecutionControllerTarget<P extends CancelPolicy = CancelPolicy> =
  string | ExecutionController<string, P>;
