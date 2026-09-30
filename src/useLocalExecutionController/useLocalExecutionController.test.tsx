import { CANCEL, DebounceController } from '@niche-works/execution-controller';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useLocalExecutionController from './useLocalExecutionController';

describe('useLocalExecutionController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('再レンダリングしても同じインスタンスを返し、factoryは一度だけ呼ばれる', () => {
    const factory = vi.fn(() => new DebounceController({ id: 'test' }));
    const { result, rerender } = renderHook(() =>
      useLocalExecutionController(factory),
    );
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('アンマウント時に実行を待機している呼び出しをキャンセルする', async () => {
    const { result, unmount } = renderHook(() =>
      useLocalExecutionController(
        () => new DebounceController({ id: 'test', cancelPolicy: 'resolve' }),
      ),
    );
    const fn = vi.fn(async () => 'ok');
    const promise = result.current.wrap(fn)!();

    unmount();
    expect(await promise).toBe(CANCEL);

    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).not.toHaveBeenCalled();
  });
});
