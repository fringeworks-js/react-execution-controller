'use client';

import type { CancelPolicy } from '@niche-works/execution-controller';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import useTargetController from '../_internal/_useTargetController';
import type { ExecutionControllerTarget } from '../types';
import type { ExecutionState } from './types';

const unsubscribe = () => {};

/**
 * コントローラーの実行状態を取得するhook
 *
 * 実行状態が変わると再レンダリングされる。
 * コントローラーが見つからない場合は、常に実行していない状態を返す。
 *
 * @param controller コントローラーの指定。未指定の場合は最寄りの`ExecutionScope`のコントローラー
 * @returns 実行状態
 */
export default function useExecutionState<P extends CancelPolicy>(
  controller?: ExecutionControllerTarget<P>,
): ExecutionState {
  const target = useTargetController(controller);

  const subscribe = useCallback(
    (listener: () => void) =>
      target ? target.subscribe(listener) : unsubscribe,
    [target],
  );
  const getSnapshot = () => (target ? target.executing : 0);
  const executing = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({ executing, isExecuting: executing > 0 }),
    [executing],
  );
}
