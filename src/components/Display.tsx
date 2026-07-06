'use client';

import { useMemo } from 'react';
import type { I18nPack } from '@i18n/types';

interface DisplayProps {
  expression: string;
  display: string;
  hasError: boolean;
  i18n: I18nPack;
}

/** 根据显示字符长度计算字体大小 */
function calcFontSize(text: string, hasError: boolean): string {
  if (hasError) return '1.2rem';
  const len = text.length;
  if (len <= 10) return '2.5rem';
  // 10→2.5rem, 逐渐线性缩小到 20→1.2rem
  const clamped = Math.min(Math.max(len, 10), 20);
  const ratio = (clamped - 10) / 10; // 0→1
  const size = 2.5 - ratio * (2.5 - 1.2);
  return `${size.toFixed(2)}rem`;
}

export function Display({ expression, display, hasError, i18n }: DisplayProps) {
  const fontSize = useMemo(() => calcFontSize(display, hasError), [display, hasError]);

  return (
    <div className="calc-display">
      <div className="calc-expression" aria-label="expression">
        {expression || '\u00A0'}
      </div>
      <div
        className={`calc-result ${hasError ? 'calc-result--error' : ''}`}
        style={{ fontSize }}
        aria-label={`result: ${display}`}
      >
        {hasError ? i18n.errors.divideByZero : display}
      </div>
    </div>
  );
}
