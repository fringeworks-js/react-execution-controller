'use client';

import { createElement, useContext, useMemo } from 'react';
import ExecutionScopeContext from '../_ExecutionScopeContext';
import type { ExecutionScopeProps } from './types';

/**
 * 子孫のコンポーネントでコントローラーを共有するスコープ
 *
 * 入れ子にした場合、hookは最寄りのスコープのコントローラーを使用する。
 * IDを指定した場合は、スコープを遡ってIDが一致するコントローラーを使用する。
 */
export default function ExecutionScope(props: ExecutionScopeProps) {
  const { controller, children } = props;
  const parent = useContext(ExecutionScopeContext);
  const value = useMemo(() => ({ controller, parent }), [controller, parent]);

  // 利用側のJSXの設定に依存しないようcreateElementを使用する
  return createElement(ExecutionScopeContext.Provider, { value }, children);
}
