'use client';

import { useState, useCallback, useRef } from 'react';
import { CalcButton, ButtonGrid } from '@components/Button';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';
import { DivideIcon } from '@components/icons/Divide';
import { MultiplyIcon } from '@components/icons/Multiply';
import { MinusIcon } from '@components/icons/Minus';
import { PlusIcon } from '@components/icons/Plus';
import { EqualsIcon } from '@components/icons/Equals';

const iconSize = { width: 18, height: 18 };

interface ScientificPanelProps {
  i18n: I18nPack;
  onClear: () => void;
  onBackspace: () => void;
}

function ScientificPanel({ onClear, onBackspace }: ScientificPanelProps) {
  const [expr, setExpr] = useState('');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [result, setResult] = useState<string | null>(null);
  const wasmRef = useRef<any>(null);

  // 懒加载 WASM 的 evaluate_expression
  const getEval = useCallback(async () => {
    if (!wasmRef.current) {
      try {
        const mod = await import('rust-calculator');
        wasmRef.current = mod;
      } catch {
        return null;
      }
    }
    return (wasmRef.current as any).evaluate_expression;
  }, []);

  const append = useCallback((s: string) => {
    setExpr(prev => prev + s);
    setResult(null);
  }, []);

  const appendFn = useCallback((fn: string) => {
    setExpr(prev => prev + fn + '(');
    setResult(null);
  }, []);

  const handleEvaluate = useCallback(async () => {
    if (!expr.trim()) {return;}
    const evaluateFn = await getEval();
    if (!evaluateFn) {
      setResult('引擎未加载');
      return;
    }
    try {
      const res = evaluateFn(expr, angleMode);
      setResult(res);
    } catch (e: any) {
      setResult('错误: ' + (e?.message || String(e)));
    }
  }, [expr, angleMode, getEval]);

  const handleClear = useCallback(() => {
    setExpr('');
    setResult(null);
    onClear();
  }, [onClear]);

  const handleBackspace = useCallback(() => {
    setExpr(prev => prev.slice(0, -1));
    setResult(null);
    onBackspace();
  }, [onBackspace]);

  const toggleAngle = useCallback(() => {
    setAngleMode(prev => prev === 'deg' ? 'rad' : 'deg');
  }, []);

  return (
    <div className="sci-panel">
      {/* 表达式输入 + 角度切换 */}
      <div className="sci-input-row">
        <input
          className="sci-input"
          value={expr}
          onChange={e => setExpr(e.target.value)}
          placeholder="输入表达式..."
          onKeyDown={e => { if (e.key === 'Enter') {handleEvaluate();} }}
        />
        <button
          className={`sci-angle-toggle ${angleMode === 'rad' ? 'sci-angle-toggle--rad' : ''}`}
          onClick={toggleAngle}
          type="button"
        >
          {angleMode === 'deg' ? 'DEG' : 'RAD'}
        </button>
      </div>

      {/* 结果 */}
      {result !== null && (
        <div className={`sci-result ${result.includes('错误') || result.startsWith('错误') ? 'sci-result--error' : ''}`}>
          {result}
        </div>
      )}

      {/* 函数按钮 */}
      <div className="sci-func-grid">
        <button className="sci-func-btn" onClick={() => appendFn('sin')} type="button">sin</button>
        <button className="sci-func-btn" onClick={() => appendFn('cos')} type="button">cos</button>
        <button className="sci-func-btn" onClick={() => appendFn('tan')} type="button">tan</button>
        <button className="sci-func-btn" onClick={() => appendFn('log')} type="button">log</button>
        <button className="sci-func-btn" onClick={() => appendFn('ln')} type="button">ln</button>
        <button className="sci-func-btn" onClick={() => appendFn('sqrt')} type="button">√</button>
      </div>

      <ButtonGrid>
        <CalcButton variant="function" onClick={() => append('(')}>(</CalcButton>
        <CalcButton variant="function" onClick={() => append(')')}>)</CalcButton>
        <CalcButton variant="function" onClick={handleClear}>C</CalcButton>
        <CalcButton variant="operator" onClick={() => append('/')}><DivideIcon {...iconSize} /></CalcButton>

        <CalcButton variant="number" onClick={() => append('7')}>7</CalcButton>
        <CalcButton variant="number" onClick={() => append('8')}>8</CalcButton>
        <CalcButton variant="number" onClick={() => append('9')}>9</CalcButton>
        <CalcButton variant="operator" onClick={() => append('*')}><MultiplyIcon {...iconSize} /></CalcButton>

        <CalcButton variant="number" onClick={() => append('4')}>4</CalcButton>
        <CalcButton variant="number" onClick={() => append('5')}>5</CalcButton>
        <CalcButton variant="number" onClick={() => append('6')}>6</CalcButton>
        <CalcButton variant="operator" onClick={() => append('-')}><MinusIcon {...iconSize} /></CalcButton>

        <CalcButton variant="number" onClick={() => append('1')}>1</CalcButton>
        <CalcButton variant="number" onClick={() => append('2')}>2</CalcButton>
        <CalcButton variant="number" onClick={() => append('3')}>3</CalcButton>
        <CalcButton variant="operator" onClick={() => append('+')}><PlusIcon {...iconSize} /></CalcButton>

        <CalcButton variant="function" onClick={() => append('pi')}>π</CalcButton>
        <CalcButton variant="number" onClick={() => append('0')}>0</CalcButton>
        <CalcButton variant="number" onClick={() => append('.')}>.</CalcButton>
        <CalcButton variant="equals" onClick={handleEvaluate}><EqualsIcon {...iconSize} /></CalcButton>
      </ButtonGrid>
    </div>
  );
}

export function createScientificPlugin(
  handlers: {
    onClear: () => void;
    onBackspace: () => void;
  },
): CalculatorPlugin {
  return {
    meta: {
      id: 'scientific',
      name: '科学',
      icon: null,
      enabled: true,
    },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: (
        <ScientificPanel
          i18n={_i18n}
          onClear={handlers.onClear}
          onBackspace={handlers.onBackspace}
        />
      ),
    }),
  };
}
