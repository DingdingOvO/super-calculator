'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

function ScientificPanel() {
  const [expr, setExpr] = useState('');
  const [display, setDisplay] = useState('0');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const wasmRef = useRef<any>(null);
  const exprRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('rust-calculator').then(m => { wasmRef.current = m; }).catch(() => {});
  }, []);

  const getEval = useCallback(async () => {
    if (!wasmRef.current) {
      try { wasmRef.current = await import('rust-calculator'); } catch { return null; }
    }
    return wasmRef.current.evaluate_expression;
  }, []);

  const append = useCallback((s: string) => {
    setExpr(prev => prev + s);
    setDisplay(prev => prev === '0' ? s : prev + s);
  }, []);

  const appendFn = useCallback((fn: string) => {
    setExpr(prev => prev + fn + '(');
    setDisplay(fn + '(');
  }, []);

  const handleEval = useCallback(async () => {
    if (!expr.trim()) return;
    const fn = await getEval();
    if (!fn) { setDisplay('引擎未加载'); return; }
    const start = performance.now();
    const res = fn(expr, angleMode);
    const elapsed = performance.now() - start;
    setDisplay(res + `  (${elapsed.toFixed(0)}ms)`);
    setHistory(h => [`${expr} = ${res}`, ...h].slice(0, 50));
  }, [expr, angleMode, getEval]);

  const handleClear = useCallback(() => { setExpr(''); setDisplay('0'); }, []);
  const handleClearEntry = useCallback(() => { setDisplay('0'); }, []);
  const handleBackspace = useCallback(() => {
    setExpr(prev => prev.slice(0, -1));
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  }, []);

  const handleNegate = useCallback(() => {
    setExpr(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  }, []);

  const handlePercent = useCallback(() => {
    setExpr(prev => prev + '/100');
  }, []);

  const handleReciprocal = useCallback(() => {
    setExpr(prev => '1/(' + prev + ')');
  }, []);

  // 记忆功能（前端模拟）
  const [mem, setMem] = useState<number>(0);
  const handleMC = useCallback(() => setMem(0), []);
  const handleMR = useCallback(() => { if (mem) setExpr(prev => prev + mem.toString()); }, [mem]);
  const handleMPlus = useCallback(async () => {
    const fn = await getEval();
    if (fn && expr) { const r = parseFloat(fn(expr, angleMode)); if (!isNaN(r)) setMem(m => m + r); }
  }, [expr, angleMode, getEval]);
  const handleMMinus = useCallback(async () => {
    const fn = await getEval();
    if (fn && expr) { const r = parseFloat(fn(expr, angleMode)); if (!isNaN(r)) setMem(m => m - r); }
  }, [expr, angleMode, getEval]);

  const btn = (label: string, cls: string, onClick: () => void) => (
    <button key={label} className={`sc-btn sc-btn--${cls}`} onClick={onClick} type="button">
      {label}
    </button>
  );

  const B = ({ label, cls, fn }: { label: string; cls: string; fn: () => void }) => btn(label, cls, fn);

  return (
    <div className="sc">
      {/* 显示屏 */}
      <div className="sc-display">
        <div className="sc-display__mode">{angleMode === 'deg' ? 'DEG' : 'RAD'}</div>
        <div className="sc-display__expr" ref={exprRef}>{expr || '\u00A0'}</div>
        <div className="sc-display__result">{display}</div>
      </div>

      {/* 顶行：AC C ⌫ */}
      <div className="sc-row sc-row--top">
        <B label="AC" cls="clear" fn={handleClear} />
        <B label="C" cls="clear" fn={handleClearEntry} />
        <B label="⌫" cls="clear" fn={handleBackspace} />
        <B label="DEG/RAD" cls="func" fn={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')} />
        <B label="历史" cls="func" fn={() => setShowHistory(h => !h)} />
      </div>

      {/* 历史记录浮层 */}
      {showHistory && (
        <div className="sc-history">
          <div className="sc-history__title">历史记录</div>
          {history.length === 0 && <div className="sc-history__empty">暂无记录</div>}
          {history.map((h, i) => (
            <div key={i} className="sc-history__item" onClick={() => { setExpr(h.split('=')[0]?.trim() || ''); setDisplay(h.split('=')[1]?.trim() || ''); setShowHistory(false); }}>
              {h}
            </div>
          ))}
        </div>
      )}

      {/* 行1：括号 + 记忆 */}
      <div className="sc-row">
        <B label="(" cls="func" fn={() => append('(')} />
        <B label=")" cls="func" fn={() => append(')')} />
        <B label="MC" cls="mem" fn={handleMC} />
        <B label="MR" cls="mem" fn={handleMR} />
        <B label="M+" cls="mem" fn={handleMPlus} />
        <B label="M-" cls="mem" fn={handleMMinus} />
      </div>

      {/* 行2：科学函数 */}
      <div className="sc-row">
        <B label="sin" cls="sci" fn={() => appendFn('sin')} />
        <B label="cos" cls="sci" fn={() => appendFn('cos')} />
        <B label="tan" cls="sci" fn={() => appendFn('tan')} />
        <B label="log" cls="sci" fn={() => appendFn('log')} />
        <B label="ln" cls="sci" fn={() => appendFn('ln')} />
        <B label="√" cls="sci" fn={() => appendFn('sqrt')} />
        <B label="x²" cls="sci" fn={() => append('²')} />
        <B label="x^y" cls="sci" fn={() => append('^')} />
      </div>

      {/* 行3：进阶运算 */}
      <div className="sc-row">
        <B label="asin" cls="sci" fn={() => appendFn('asin')} />
        <B label="acos" cls="sci" fn={() => appendFn('acos')} />
        <B label="atan" cls="sci" fn={() => appendFn('atan')} />
        <B label="10ˣ" cls="sci" fn={() => append('10^')} />
        <B label="eˣ" cls="sci" fn={() => appendFn('exp')} />
        <B label="!" cls="sci" fn={() => append('!')} />
        <B label="1/x" cls="sci" fn={handleReciprocal} />
        <B label="%" cls="sci" fn={handlePercent} />
      </div>

      {/* 行4-7：数字和运算符 */}
      <div className="sc-row">
        <B label="7" cls="num" fn={() => append('7')} />
        <B label="8" cls="num" fn={() => append('8')} />
        <B label="9" cls="num" fn={() => append('9')} />
        <B label="÷" cls="op" fn={() => append('/')} />
      </div>
      <div className="sc-row">
        <B label="4" cls="num" fn={() => append('4')} />
        <B label="5" cls="num" fn={() => append('5')} />
        <B label="6" cls="num" fn={() => append('6')} />
        <B label="×" cls="op" fn={() => append('*')} />
      </div>
      <div className="sc-row">
        <B label="1" cls="num" fn={() => append('1')} />
        <B label="2" cls="num" fn={() => append('2')} />
        <B label="3" cls="num" fn={() => append('3')} />
        <B label="−" cls="op" fn={() => append('-')} />
      </div>
      <div className="sc-row">
        <B label="0" cls="num" fn={() => append('0')} />
        <B label="." cls="num" fn={() => append('.')} />
        <B label="±" cls="func" fn={handleNegate} />
        <B label="π" cls="func" fn={() => append('pi')} />
        <B label="e" cls="func" fn={() => append('e')} />
        <B label="+" cls="op" fn={() => append('+')} />
        <B label="=" cls="eq" fn={handleEval} />
      </div>
    </div>
  );
}

export function createScientificPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'scientific', name: '科学', icon: null, enabled: true },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <ScientificPanel />,
    }),
  };
}
