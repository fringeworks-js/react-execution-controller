'use client';

import type { CancelPolicy } from '@fringeworks/execution-controller';
import type {
  AnyExecutionController,
  ExecutionControllerTarget,
} from '../types';
import useExecutionController from '../useExecutionController';

/**
 * hookの引数で指定されたコントローラーを解決する
 *
 * @param controller コントローラーの指定
 * @returns コントローラー。見つからない場合は`undefined`
 */
export default function useTargetController<P extends CancelPolicy>(
  controller?: ExecutionControllerTarget<P>,
): AnyExecutionController | undefined {
  const isId = typeof controller === 'string';
  // hookは条件付きで呼べないため、インスタンス指定の場合も呼び出しておく
  const scoped = useExecutionController(isId ? controller : undefined);
  return !isId && controller != null ? controller : scoped;
}
