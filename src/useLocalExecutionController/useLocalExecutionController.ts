'use client';

import { useEffect, useState } from 'react';
import type { AnyExecutionController } from '../types';

/**
 * コンポーネント内でのみ使用するコントローラーを作成するhook
 *
 * `factory`は初回のレンダリングでのみ呼ばれ、以降は同じインスタンスを返す。
 * アンマウント時には、実行を待機している呼び出しをキャンセルする。
 *
 * @param factory コントローラーを作成する関数
 * @returns コントローラー
 */
export default function useLocalExecutionController<
  C extends AnyExecutionController,
>(factory: () => C): C {
  const [controller] = useState(factory);

  useEffect(() => () => controller.cancel(), [controller]);

  return controller;
}
