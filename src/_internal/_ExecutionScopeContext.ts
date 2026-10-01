'use client';

import { createContext } from 'react';
import type { AnyExecutionController } from '../types';

/**
 * `ExecutionScope`が提供する値
 */
export type ExecutionScopeContextValue = {
  /**
   * このスコープのコントローラー
   */
  controller: AnyExecutionController;

  /**
   * 親のスコープ
   */
  parent: ExecutionScopeContextValue | null;
};

/**
 * `ExecutionScope`のコンテキスト
 */
const ExecutionScopeContext = createContext<ExecutionScopeContextValue | null>(
  null,
);
ExecutionScopeContext.displayName = 'ExecutionScopeContext';
export default ExecutionScopeContext;

/**
 * スコープを遡ってコントローラーを探す
 *
 * @param scope 起点のスコープ
 * @param id コントローラーのID。未指定の場合は起点のスコープのコントローラー
 * @returns
 */
export function findController(
  scope: ExecutionScopeContextValue | null,
  id?: string,
): AnyExecutionController | undefined {
  if (id == null) {
    // idの指定が無い場合は直近のもの
    return scope?.controller;
  }
  for (let current = scope; current; current = current.parent) {
    if (current.controller.id === id) {
      // 遡って最初に見つけたIDが一致するもの
      return current.controller;
    }
  }
  return undefined;
}
