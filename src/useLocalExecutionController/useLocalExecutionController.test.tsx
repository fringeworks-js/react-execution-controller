import { CANCEL, DebounceController } from '@fringeworks/execution-controller';
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

  it('StrictModeでも、マウント後の呼び出しを実行し、アンマウント時にキャンセルする', async () => {
    const { result, unmount } = renderHook(
      () =>
        useLocalExecutionController(
          () => new DebounceController({ id: 'test', cancelPolicy: 'resolve' }),
        ),
      { reactStrictMode: true },
    );
    const fn = vi.fn(async () => 'ok');

    // StrictModeのエフェクトの再実行でキャンセルされた状態が残らない
    const first = result.current.wrap(fn)();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await first).toBe('ok');

    const second = result.current.wrap(fn)();
    unmount();
    expect(await second).toBe(CANCEL);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
