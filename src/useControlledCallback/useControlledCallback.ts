'use client';

import type {
  CancelPolicy,
  ControlledFunction,
} from '@fringeworks/execution-controller';
import useLatestRef from '@fringeworks/react-utils/hooks/useLatestRef';
import type { SyncLooseFunction } from '@fringeworks/types';
import { useMemo } from 'react';
import useTargetController from '../_internal/_useTargetController';
import type { ExecutionControllerTarget } from '../types';

/**
 * コントローラーの制御下で実行される関数を作成するhook
 *
 * 返却する関数の参照は、コントローラーが変わらない限り変わらない。
 * 呼び出し時には常に最新の`fn`が実行される。
 * コントローラーが見つからない場合は、制御せずに`fn`を実行する関数を返す。
 *
 * @param fn 対象の関数
 * @param controller コントローラーの指定。未指定の場合は最寄りの`ExecutionScope`のコントローラー
 * @returns 制御された関数
 */
export default function useControlledCallback<
  F extends SyncLooseFunction,
  P extends CancelPolicy = 'ignore',
>(fn: F, controller?: ExecutionControllerTarget<P>): ControlledFunction<F, P> {
  const target = useTargetController(controller);

  // 最新のfnを保持する
  const fnRef = useLatestRef(fn);

  const callback = useMemo(() => {
    function latest(this: unknown, ...args: Parameters<F>) {
      // 最新の関数を実行
      return fnRef.current?.apply(this, args);
    }

    if (target) {
      // コントローラーあり
      return target.wrap(latest) as ControlledFunction<F, P>;
    } else {
      // コントローラーなし
      // 戻り値の型を揃えるため非同期で実行する関数を返す
      return async function (this: unknown, ...args: Parameters<F>) {
        return latest.apply(this, args);
      } as ControlledFunction<F, P>;
    }
  }, [target]);

  return callback;
}
