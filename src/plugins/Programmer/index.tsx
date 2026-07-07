'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

type BaseKey = 'hex' | 'dec' | 'oct' | 'bin';

const BASE_ORDER: BaseKey[] = ['hex', 'dec', 'oct', 'bin'];
const BASE_LABELS: Record<BaseKey, string> = { hex: 'HEX', dec: 'DEC', oct: 'OCT', bin: 'BIN' };
const BASE_RADIX: Record<BaseKey, number> = { hex: 16, dec: 10, oct: 8, bin: 2 };
const ALLOWED_CHARS: Record<BaseKey, RegExp> = {
  hex: /^[0-9a-fA-F]+$/,
  dec: /^[0-9]+$/,
  oct: /^[0-7]+$/,
  bin: /^[01]+$/,
};

function formatGroup(s: string, base: BaseKey): string {
  if (!s || s === '0') {return s;}
  const neg = s.startsWith('-');
  const abs = neg ? s.slice(1) : s;
  const size = base === 'bin' ? 4 : base === 'oct' ? 3 : base === 'hex' ? 4 : 3;
  const chars = abs.split('');
  const groups: string[] = [];
  for (let i = chars.length; i > 0; i -= size) {
    groups.unshift(chars.slice(Math.max(0, i - size), i).join(''));
  }
  return (neg ? '-' : '') + groups.join(' ');
}

function ProgrammerPanel() {
  const [values, setValues] = useState<Record<BaseKey, string>>({ hex: '0', dec: '0', oct: '0', bin: '0' });
  const [activeBase, setActiveBase] = useState<BaseKey>('dec');
  const [input, setInput] = useState('0');
  const [result, setResult] = useState('');
  const wasmRef = useRef<any>(null);

  useEffect(() => {
    import('rust-calculator').then(m => { wasmRef.current = m; }).catch(() => {});
  }, []);

  const convert = useCallback((val: string, from: BaseKey) => {
    try {
      const mod = wasmRef.current;
      if (!mod) {return;}
      const json = mod.convert_base(val || '0', from);
      const arr: string[] = JSON.parse(json);
      setValues({ hex: arr[0] || '0', dec: arr[1] || '0', oct: arr[2] || '0', bin: arr[3] || '0' });
    } catch { /* ignore */ }
  }, []);

  const handleInput = useCallback((raw: string, base: BaseKey) => {
    const filtered = raw.split('').filter(c => ALLOWED_CHARS[base].test(c)).join('');
    setInput(filtered || '0');
    setActiveBase(base);
    convert(filtered || '0', base);
  }, [convert]);

  const handleDigit = useCallback((d: string, base: BaseKey) => {
    const next = input === '0' ? d : input + d;
    handleInput(next, base);
  }, [input, handleInput]);

  const handleClear = useCallback(() => {
    setInput('0');
    setValues({ hex: '0', dec: '0', oct: '0', bin: '0' });
    setResult('');
  }, []);

  const handleBackspace = useCallback(() => {
    const next = input.length <= 1 ? '0' : input.slice(0, -1);
    handleInput(next, activeBase);
  }, [input, activeBase, handleInput]);

  const handleBitOp = useCallback((op: string) => {
    const mod = wasmRef.current;
    if (!mod || input === '0') {return;}
    // 弹出结果输入框，输入第二个操作数
    // 简化设计：直接对当前值进行运算
    const currentDec = values.dec.replace(/\s/g, '');
    const r = mod.bitwise_calc(op, currentDec, '0', 'dec');
    setResult(r);
    handleInput(r, 'dec');
  }, [input, values, handleInput]);

  return (
    <div className="prog-panel">
      {/* 四进制显示行 */}
      {BASE_ORDER.map(base => (
        <div
          key={base}
          className={`prog-row ${activeBase === base ? 'prog-row--active' : ''}`}
          onClick={() => handleInput(input, base)}
        >
          <span className="prog-row__label">{BASE_LABELS[base]}</span>
          <span className="prog-row__value">{formatGroup(values[base], base)}</span>
        </div>
      ))}

      {/* 位运算按钮 */}
      <div className="prog-bit-grid">
        {['AND', 'OR', 'XOR', 'NOT', 'Lsh', 'Rsh'].map(op => (
          <button
            key={op}
            className="prog-bit-btn"
            onClick={() => handleBitOp(op.toLowerCase())}
            type="button"
          >
            {op}
          </button>
        ))}
      </div>

      {/* 数字按钮 - 十六进制 */}
      <div className="prog-digit-grid">
        {['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'].map(d => {
          const valid = ALLOWED_CHARS[activeBase].test(d);
          return (
            <button
              key={d}
              className={`prog-digit-btn ${!valid ? 'prog-digit-btn--disabled' : ''}`}
              disabled={!valid}
              onClick={() => valid && handleDigit(d, activeBase)}
              type="button"
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* 功能按钮 */}
      <div className="prog-action-bar">
        <button className="prog-action-btn" onClick={handleClear} type="button">C</button>
        <button className="prog-action-btn" onClick={handleBackspace} type="button">⌫</button>
        <span className="prog-action__hint">{BASE_LABELS[activeBase]}</span>
      </div>

      {result && <div className="prog-result">结果: {result}</div>}
    </div>
  );
}

export function createProgrammerPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'programmer', name: '程序员', icon: null, enabled: true },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <ProgrammerPanel />,
    }),
  };
}
