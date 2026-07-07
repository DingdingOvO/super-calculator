'use client';

import { CalcButton, ButtonGrid } from '@components/Button';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';
import { DivideIcon } from '@components/icons/Divide';
import { MultiplyIcon } from '@components/icons/Multiply';
import { MinusIcon } from '@components/icons/Minus';
import { PlusIcon } from '@components/icons/Plus';
import { EqualsIcon } from '@components/icons/Equals';
import { PercentIcon } from '@components/icons/Percent';
import { NegateIcon } from '@components/icons/Negate';
import { BackspaceIcon } from '@components/icons/Backspace';

const iconSize = { width: 20, height: 20 };

const StandardButtons = ({ i18n, onDigit, onOperator, onEquals, onClear, onClearEntry, onBackspace, onNegate, onPercent }: {
  i18n: I18nPack;
  onDigit: (d: string) => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onClearEntry: () => void;
  onBackspace: () => void;
  onNegate: () => void;
  onPercent: () => void;
}) => (
  <div>
    {/* 第一行：5 按钮 — Win11 布局：% CE C ⌫ ÷ */}
    <div className="calc-button-grid calc-button-grid--top">
      <CalcButton variant="function" onClick={onPercent} aria-label="percent">
        <PercentIcon {...iconSize} />
      </CalcButton>
      <CalcButton variant="function" onClick={onClearEntry} aria-label="clear-entry">
        CE
      </CalcButton>
      <CalcButton variant="function" onClick={onClear} aria-label="clear">
        C
      </CalcButton>
      <CalcButton variant="function" onClick={onBackspace} aria-label="backspace">
        <BackspaceIcon {...iconSize} />
      </CalcButton>
      <CalcButton variant="operator" onClick={() => onOperator('divide')} aria-label="divide">
        <DivideIcon {...iconSize} />
      </CalcButton>
    </div>

    <ButtonGrid>
      {/* 第二行：7 8 9 × */}
      <CalcButton variant="number" onClick={() => onDigit('7')}>7</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('8')}>8</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('9')}>9</CalcButton>
      <CalcButton variant="operator" onClick={() => onOperator('multiply')} aria-label="multiply">
        <MultiplyIcon {...iconSize} />
      </CalcButton>

      {/* 第三行：4 5 6 − */}
      <CalcButton variant="number" onClick={() => onDigit('4')}>4</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('5')}>5</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('6')}>6</CalcButton>
      <CalcButton variant="operator" onClick={() => onOperator('subtract')} aria-label="subtract">
        <MinusIcon {...iconSize} />
      </CalcButton>

      {/* 第四行：1 2 3 + */}
      <CalcButton variant="number" onClick={() => onDigit('1')}>1</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('2')}>2</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('3')}>3</CalcButton>
      <CalcButton variant="operator" onClick={() => onOperator('add')} aria-label="add">
        <PlusIcon {...iconSize} />
      </CalcButton>

      {/* 第五行：± 0 . = */}
      <CalcButton variant="function" onClick={onNegate} aria-label="negate">
        <NegateIcon {...iconSize} />
      </CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('0')}>0</CalcButton>
      <CalcButton variant="number" onClick={() => onDigit('.')} aria-label="decimal">
        .
      </CalcButton>
      <CalcButton variant="equals" onClick={onEquals} aria-label="equals">
        <EqualsIcon {...iconSize} />
      </CalcButton>
    </ButtonGrid>
  </div>
);

export function createStandardPlugin(
  handlers: {
    onDigit: (d: string) => void;
    onOperator: (op: string) => void;
    onEquals: () => void;
    onClear: () => void;
    onClearEntry: () => void;
    onBackspace: () => void;
    onNegate: () => void;
    onPercent: () => void;
  },
): CalculatorPlugin {
  return {
    meta: {
      id: 'standard',
      name: '标准',
      icon: null,
      enabled: true,
    },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <StandardButtons i18n={_i18n} {...handlers} />,
    }),
  };
}
