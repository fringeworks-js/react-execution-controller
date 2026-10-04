import {
  CANCEL,
  ExclusiveController,
  SerialController,
} from '@fringeworks/execution-controller';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ExecutionScope from '../ExecutionScope';
import useControlledCallback from './useControlledCallback';

/**
 * 外部から解決できる非同期関数を作成する
 */
function createDeferred() {
  let resolve: (value: string) => void;
  const fn = vi.fn(
    () =>
      new Promise<string>((res) => {
        resolve = res;
      }),
  );
  return { fn, resolve: (value: string) => resolve(value) };
}

describe('useControlledCallback', () => {
  it('コントローラーが無い場合は制御せずに実行する', async () => {
    const fn = vi.fn((n: number) => n * 2);
    const { result } = renderHook(() => useControlledCallback(fn));

    expect(await result.current(1)).toBe(2);
    expect(await result.current(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('スコープのコントローラーで制御される', async () => {
    const controller = new ExclusiveController({
      id: 'test',
      cancelPolicy: 'resolve',
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <ExecutionScope controller={controller}>{children}</ExecutionScope>
    );
    const { fn, resolve } = createDeferred();
    const { result } = renderHook(() => useControlledCallback(fn), {
      wrapper,
    });

    const p1 = result.current();
    const p2 = result.current();
    expect(await p2).toBe(CANCEL);

    resolve('done');
    expect(await p1).toBe('done');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('同じスコープ内の別の関数とも制御を共有する', async () => {
    const controller = new ExclusiveController({
      id: 'test',
      cancelPolicy: 'resolve',
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <ExecutionScope controller={controller}>{children}</ExecutionScope>
    );
    const first = createDeferred();
    const second = vi.fn(async () => 'second');
    const { result } = renderHook(
      () => ({
        first: useControlledCallback(first.fn),
        second: useControlledCallback(second),
      }),
      { wrapper },
    );

    const p1 = result.current.first();
    expect(await result.current.second()).toBe(CANCEL);
    expect(second).not.toHaveBeenCalled();

    first.resolve('first');
    expect(await p1).toBe('first');
  });

  it('IDを指定したコントローラーで制御される', async () => {
    const outer = new ExclusiveController({
      id: 'outer',
      cancelPolicy: 'resolve',
    });
    const inner = new SerialController({ id: 'inner' });
    const wrapper = ({ children }: PropsWithChildren) => (
      <ExecutionScope controller={outer}>
        <ExecutionScope controller={inner}>{children}</ExecutionScope>
      </ExecutionScope>
    );
    const { fn, resolve } = createDeferred();
    const { result } = renderHook(() => useControlledCallback(fn, 'outer'), {
      wrapper,
    });

    const p1 = result.current();
    expect(outer.isExecuting).toBe(true);
    expect(inner.isExecuting).toBe(false);
    expect(await result.current()).toBe(CANCEL);

    resolve('done');
    await p1;
  });

  it('インスタンスを指定したコントローラーで制御される', async () => {
    const controller = new ExclusiveController({
      id: 'test',
      cancelPolicy: 'resolve',
    });
    const { fn, resolve } = createDeferred();
    const { result } = renderHook(() => useControlledCallback(fn, controller));

    const p1 = result.current();
    expect(controller.isExecuting).toBe(true);
    expect(await result.current()).toBe(CANCEL);

    resolve('done');
    await p1;
  });

  it('再レンダリングしても関数の参照は変わらず、最新の関数が実行される', async () => {
    const controller = new ExclusiveController({ id: 'test' });
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) =>
        useControlledCallback(() => value, controller),
      { initialProps: { value: 'a' } },
    );
    const first = result.current;

    rerender({ value: 'b' });
    expect(result.current).toBe(first);
    expect(await result.current()).toBe('b');
  });

  it('コントローラーが変わった場合は新しい関数を返す', () => {
    const a = new ExclusiveController({ id: 'a' });
    const b = new ExclusiveController({ id: 'b' });
    const { result, rerender } = renderHook(
      ({ controller }) => useControlledCallback(() => {}, controller),
      { initialProps: { controller: a } },
    );
    const first = result.current;

    rerender({ controller: b });
    expect(result.current).not.toBe(first);
  });
});
