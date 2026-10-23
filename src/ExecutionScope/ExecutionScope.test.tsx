import { ExclusiveController } from '@fringeworks/execution-controller';
import { renderHook } from '@testing-library/react';
import { useContext, type PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import ExecutionScopeContext from '../_internal/_ExecutionScopeContext';
import type { AnyExecutionController } from '../types';
import ExecutionScope from './ExecutionScope';

describe('ExecutionScope', () => {
  const a = new ExclusiveController({ id: 'a' });
  const b = new ExclusiveController({ id: 'b' });

  /**
   * スコープのコンテキストの値を取得する。rerenderでスコープのコントローラーを差し替えられる
   */
  function renderScope() {
    let current: AnyExecutionController = a;
    const wrapper = ({ children }: PropsWithChildren) => (
      <ExecutionScope controller={current}>{children}</ExecutionScope>
    );
    const rendered = renderHook(() => useContext(ExecutionScopeContext), {
      wrapper,
    });
    return {
      ...rendered,
      rerender: (controller: AnyExecutionController) => {
        current = controller;
        rendered.rerender();
      },
    };
  }

  it('コントローラーが変わらない限り、同じ値を提供する', () => {
    const { result, rerender } = renderScope();
    const first = result.current;

    rerender(a);
    expect(result.current).toBe(first);
  });

  it('コントローラーが変わった場合は、新しい値を提供する', () => {
    const { result, rerender } = renderScope();
    const first = result.current;

    rerender(b);
    expect(result.current).not.toBe(first);
    expect(result.current?.controller).toBe(b);
  });
});
