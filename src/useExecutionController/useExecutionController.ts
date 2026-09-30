'use client';

import { useContext } from 'react';
import ExecutionScopeContext, {
  findController,
} from '../_internal/_ExecutionScopeContext';
import type { AnyExecutionController } from '../types';

/**
 * `ExecutionScope`で共有されているコントローラーを取得するhook
 *
 * @param id コントローラーのID。未指定の場合は最寄りのスコープのコントローラー
 * @returns コントローラー。見つからない場合は`undefined`
 */
export default function useExecutionController(
  id?: string,
): AnyExecutionController | undefined {
  const scope = useContext(ExecutionScopeContext);
  return findController(scope, id);
}
