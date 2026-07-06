'use client';

import type { I18nPack } from '@i18n/types';

interface DisplayProps {
  expression: string;
  display: string;
  hasError: boolean;
  i18n: I18nPack;
}

export function Display({ expression, display, hasError, i18n }: DisplayProps) {
  return (
    <div className="calc-display">
      <div className="calc-expression" aria-label="expression">
        {expression || '\u00A0'}
      </div>
      <div
        className={`calc-result ${hasError ? 'calc-result--error' : ''}`}
        aria-label={`result: ${display}`}
      >
        {hasError ? i18n.errors.divideByZero : display}
      </div>
    </div>
  );
}
