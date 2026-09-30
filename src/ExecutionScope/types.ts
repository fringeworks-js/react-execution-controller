import type { PropsWithChildren } from 'react';
import type { AnyExecutionController } from '../types';

/**
 * プロパティ
 */
export type ExecutionScopeProps = PropsWithChildren<{
  /**
   * スコープ内で共有するコントローラー
   */
  controller: AnyExecutionController;
}>;
