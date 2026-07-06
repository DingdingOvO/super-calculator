'use client';

import { CalcButton, ButtonGrid } from '@components/Button';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

const StandardButtons = ({ i18n, onDigit, onOperator, onEquals, onClear, onBackspace, onNegate, onPercent }: {
  i18n: I18nPack;
  onDigit: (d: string) => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onNegate: () => void;
  onPercent: () => void;
}) => (
  <ButtonGrid>
    {/* 第一行 */}
    <CalcButton variant="function" onClick={onPercent} aria-label="percent">
      {i18n.buttons.percent}
    </CalcButton>
    <CalcButton variant="function" onClick={onClear} aria-label="clear">
      {i18n.buttons.clear}
    </CalcButton>
    <CalcButton variant="function" onClick={onBackspace} aria-label="backspace">
      {i18n.buttons.backspace === '⌫' ? '⌫' : '⌫'}
    </CalcButton>
    <CalcButton variant="operator" onClick={() => onOperator('divide')} aria-label="divide">
      {i18n.buttons.divide}
    </CalcButton>

    {/* 第二行 */}
    <CalcButton variant="number" onClick={() => onDigit('7')}>7</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('8')}>8</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('9')}>9</CalcButton>
    <CalcButton variant="operator" onClick={() => onOperator('multiply')} aria-label="multiply">
      {i18n.buttons.multiply}
    </CalcButton>

    {/* 第三行 */}
    <CalcButton variant="number" onClick={() => onDigit('4')}>4</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('5')}>5</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('6')}>6</CalcButton>
    <CalcButton variant="operator" onClick={() => onOperator('subtract')} aria-label="subtract">
      {i18n.buttons.subtract}
    </CalcButton>

    {/* 第四行 */}
    <CalcButton variant="number" onClick={() => onDigit('1')}>1</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('2')}>2</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('3')}>3</CalcButton>
    <CalcButton variant="operator" onClick={() => onOperator('add')} aria-label="add">
      {i18n.buttons.add}
    </CalcButton>

    {/* 第五行 */}
    <CalcButton variant="function" onClick={onNegate} aria-label="negate">
      {i18n.buttons.negate}
    </CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('0')}>0</CalcButton>
    <CalcButton variant="number" onClick={() => onDigit('.')} aria-label="decimal">
      {i18n.buttons.decimal}
    </CalcButton>
    <CalcButton variant="equals" onClick={onEquals} aria-label="equals">
      {i18n.buttons.equals}
    </CalcButton>
  </ButtonGrid>
);

export function createStandardPlugin(
  handlers: {
    onDigit: (d: string) => void;
    onOperator: (op: string) => void;
    onEquals: () => void;
    onClear: () => void;
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
