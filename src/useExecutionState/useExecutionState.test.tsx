import { ParallelController } from '@niche-works/execution-controller';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import ExecutionScope from '../ExecutionScope';
import useExecutionState from './useExecutionState';

describe('useExecutionState', () => {
  it('コントローラーが無い場合は実行していない状態を返す', () => {
    const { result } = renderHook(() => useExecutionState());
    expect(result.current).toEqual({ executing: 0, isExecuting: false });
  });

  it('実行の開始と終了に追従する', async () => {
    const controller = new ParallelController({ id: 'test' });
    const wrapper = ({ children }: PropsWithChildren) => (
      <ExecutionScope controller={controller}>{children}</ExecutionScope>
    );
    const { result } = renderHook(() => useExecutionState(), { wrapper });

    const resolves: Array<() => void> = [];
    const wrapped = controller.wrap(
      () => new Promise<void>((resolve) => resolves.push(resolve)),
    )!;

    let p1: Promise<void>;
    let p2: Promise<void>;
    act(() => {
      p1 = wrapped();
      p2 = wrapped();
    });
    expect(result.current).toEqual({ executing: 2, isExecuting: true });

    await act(async () => {
      resolves[0]();
      await p1;
    });
    expect(result.current).toEqual({ executing: 1, isExecuting: true });

    await act(async () => {
      resolves[1]();
      await p2;
    });
    expect(result.current).toEqual({ executing: 0, isExecuting: false });
  });

  it('インスタンスを指定したコントローラーの状態を返す', () => {
    const controller = new ParallelController({ id: 'test' });
    const { result } = renderHook(() => useExecutionState(controller));

    act(() => {
      controller.wrap(() => new Promise<void>(() => {}))!();
    });
    expect(result.current.isExecuting).toBe(true);
  });

  it('状態が変わらない限り同じオブジェクトを返す', () => {
    const controller = new ParallelController({ id: 'test' });
    const { result, rerender } = renderHook(() =>
      useExecutionState(controller),
    );
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });
});
