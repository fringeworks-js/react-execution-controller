import {
  ExclusiveController,
  ParallelController,
} from '@fringeworks/execution-controller';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import ExecutionScope from '../ExecutionScope';
import useExecutionController from './useExecutionController';

describe('useExecutionController', () => {
  const outer = new ParallelController({ id: 'outer' });
  const inner = new ExclusiveController({ id: 'inner' });
  const wrapper = ({ children }: PropsWithChildren) => (
    <ExecutionScope controller={outer}>
      <ExecutionScope controller={inner}>{children}</ExecutionScope>
    </ExecutionScope>
  );

  it('スコープが無い場合はundefinedを返す', () => {
    const { result } = renderHook(() => useExecutionController());
    expect(result.current).toBeUndefined();
  });

  it('IDが未指定の場合は最寄りのスコープのコントローラーを返す', () => {
    const { result } = renderHook(() => useExecutionController(), {
      wrapper,
    });
    expect(result.current).toBe(inner);
  });

  it('IDを指定した場合はスコープを遡って一致するコントローラーを返す', () => {
    const { result } = renderHook(() => useExecutionController('outer'), {
      wrapper,
    });
    expect(result.current).toBe(outer);
  });

  it('IDが一致するコントローラーが無い場合はundefinedを返す', () => {
    const { result } = renderHook(() => useExecutionController('unknown'), {
      wrapper,
    });
    expect(result.current).toBeUndefined();
  });
});
