/**
 * 実行状態
 */
export type ExecutionState = {
  /**
   * 実行中の関数の件数
   */
  executing: number;

  /**
   * 1件以上の関数が実行中か
   */
  isExecuting: boolean;
};
